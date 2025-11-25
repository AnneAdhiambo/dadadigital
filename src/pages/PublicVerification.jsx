import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { verifyCertificate, getStoredCertificates, hashPDF, verifyPDFHashByHash } from '../utils/certificateUtils'
import { populateTemplate } from '../utils/templateUtils'
import LoadingSpinner from '../components/LoadingSpinner'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../contexts/ThemeContext'
import { ShieldCheck, UploadCloud, CheckCircle, X, ArrowRight } from 'lucide-react'
import './PublicVerification.css'

function PublicVerification() {
  const { certificateId } = useParams()
  const { theme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  // Handle QR code links with /verify/:certificateId or ?id= / ?hash= parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    let certId = certificateId || urlParams.get('id')
    const hashParam = urlParams.get('hash')

    if (hashParam && !verificationResult) {
      handleHashVerify(hashParam)
      return
    }

    if (certId && !verificationResult) {
      setSearchQuery(certId)
      handleAutoVerify(certId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certificateId])
  const handleHashVerify = async (hashValue) => {
    if (!hashValue) return

    setIsVerifying(true)
    setVerificationResult(null)

    await new Promise(resolve => setTimeout(resolve, 500))

    try {
      const normalizedHash = hashValue.trim().toLowerCase()
      const result = verifyPDFHashByHash(normalizedHash)
      setVerificationResult({ type: 'hash', ...result })
    } catch (error) {
      console.error('Hash verification error:', error)
      setVerificationResult({ isValid: false, reason: 'An error occurred while verifying hash' })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleAutoVerify = async (certId) => {
    setIsVerifying(true)
    setVerificationResult(null)

    await new Promise(resolve => setTimeout(resolve, 800))

    try {
      const query = certId.trim().toLowerCase()
      const allCerts = getStoredCertificates()
      const certificate = allCerts.find(c => c.id.toLowerCase() === query)

      if (certificate) {
        const result = verifyCertificate(certificate)
        setVerificationResult({ type: 'id', ...result })
      } else {
        setVerificationResult({
          isValid: false,
          reason: 'Certificate ID not found'
        })
      }
    } catch (error) {
      console.error('Verification error:', error)
      setVerificationResult({ isValid: false, reason: 'An error occurred' })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsVerifying(true)
    setVerificationResult(null)

    await new Promise(resolve => setTimeout(resolve, 800))

    try {
      const query = searchQuery.trim().toLowerCase()
      const allCerts = getStoredCertificates()
      const certificate = allCerts.find(c => c.id.toLowerCase() === query)

      if (certificate) {
        const result = verifyCertificate(certificate)
        setVerificationResult({ type: 'id', ...result })
      } else {
        setVerificationResult({
          isValid: false,
          reason: 'Certificate ID not found'
        })
      }
    } catch (error) {
      console.error('Verification error:', error)
      setVerificationResult({ isValid: false, reason: 'An error occurred' })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleFileUpload = async (file) => {
    if (!file) return
    
    setIsVerifying(true)
    setVerificationResult(null)

    try {
      if (file.type === 'application/pdf') {
        const hash = await hashPDF(file)
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const result = verifyPDFHashByHash(hash)
        setVerificationResult({ type: 'file', ...result })
      } else {
        setVerificationResult({ isValid: false, reason: 'Unsupported file type. Please upload a PDF.' })
      }
    } catch (error) {
      console.error('File verification error:', error)
      setVerificationResult({ isValid: false, reason: 'Error processing file' })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const downloadCertificate = async (cert) => {
    try {
      const templateId = cert.templateId || 'minimalist'
      const pdfBlob = await populateTemplate(null, cert, templateId)
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Certificate-${cert.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download certificate')
    }
  }

  return (
    <div className="public-verify-container">
      <header className="public-header">
        <div className="header-content">
          <Link to="/" className="header-logo-link">
            <img 
              src={theme === 'dark' ? '/logo-dark.png' : '/logo.png'} 
              alt="Bitcoin Dada Logo" 
              className="header-logo-image"
            />
            <span className="header-title">Bitcoin <span className="header-title-accent">Dada</span></span>
          </Link>
        </div>
      </header>

      <main className="verify-main">
        <div className="verify-card">
          <div className="card-header">
            <h1>Verify Certificate Authenticity</h1>
            <p className="card-subtitle">
              Enter a certificate ID or upload the digital certificate file to verify its validity on the blockchain.
            </p>
          </div>

          {/* Results Section - Show first if exists */}
          {verificationResult ? (
            <>
              <div className={`verification-result ${verificationResult.isValid ? 'valid' : 'invalid'}`}>
                <div className="result-header">
                  <div className="result-icon-wrapper">
                    {verificationResult.isValid ? (
                      <CheckCircle size={32} className="result-icon" />
                    ) : (
                      <X size={32} className="result-icon" />
                    )}
                  </div>
                  <div className="result-text">
                    <h3>{verificationResult.isValid ? 'Valid Certificate' : 'Invalid Certificate'}</h3>
                    <p>{verificationResult.reason}</p>
                  </div>
                </div>

                {verificationResult.isValid && verificationResult.certificate && (
                  <div className="result-details">
                    <div className="cert-details-card">
                      <div className="cert-info">
                        <div className="detail-row">
                          <span className="detail-label">Certificate Type:</span>
                          <span className="detail-value">{verificationResult.certificate.certificateType || 'Certificate of Completion'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Student Name:</span>
                          <span className="detail-value">{verificationResult.certificate.studentName}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Course:</span>
                          <span className="detail-value">{verificationResult.certificate.courseType}</span>
                        </div>
                        {verificationResult.certificate.cohort && (
                          <div className="detail-row">
                            <span className="detail-label">Cohort:</span>
                            <span className="detail-value">{verificationResult.certificate.cohort}</span>
                          </div>
                        )}
                        <div className="detail-row">
                          <span className="detail-label">Issue Date:</span>
                          <span className="detail-value">{new Date(verificationResult.certificate.issueDate).toLocaleDateString()}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Certificate ID:</span>
                          <span className="detail-value cert-id">{verificationResult.certificate.id}</span>
                        </div>
                      </div>
                      {verificationResult.type === 'id' && (
                        <button 
                          onClick={() => downloadCertificate(verificationResult.certificate)}
                          className="btn-download-cert"
                        >
                          Download Certificate
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => {
                  setVerificationResult(null)
                  setSearchQuery('')
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                className="btn-verify-another"
              >
                Verify Another Certificate
              </button>
            </>
          ) : (
            <div className="verification-sections">
              {/* Top Section: Verify by ID */}
              <div className="verify-section verify-by-id">
                <h2 className="section-title">Verify by Certificate ID</h2>
                <form onSubmit={handleSearch} className="id-verify-form">
                  <div className="input-group">
                    <div className="input-wrapper">
                      <ShieldCheck className="input-icon" size={20} />
                      <input 
                        type="text" 
                        placeholder="Enter Certificate ID (e.g. BD-2025-XYZ)" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="id-input"
                        disabled={isVerifying}
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="btn-verify-id" 
                      disabled={isVerifying || !searchQuery.trim()}
                    >
                      {isVerifying ? (
                        <LoadingSpinner size="small" color="white" />
                      ) : (
                        <>
                          Verify ID <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Bottom Section: Verify by Document */}
              <div className="verify-section verify-by-document">
                <h2 className="section-title">Verify by Document Upload</h2>
                <div 
                  className={`upload-zone ${dragActive ? 'active' : ''} ${isVerifying ? 'processing' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => !isVerifying && fileInputRef.current.click()}
                >
                  {isVerifying ? (
                    <div className="upload-loading">
                      <LoadingSpinner size="large" color="orange" />
                      <p>Processing document...</p>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="upload-icon-large" size={48} />
                      <p className="upload-label">Upload File</p>
                      <p className="upload-hint">.pdf only</p>
                    </>
                  )}
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="application/pdf"
                    className="hidden-input"
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                    disabled={isVerifying}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
      
      <footer className="public-footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} Bitcoin Dada Digital Systems. All rights reserved.</p>
          <Link to="/admin/login" className="admin-link">Admin Login</Link>
        </div>
      </footer>
      <ThemeToggle variant="floating" />
    </div>
  )
}

export default PublicVerification