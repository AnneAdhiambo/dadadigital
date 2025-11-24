import { useState, useEffect } from 'react'
import { populateTemplate } from '../utils/templateUtils'
import { downloadPDF } from '../utils/pdfTemplateUtils'
import { hashPDF, updateCertificatePDFHash } from '../utils/certificateUtils'
import { publishToNostr, storeNostrEventInfo, isCertificatePublishedToNostr } from '../utils/nostrUtils'
import { Zap, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import './CertificatePreview.css'

function CertificatePreview({ certificate, showDownload = false }) {
  const [generating, setGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState(null)
  const [nostrStatus, setNostrStatus] = useState(null) // 'publishing', 'success', 'error', null
  const [nostrResult, setNostrResult] = useState(null)
  const [nostrProgress, setNostrProgress] = useState(null) // Real-time progress updates
  const [pdfBlob, setPdfBlob] = useState(null) // Store PDF blob for download button
  const [publishingSteps, setPublishingSteps] = useState([]) // Track publishing steps

  const verificationUrl = `${window.location.origin}/verify/${certificate.id}`

  const generatePreview = async () => {
    if (!certificate) {
      setError('No certificate data provided')
      return
    }
    
    setGenerating(true)
    setError(null)
    
    // Clean up old preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    
    try {
      console.log('Generating preview for certificate:', certificate)
      const templateId = certificate.templateId || 'achievement'
      console.log('Using template ID:', templateId)
      
      const pdfBlob = await populateTemplate(null, certificate, templateId)
      
      if (!pdfBlob || pdfBlob.size === 0) {
        throw new Error('Generated PDF is empty')
      }
      
      console.log('PDF generated successfully, size:', pdfBlob.size, 'bytes')
      
      // Create preview URL
      const url = URL.createObjectURL(pdfBlob)
      setPreviewUrl(url)
      console.log('Preview URL created')
    } catch (error) {
      console.error('Error generating preview:', error)
      setError(error.message || 'Failed to generate certificate preview')
    } finally {
      setGenerating(false)
    }
  }

  const generateAndPublishCertificate = async () => {
    if (!certificate) return

    setGenerating(true)
    setNostrStatus('publishing')
    setPublishingSteps([])
    setNostrProgress(null)
    
    try {
      const templateId = certificate.templateId || 'achievement'
      console.log('Generating PDF certificate...')
      
      // Step 1: Generate PDF
      addPublishingStep('Generating PDF certificate...', 'in_progress')
      const pdfBlob = await populateTemplate(null, certificate, templateId)
      setPdfBlob(pdfBlob) // Store for download button
      addPublishingStep('PDF generated successfully', 'completed')
      
      // Step 2: Hash the PDF
      let pdfHash
      try {
        addPublishingStep('Calculating SHA-256 hash...', 'in_progress')
        pdfHash = await hashPDF(pdfBlob)
        addPublishingStep('PDF hash calculated', 'completed')
      } catch (hashError) {
        console.error('Error hashing PDF:', hashError)
        addPublishingStep('Hash calculation failed', 'error')
      }
      
      // Step 3: Store the hash
      if (pdfHash) {
        try {
          addPublishingStep('Storing hash...', 'in_progress')
          const updated = updateCertificatePDFHash(certificate.id, pdfHash)
          if (updated) {
            addPublishingStep('Hash stored', 'completed')
            
            // Step 4: Publish to Nostr if not already published
            if (!isCertificatePublishedToNostr(updated)) {
              try {
                addPublishingStep('Publishing to Nostr...', 'in_progress')
                
                const nostrResult = await publishToNostr(updated, (progress) => {
                  setNostrProgress(progress)
                  if (progress.step === 'signing' || progress.step === 'publishing') {
                    addPublishingStep(progress.message, progress.status === 'in_progress' ? 'in_progress' : 'completed')
                  } else if (progress.step === 'completed') {
                    addPublishingStep(progress.message, 'completed')
                  }
                })
                
                // Store Nostr event info
                if (nostrResult.eventId) {
                  storeNostrEventInfo(updated.id, nostrResult.eventId, nostrResult.pubKey)
                  
                  setNostrResult({
                    eventId: nostrResult.eventId,
                    pubKey: nostrResult.pubKeyBech32,
                    publishedTo: nostrResult.publishedTo,
                    totalRelays: nostrResult.totalRelays
                  })
                }
                
                if (nostrResult.publishedTo > 0) {
                  setNostrStatus('success')
                  addPublishingStep(`Published to ${nostrResult.publishedTo}/${nostrResult.totalRelays} relays ✓`, 'completed')
                } else {
                  setNostrStatus('error')
                  addPublishingStep('Failed to publish to Nostr', 'error')
                }
              } catch (nostrError) {
                console.error('Error publishing to Nostr:', nostrError)
                setNostrStatus('error')
                setNostrResult({ error: nostrError.message || 'Failed to publish to Nostr' })
                addPublishingStep('Nostr publishing failed', 'error')
              }
            } else {
              addPublishingStep('Certificate already published', 'completed')
            }
          } else {
            console.error(`⚠ Failed to store PDF hash - certificate not found`)
            addPublishingStep('Failed to store PDF hash', 'error')
          }
        } catch (storeError) {
          console.error('Error storing PDF hash:', storeError)
          addPublishingStep('Error storing PDF hash', 'error')
        }
      } else {
        console.error('No PDF hash to store!')
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      addPublishingStep('Error generating PDF', 'error')
      alert('Error generating PDF. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const addPublishingStep = (message, status) => {
    setPublishingSteps(prev => [...prev, {
      message,
      status,
      timestamp: new Date()
    }])
  }

  const downloadPDFFile = () => {
    if (pdfBlob) {
      const filename = `Certificate-${certificate.id}.pdf`
      downloadPDF(pdfBlob, filename)
    } else {
      alert('PDF not ready yet. Please wait for generation to complete.')
    }
  }

  // Auto-generate preview on mount
  useEffect(() => {
    if (certificate) {
      generatePreview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certificate])
  
  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  return (
    <div className="certificate-preview-container">
      <div className="certificate-pdf-preview">
        {generating ? (
          <div className="certificate-loading">
            <div className="publishing-status-container">
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={24} />
                Publishing Certificate to Nostr
              </h3>
              
              {/* Feature highlights */}
              <div className="feature-highlights">
                <div className="feature-item">
                  <CheckCircle size={16} />
                  <span>Automatic publishing after PDF generation</span>
                </div>
                <div className="feature-item">
                  <CheckCircle size={16} />
                  <span>Publishing to Nostr (Kind 1 - Text Note)</span>
                </div>
                <div className="feature-item">
                  <CheckCircle size={16} />
                  <span>Multiple relay support (4 relays)</span>
                </div>
                <div className="feature-item">
                  <CheckCircle size={16} />
                  <span>Cryptographic signing with private key</span>
                </div>
                <div className="feature-item">
                  <CheckCircle size={16} />
                  <span>Persistent storage in localStorage</span>
                </div>
              </div>

              {/* Publishing steps */}
              <div className="publishing-steps">
                <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Publishing Steps:</h4>
                {publishingSteps.length === 0 ? (
                  <div className="step-item">
                    <Loader size={16} className="animate-spin" />
                    <span>Initializing...</span>
                  </div>
                ) : (
                  publishingSteps.map((step, index) => (
                    <div key={index} className={`step-item step-${step.status}`}>
                      {step.status === 'in_progress' ? (
                        <Loader size={16} className="animate-spin" />
                      ) : step.status === 'completed' ? (
                        <CheckCircle size={16} color="#059669" />
                      ) : step.status === 'error' ? (
                        <AlertCircle size={16} color="#dc2626" />
                      ) : (
                        <Loader size={16} className="animate-spin" />
                      )}
                      <span>{step.message}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Current relay status */}
              {nostrProgress && nostrProgress.currentRelay && (
                <div className="current-relay-status">
                  <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
                    Current: {nostrProgress.currentRelay.replace('wss://', '')}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : error ? (
          <div className="certificate-error">
            <p><strong>Error:</strong> {error}</p>
            <button onClick={generatePreview} className="btn-generate-preview">
              Try Again
            </button>
          </div>
        ) : previewUrl ? (
          <iframe
            src={previewUrl}
            className="pdf-preview-iframe"
            title="Certificate Preview"
            onError={(e) => {
              console.error('Iframe error:', e)
              setError('Failed to load PDF preview')
            }}
          />
        ) : (
          <div className="certificate-placeholder">
            <p>Certificate preview will appear here</p>
            <button onClick={generatePreview} className="btn-generate-preview">
              Generate Preview
            </button>
          </div>
        )}
      </div>

      <div className="certificate-info">
        <div className="info-section">
          <h3>Certificate Details</h3>
          <p><strong>Student:</strong> {certificate.studentName}</p>
          <p><strong>Course:</strong> {certificate.courseType}</p>
          <p><strong>Cohort:</strong> {certificate.cohort}</p>
          <p><strong>Type:</strong> {certificate.certificateType || 'Certificate of Completion'}</p>
          <p><strong>Issue Date:</strong> {new Date(certificate.issueDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
          <p><strong>Certificate ID:</strong> {certificate.id}</p>
          <p><strong>Verification URL:</strong> <a href={verificationUrl} target="_blank" rel="noopener noreferrer">{verificationUrl}</a></p>
          
          {/* Nostr Publishing Status */}
          {certificate.pdfHash && (
            <div className="nostr-status-section">
              <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={18} />
                Nostr Publishing
              </h4>
              {isCertificatePublishedToNostr(certificate) ? (
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#d1fae5', 
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle size={16} color="#059669" />
                    <span style={{ color: '#059669', fontWeight: '500' }}>
                      Published to Nostr
                    </span>
                  </div>
                  {certificate.nostrEventId && (
                    <div style={{ fontSize: '0.8rem', color: '#059669', opacity: '0.8', marginBottom: '0.25rem' }}>
                      Event ID: {certificate.nostrEventId.substring(0, 16)}...
                    </div>
                  )}
                  {certificate.nostrEventId && (
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #a7f3d0', fontSize: '0.8rem', color: '#059669', opacity: 0.8 }}>
                      Event ID: {certificate.nostrEventId.substring(0, 16)}...
                      <div style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>
                        View on any Nostr client (Damus, Amethyst, Snort)
                      </div>
                    </div>
                  )}
                </div>
              ) : nostrStatus === 'publishing' ? (
                <div style={{ 
                  padding: '0.5rem', 
                  backgroundColor: '#dbeafe', 
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  <Loader size={16} className="animate-spin" color="#2563eb" />
                  <span style={{ color: '#2563eb' }}>Publishing to Nostr...</span>
                </div>
              ) : nostrStatus === 'success' && nostrResult ? (
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#d1fae5', 
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle size={16} color="#059669" />
                    <span style={{ color: '#059669', fontWeight: '500' }}>
                      Published to {nostrResult.publishedTo}/{nostrResult.totalRelays} relays
                    </span>
                  </div>
                  {nostrResult.eventId && (
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #a7f3d0', fontSize: '0.8rem', color: '#059669', opacity: 0.8 }}>
                      Event ID: {nostrResult.eventId.substring(0, 16)}...
                      <div style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>
                        View on any Nostr client
                      </div>
                    </div>
                  )}
                  {nostrResult.eventId && (
                    <div style={{ fontSize: '0.8rem', color: '#059669', opacity: 0.8, marginBottom: '0.25rem' }}>
                      Event ID: {nostrResult.eventId.substring(0, 16)}...
                    </div>
                  )}
                </div>
              ) : nostrStatus === 'error' ? (
                <div style={{ 
                  padding: '0.5rem', 
                  backgroundColor: '#fee2e2', 
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  <AlertCircle size={16} color="#dc2626" />
                  <span style={{ color: '#dc2626' }}>
                    Failed to publish to Nostr
                    {nostrResult?.error && (
                      <span style={{ fontSize: '0.8rem', display: 'block', marginTop: '0.25rem', opacity: 0.8 }}>
                        {nostrResult.error}
                      </span>
                    )}
                  </span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {showDownload && (
        <div className="download-section">
          {!generating && pdfBlob && (
            <button 
              onClick={downloadPDFFile} 
              className="btn-download"
            >
              Download PDF Certificate
            </button>
          )}
          {!generating && !pdfBlob && (
            <button 
              onClick={generateAndPublishCertificate} 
              className="btn-download"
            >
              Generate & Publish Certificate
            </button>
          )}
          {generating && (
            <div className="generating-message">
              <Loader size={18} className="animate-spin" style={{ marginRight: '0.5rem' }} />
              <span>Generating and publishing certificate...</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CertificatePreview

