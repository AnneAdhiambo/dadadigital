import { useState, useEffect } from 'react'
import { getStoredSignatures, getSignatureRequests, deleteSignature, deleteSignatureRequest, getUnreadNotificationsCount, markAllNotificationsAsRead, createSignatureRequest } from '../utils/signatureUtils'
import { Info } from 'lucide-react'
import './Signatures.css'

function Signatures() {
  const [signatures, setSignatures] = useState([])
  const [requests, setRequests] = useState([])
  const [activeTab, setActiveTab] = useState('signatures') // 'signatures' or 'requests'
  const [selectedSignature, setSelectedSignature] = useState(null)
  const [showCreateRequest, setShowCreateRequest] = useState(false)
  const [newRequest, setNewRequest] = useState({
    signerName: '',
    signerEmail: '',
    notes: '',
    expiresInDays: 30
  })
  const [copiedLink, setCopiedLink] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [deleteDialog, setDeleteDialog] = useState(null) // { type: 'signature' | 'request', id: string, name: string }

  useEffect(() => {
    loadData()
    // Check for unread notifications
    const count = getUnreadNotificationsCount()
    setUnreadCount(count)
    
    // Mark all as read when viewing signatures page
    if (count > 0) {
      markAllNotificationsAsRead()
      setUnreadCount(0)
    }
  }, [])

  const loadData = () => {
    const sigs = getStoredSignatures()
    const reqs = getSignatureRequests()
    // Sort by date (newest first)
    setSignatures([...sigs].sort((a, b) => new Date(b.signedAt) - new Date(a.signedAt)))
    setRequests([...reqs].sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)))
  }

  const handleCreateRequest = () => {
    if (!newRequest.signerName.trim()) {
      alert('Please enter a signer name')
      return
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (newRequest.expiresInDays || 30))

    const request = createSignatureRequest({
      signerName: newRequest.signerName,
      signerEmail: newRequest.signerEmail,
      notes: newRequest.notes,
      expiresAt: expiresAt.toISOString()
    })

    setNewRequest({
      signerName: '',
      signerEmail: '',
      notes: '',
      expiresInDays: 30
    })
    setShowCreateRequest(false)
    loadData()
    
    // Copy link to clipboard
    navigator.clipboard.writeText(request.link)
    setCopiedLink(request.id)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const handleCopyLink = (link, requestId) => {
    navigator.clipboard.writeText(link)
    setCopiedLink(requestId)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const handleDeleteSignature = (signatureId) => {
    const signature = signatures.find(sig => sig.id === signatureId)
    if (signature) {
      setDeleteDialog({
        type: 'signature',
        id: signatureId,
        name: signature.signerName
      })
    }
  }

  const handleDeleteRequest = (requestId) => {
    const request = requests.find(req => req.id === requestId)
    if (request) {
      setDeleteDialog({
        type: 'request',
        id: requestId,
        name: request.signerName || 'this request'
      })
    }
  }

  const confirmDelete = () => {
    if (!deleteDialog) return

    if (deleteDialog.type === 'signature') {
      deleteSignature(deleteDialog.id)
      if (selectedSignature?.id === deleteDialog.id) {
        setSelectedSignature(null)
      }
    } else {
      deleteSignatureRequest(deleteDialog.id)
    }
    
    loadData()
    setDeleteDialog(null)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="signatures-page">
      <div className="signatures-header">
        <h1>Signatures</h1>
        <div className="header-actions-row">
          <div className="info-card">
            <Info size={18} className="info-icon" />
            <div className="info-content">
              <p className="info-title">Manage Signature Requests</p>
              <p className="info-text">Create signature requests, send links to signers, and view all collected signatures in one place.</p>
            </div>
          </div>
          <button
            className="btn-primary btn-create-request"
            onClick={() => setShowCreateRequest(true)}
          >
            <span>+</span>
            <span>Create Request</span>
          </button>
        </div>
      </div>

      {unreadCount > 0 && (
        <div className="notification-banner">
          You have {unreadCount} new signature notification{unreadCount !== 1 ? 's' : ''}
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'signatures' ? 'active' : ''}`}
          onClick={() => setActiveTab('signatures')}
        >
          Collected Signatures ({signatures.length})
        </button>
        <button
          className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Signature Requests ({requests.length})
        </button>
      </div>

      {activeTab === 'signatures' && (
        <div className="signatures-content">
          {signatures.length === 0 ? (
            <div className="empty-state">
              <p>No signatures collected yet.</p>
              <p className="empty-state-subtitle">Create a signature request to get started.</p>
            </div>
          ) : (
            <div className="signatures-grid">
              {signatures.map(sig => (
                <div key={sig.id} className="signature-card">
                  <div className="signature-card-header">
                    <h3>{sig.signerName}</h3>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteSignature(sig.id)}
                      title="Delete signature"
                    >
                      ×
                    </button>
                  </div>
                  <div className="signature-preview">
                    <img
                      src={sig.signatureData}
                      alt={`Signature by ${sig.signerName}`}
                      onClick={() => setSelectedSignature(sig)}
                    />
                  </div>
                  <div className="signature-card-footer">
                    <span className="signature-date">{formatDate(sig.signedAt)}</span>
                    {sig.requestId && (
                      <span className="signature-badge">Request: {sig.requestId.substring(0, 12)}...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="requests-content">
          {requests.length === 0 ? (
            <div className="empty-state">
              <p>No signature requests yet.</p>
              <button
                className="btn-primary"
                onClick={() => setShowCreateRequest(true)}
              >
                Create Your First Request
              </button>
            </div>
          ) : (
            <div className="requests-table-container">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Signer Name</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th>Link</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id}>
                      <td>{req.signerName || 'N/A'}</td>
                      <td>
                        <span className={`status-badge status-${req.status}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>{formatDate(req.requestedAt)}</td>
                      <td>
                        <button
                          className="btn-link"
                          onClick={() => handleCopyLink(req.link, req.id)}
                        >
                          {copiedLink === req.id ? '✓ Copied!' : 'Copy Link'}
                        </button>
                      </td>
                      <td>
                        <div className="table-actions">
                          <a
                            href={req.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-view"
                          >
                            View
                          </a>
                          <button
                            className="btn-delete-sm"
                            onClick={() => handleDeleteRequest(req.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Request Modal */}
      {showCreateRequest && (
        <div className="modal-overlay" onClick={() => setShowCreateRequest(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create Signature Request</h2>
            <div className="form-group">
              <label>Signer Name *</label>
              <input
                type="text"
                value={newRequest.signerName}
                onChange={(e) => setNewRequest({ ...newRequest, signerName: e.target.value })}
                placeholder="John Doe"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Signer Email (Optional)</label>
              <input
                type="email"
                value={newRequest.signerEmail}
                onChange={(e) => setNewRequest({ ...newRequest, signerEmail: e.target.value })}
                placeholder="john@example.com"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Notes (Optional)</label>
              <textarea
                value={newRequest.notes}
                onChange={(e) => setNewRequest({ ...newRequest, notes: e.target.value })}
                placeholder="Additional instructions or context..."
                className="form-textarea"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Expires In (Days)</label>
              <input
                type="number"
                value={newRequest.expiresInDays}
                onChange={(e) => setNewRequest({ ...newRequest, expiresInDays: parseInt(e.target.value) || 30 })}
                min="1"
                max="365"
                className="form-input"
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowCreateRequest(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleCreateRequest}
              >
                Create Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Detail Modal */}
      {selectedSignature && (
        <div className="modal-overlay" onClick={() => setSelectedSignature(null)}>
          <div className="modal-content signature-detail-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Signature Details</h2>
            <div className="signature-detail-content">
              <div className="signature-detail-info">
                <div className="detail-row">
                  <span className="detail-label">Signer Name:</span>
                  <span className="detail-value">{selectedSignature.signerName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Signed At:</span>
                  <span className="detail-value">{formatDate(selectedSignature.signedAt)}</span>
                </div>
                {selectedSignature.requestId && (
                  <div className="detail-row">
                    <span className="detail-label">Request ID:</span>
                    <span className="detail-value">{selectedSignature.requestId}</span>
                  </div>
                )}
              </div>
              <div className="signature-detail-image">
                <img src={selectedSignature.signatureData} alt="Signature" />
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = selectedSignature.signatureData
                  link.download = `signature-${selectedSignature.id}.png`
                  link.click()
                }}
              >
                Download Signature
              </button>
              <button
                className="btn-cancel"
                onClick={() => setSelectedSignature(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog && (
        <div className="modal-overlay" onClick={() => setDeleteDialog(null)}>
          <div className="modal-content delete-dialog" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Delete</h2>
            <p className="delete-message">
              Are you sure you want to delete {deleteDialog.type === 'signature' 
                ? `the signature from ${deleteDialog.name}?` 
                : `the signature request for ${deleteDialog.name}?`}
            </p>
            <p className="delete-warning">This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setDeleteDialog(null)}
              >
                Cancel
              </button>
              <button
                className="btn-delete-confirm"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Signatures

