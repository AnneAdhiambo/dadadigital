import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStoredCertificates, revokeCertificate } from '../utils/certificateUtils'
import { populateTemplate } from '../utils/templateUtils'
import { sendCertificateEmail, isEmailJSConfigured } from '../utils/emailUtils'
import './Dashboard.css'

function Dashboard() {
  const [certificates, setCertificates] = useState([])
  const [filteredCertificates, setFilteredCertificates] = useState([])
  const [displayedCertificates, setDisplayedCertificates] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [viewingId, setViewingId] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'active', 'revoked'
  const [certificateToRevoke, setCertificateToRevoke] = useState(null)
  const [emailModal, setEmailModal] = useState(null) // { certificate: cert, email: '' }
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState(null)
  
  const certificatesPerPage = 4
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    thisMonth: 0,
    thisYear: 0
  })

  useEffect(() => {
    loadCertificates()
  }, [])

  // Filter certificates when search query, status filter, or certificates change
  useEffect(() => {
    let filtered = certificates
    
    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(cert => cert.status !== 'revoked')
    } else if (statusFilter === 'revoked') {
      filtered = filtered.filter(cert => cert.status === 'revoked')
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(cert => 
        cert.studentName.toLowerCase().includes(query) ||
        cert.id.toLowerCase().includes(query) ||
        cert.courseType.toLowerCase().includes(query) ||
        (cert.cohort && cert.cohort.toLowerCase().includes(query))
      )
    }
    
    setFilteredCertificates(filtered)
    setCurrentPage(1) // Reset to first page on filter/search change
  }, [searchQuery, statusFilter, certificates])

  // Update displayed (paginated) certificates
  useEffect(() => {
    const endIndex = currentPage * certificatesPerPage
    const newCerts = filteredCertificates.slice(0, endIndex)
    setDisplayedCertificates(newCerts)
  }, [filteredCertificates, currentPage])

  const loadCertificates = () => {
    const certs = getStoredCertificates()
    // Sort by date (newest first)
    const sortedCerts = [...certs].sort((a, b) => {
      return new Date(b.issueDate || b.createdAt) - new Date(a.issueDate || a.createdAt)
    })
    setCertificates(sortedCerts)
    
    const now = new Date()
    const thisMonth = certs.filter(cert => {
      const certDate = new Date(cert.issueDate)
      return certDate.getMonth() === now.getMonth() && 
             certDate.getFullYear() === now.getFullYear()
    }).length
    
    const thisYear = certs.filter(cert => {
      const certDate = new Date(cert.issueDate)
      return certDate.getFullYear() === now.getFullYear()
    }).length

    const verified = certs.filter(cert => cert.status !== 'revoked').length

    setStats({
      total: certs.length,
      verified,
      thisMonth,
      thisYear
    })
  }

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1)
  }

  const handleViewCertificate = async (cert) => {
    if (viewingId) return
    
    try {
      setViewingId(cert.id)
      const templateId = cert.templateId || 'minimalist'
      const pdfBlob = await populateTemplate(null, cert, templateId)
      const url = URL.createObjectURL(pdfBlob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      console.error('Error viewing certificate:', error)
      alert('Failed to generate certificate preview. Please try again.')
    } finally {
      setViewingId(null)
    }
  }

  const handleRevokeClick = (cert) => {
    setCertificateToRevoke(cert)
  }

  const confirmRevoke = () => {
    if (certificateToRevoke) {
      const success = revokeCertificate(certificateToRevoke.id)
      if (success) {
        loadCertificates() // Reload list
        setCertificateToRevoke(null)
      } else {
        alert('Failed to revoke certificate.')
      }
    }
  }

  const handleSendEmailClick = (cert) => {
    setEmailModal({
      certificate: cert,
      email: ''
    })
    setEmailStatus(null)
  }

  const handleSendEmail = async () => {
    console.log('📧 handleSendEmail called:', {
      emailModal: emailModal,
      emailValue: emailModal?.email,
      emailTrimmed: emailModal?.email?.trim(),
      hasEmail: !!emailModal?.email,
      emailLength: emailModal?.email?.length
    })
    
    if (!emailModal || !emailModal.email || !emailModal.email.trim()) {
      console.error('❌ Email validation failed:', {
        emailModal: emailModal,
        emailValue: emailModal?.email
      })
      setEmailStatus({
        success: false,
        message: 'Please enter a valid email address'
      })
      return
    }

    if (!isEmailJSConfigured()) {
      setEmailStatus({
        success: false,
        message: 'EmailJS is not configured. Please set up environment variables.'
      })
      return
    }

    setIsSendingEmail(true)
    setEmailStatus(null)

    try {
      const emailToSend = emailModal.email.trim()
      console.log('📤 Calling sendCertificateEmail with:', {
        certificate: emailModal.certificate,
        email: emailToSend,
        emailType: typeof emailToSend,
        templateId: emailModal.certificate.templateId || 'minimalist'
      })
      
      const result = await sendCertificateEmail(
        emailModal.certificate,
        emailToSend,
        emailModal.certificate.templateId || 'minimalist'
      )

      if (result.success) {
        setEmailStatus({
          success: true,
          message: 'Certificate email sent successfully! 🎉'
        })
        // Close modal after 2 seconds on success
        setTimeout(() => {
          setEmailModal(null)
          setEmailStatus(null)
        }, 2000)
      } else {
        setEmailStatus({
          success: false,
          message: result.error || 'Failed to send email'
        })
      }
    } catch (error) {
      setEmailStatus({
        success: false,
        message: error.message || 'An error occurred while sending the email'
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  const hasMore = displayedCertificates.length < filteredCertificates.length

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="header-actions">
          <Link to="/batch" className="btn-secondary">
            Batch Processing
          </Link>
          <Link to="/issue" className="btn-primary">
            Issue New Certificate
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Certificates</div>
        </div>
        <div className="stat-card stat-card-white">
          <div className="stat-value stat-value-dark">{stats.verified}</div>
          <div className="stat-label stat-label-dark">Verified Certificates</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.thisMonth}</div>
          <div className="stat-label">This Month</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.thisYear}</div>
          <div className="stat-label">This Year</div>
        </div>
      </div>

      <div className="recent-certificates">
        <div className="list-header">
          <h2>Recent Certificates</h2>
          
          <div className="list-controls">
            <div className="filter-group">
              <div className="search-bar">
                <input 
                  type="text" 
                  placeholder="Search by name, ID, course..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="status-filters">
                <button 
                  className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </button>
                <button 
                  className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('active')}
                >
                  Active
                </button>
                <button 
                  className={`filter-btn ${statusFilter === 'revoked' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('revoked')}
                >
                  Revoked
                </button>
              </div>
            </div>
            
            <div className="view-toggles">
              <button 
                className={`btn-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                ⊞
              </button>
              <button 
                className={`btn-toggle ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                ≡
              </button>
            </div>
          </div>
        </div>

        {filteredCertificates.length === 0 ? (
          <div className="empty-state">
            <p>{searchQuery ? 'No certificates match your search.' : 'No certificates issued yet.'}</p>
            {!searchQuery && (
              <Link to="/issue" className="btn-primary">
                Issue Your First Certificate
              </Link>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="certificates-list">
                {displayedCertificates.map(cert => (
                  <div key={cert.id} className={`certificate-card ${cert.status === 'revoked' ? 'revoked' : ''}`}>
                    <div className="cert-card-header">
                      <span className="cert-id">{cert.id}</span>
                      <span className="cert-date">{new Date(cert.issueDate || cert.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="cert-card-body">
                      <h3>{cert.studentName}</h3>
                      <p>{cert.courseType} - {cert.cohort}</p>
                      {cert.status === 'revoked' && <span className="badge-revoked">REVOKED</span>}
                    </div>
                    <div className="cert-card-footer">
                      <button 
                        onClick={() => handleViewCertificate(cert)} 
                        className="btn-view"
                        disabled={viewingId === cert.id}
                      >
                        {viewingId === cert.id ? 'Loading...' : 'View Cert'}
                      </button>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {isEmailJSConfigured() && cert.status !== 'revoked' && (
                          <button 
                            onClick={() => handleSendEmailClick(cert)}
                            className="btn-email"
                            title="Send via Email"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#f0b400',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              padding: '0.5rem 1rem'
                            }}
                          >
                            📧 Email
                          </button>
                        )}
                        
                        {cert.status !== 'revoked' ? (
                          <button 
                            onClick={() => handleRevokeClick(cert)}
                            className="btn-revoke-text"
                          >
                            Revoke
                          </button>
                        ) : (
                          <span className="text-revoked">Revoked</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="certificates-table-container">
                <table className="certificates-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Student Name</th>
                      <th>Course</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedCertificates.map(cert => (
                      <tr key={cert.id} className={cert.status === 'revoked' ? 'row-revoked' : ''}>
                        <td className="font-mono">{cert.id}</td>
                        <td>{cert.studentName}</td>
                        <td>{cert.courseType}</td>
                        <td>{new Date(cert.issueDate || cert.createdAt).toLocaleDateString()}</td>
                        <td>
                          {cert.status === 'revoked' ? (
                            <span className="badge-revoked">REVOKED</span>
                          ) : (
                            <span className="badge-active">Active</span>
                          )}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button 
                              onClick={() => handleViewCertificate(cert)} 
                              className="btn-view-sm"
                              disabled={viewingId === cert.id}
                            >
                              View
                            </button>
                            <Link to={`/verify/${cert.id}`} className="btn-link-sm">
                              Verify
                            </Link>
                            {isEmailJSConfigured() && cert.status !== 'revoked' && (
                              <button 
                                onClick={() => handleSendEmailClick(cert)}
                                className="btn-email-sm"
                                title="Send via Email"
                                style={{
                                  padding: '0.25rem 0.75rem',
                                  fontSize: '0.75rem',
                                  background: '#fff',
                                  border: '1px solid #f0b400',
                                  color: '#f0b400',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontWeight: 600
                                }}
                              >
                                📧 Email
                              </button>
                            )}
                            {cert.status !== 'revoked' && (
                              <button 
                                onClick={() => handleRevokeClick(cert)}
                                className="btn-revoke-sm"
                                title="Revoke"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {hasMore && (
              <div className="load-more-container">
                <button onClick={handleLoadMore} className="btn-load-more">
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Email Modal */}
      {emailModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>📧 Send Certificate via Email</h3>
            <p>
              Send certificate to:
            </p>
            <p className="modal-cert-name">{emailModal.certificate.studentName}</p>
            <p className="modal-cert-id">ID: {emailModal.certificate.id}</p>
            
            <div style={{ marginTop: '1.5rem' }}>
              <label htmlFor="email-input" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Recipient Email:
              </label>
              <input
                id="email-input"
                type="email"
                value={emailModal.email}
                onChange={(e) => setEmailModal({ ...emailModal, email: e.target.value })}
                placeholder="student@example.com"
                className="form-input"
                style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem' }}
                disabled={isSendingEmail}
              />
              
              {emailStatus && (
                <div style={{
                  padding: '0.75rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  background: emailStatus.success ? '#e6f4ea' : '#fce8e6',
                  color: emailStatus.success ? '#1e7e34' : '#c5221f',
                  fontSize: '0.875rem'
                }}>
                  {emailStatus.message}
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={() => {
                  setEmailModal(null)
                  setEmailStatus(null)
                }}
                className="btn-cancel"
                disabled={isSendingEmail}
              >
                Cancel
              </button>
              <button 
                onClick={handleSendEmail}
                className="btn-primary"
                disabled={isSendingEmail || !emailModal.email}
                style={{ background: '#f0b400', color: '#000' }}
              >
                {isSendingEmail ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Dialog */}
      {certificateToRevoke && (
        <div className="modal-overlay">
          <div className="modal-content destructive">
            <h3>⚠ Warning: Destructive Action</h3>
            <p>
              You are about to <strong>REVOKE</strong> the certificate for:
            </p>
            <p className="modal-cert-name">{certificateToRevoke.studentName}</p>
            <p className="modal-cert-id">ID: {certificateToRevoke.id}</p>
            <div className="warning-box">
              <p>This action cannot be undone.</p>
              <p>The certificate will be permanently marked as INVALID.</p>
              <p>Verification will fail for this certificate ID.</p>
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => setCertificateToRevoke(null)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button 
                onClick={confirmRevoke}
                className="btn-revoke-confirm"
              >
                Yes, Revoke Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard

