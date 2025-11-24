import { useState, useEffect, useRef } from 'react'
import { generateCertificateId, createDigitalSignature, saveCertificate, getStoredCertificates } from '../utils/certificateUtils'
import { getAllTemplates, populateTemplate } from '../utils/templateUtils'
import { sendCertificateEmail, isEmailJSConfigured, initEmailJS } from '../utils/emailUtils'
import { hashPDF, updateCertificatePDFHash } from '../utils/certificateUtils'
import { downloadPDF } from '../utils/pdfTemplateUtils'
import { Database, Printer, Download, Calendar, CheckCircle, Palette, Loader2, AlertCircle, Zap, ExternalLink, Copy, Mail } from 'lucide-react'
import TemplateSelector from '../components/TemplateSelector'
import { useTheme } from '../contexts/ThemeContext'
import './IssueCertificateWizard.css'

function IssueCertificateWizard() {
  const { theme } = useTheme()
  const terminalRef = useRef(null)
  const [selectedTemplate, setSelectedTemplate] = useState('achievement')
  const [formData, setFormData] = useState({
    studentName: '',
    courseType: 'Bitcoin & Blockchain Fundamentals',
    issueDate: new Date().toISOString().split('T')[0],
    instructor: '',
    studentEmail: ''
  })
  const [previewCertificate, setPreviewCertificate] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewError, setPreviewError] = useState(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState(null)
  const [generatedCertificate, setGeneratedCertificate] = useState(null)
  const [studentNames, setStudentNames] = useState([])
  const [showTemplateSelector, setShowTemplateSelector] = useState(true)
  const [nostrStatus, setNostrStatus] = useState(null) // 'idle', 'publishing', 'success', 'error'
  const [nostrProgress, setNostrProgress] = useState(null)
  const [nostrSteps, setNostrSteps] = useState([])
  const [nostrEventId, setNostrEventId] = useState(null)
  const [nostrPubKey, setNostrPubKey] = useState(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailToSend, setEmailToSend] = useState('')

  const templates = getAllTemplates()
  const courses = [
    'Bitcoin & Blockchain Fundamentals',
    'Advanced Bitcoin Development',
    'Web3 Fundamentals',
    'Smart Contracts & DeFi',
    'Cryptocurrency Trading',
    'Blockchain Security'
  ]

  useEffect(() => {
    initEmailJS()
    const certificates = getStoredCertificates()
    const names = [...new Set(certificates.map(cert => cert.studentName))].sort()
    setStudentNames(names)
    
    // Set default template
    if (templates.length > 0 && !selectedTemplate) {
      setSelectedTemplate(templates[0].id)
    }
  }, [])

  // Force preview generation on mount
  useEffect(() => {
    if (selectedTemplate) {
      const initialCert = {
        id: 'BD-PENDING-HASH',
        studentName: 'Student Name',
        courseType: 'Bitcoin & Blockchain Fundamentals',
        cohort: 'Cohort 2025-01',
        certificateType: 'Certificate of Completion',
        issueDate: new Date().toISOString().split('T')[0],
        templateId: selectedTemplate,
        instructor: 'Lead Instructor',
        createdAt: new Date().toISOString()
      }
      setPreviewCertificate(initialCert)
      generatePreview(initialCert)
    }
  }, [selectedTemplate])

  // Generate preview certificate - always show preview
  useEffect(() => {
    const previewCert = {
      id: 'BD-PENDING-HASH',
      studentName: formData.studentName || 'Student Name',
      courseType: formData.courseType || 'Bitcoin & Blockchain Fundamentals',
      cohort: 'Cohort 2025-01',
      certificateType: 'Certificate of Completion',
      issueDate: formData.issueDate,
      templateId: selectedTemplate,
      instructor: formData.instructor || 'Lead Instructor',
      createdAt: new Date().toISOString()
    }
    setPreviewCertificate(previewCert)
    generatePreview(previewCert)
  }, [formData, selectedTemplate])

  const generatePreview = async (cert) => {
    if (!cert) return
    
    setIsGeneratingPreview(true)
    setPreviewError(null)
    
    // Clean up old preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    
    try {
      console.log('Generating preview for:', cert)
      console.log('Template ID:', cert.templateId || 'achievement')
      
      const pdfBlob = await populateTemplate(null, cert, cert.templateId || 'achievement')
      console.log('PDF blob generated:', pdfBlob?.size, 'bytes')
      
      if (pdfBlob && pdfBlob.size > 0) {
        const url = URL.createObjectURL(pdfBlob)
        setPreviewUrl(url)
        setPreviewError(null)
        console.log('Preview URL set successfully:', url)
      } else {
        throw new Error('PDF blob is empty or invalid')
      }
    } catch (error) {
      console.error('Error generating preview:', error)
      setPreviewError(error.message || 'Failed to generate preview')
      setPreviewUrl(null)
    } finally {
      setIsGeneratingPreview(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const addNostrStep = (message, status) => {
    setNostrSteps(prev => [...prev, {
      message,
      status,
      timestamp: new Date()
    }])
    
    // Auto-scroll terminal when new step is added
    setTimeout(() => {
      if (terminalRef.current) {
        const output = terminalRef.current.querySelector('.nostr-terminal-output')
        if (output) {
          output.scrollTop = output.scrollHeight
        }
      }
    }, 50)
  }
  
  // Auto-scroll terminal when steps change
  useEffect(() => {
    if (nostrSteps.length > 0 && terminalRef.current) {
      const output = terminalRef.current.querySelector('.nostr-terminal-output')
      if (output) {
        output.scrollTop = output.scrollHeight
      }
    }
  }, [nostrSteps])

  const handleIssueCertificate = async () => {
    if (!formData.studentName || !formData.courseType) {
      alert('Please fill in all required fields')
      return
    }

    setIsGenerating(true)
    setNostrStatus('idle')
    setNostrSteps([])
    setNostrProgress(null)

    try {
      addNostrStep('Generating certificate...', 'in_progress')
      
      const certificateId = generateCertificateId()
      const certificate = {
        id: certificateId,
        studentName: formData.studentName,
        cohort: 'Cohort 2025-01',
        courseType: formData.courseType,
        certificateType: 'Certificate of Completion',
        issueDate: formData.issueDate,
        templateId: selectedTemplate,
        instructor: formData.instructor || 'Lead Instructor',
        createdAt: new Date().toISOString()
      }

      const signature = createDigitalSignature(certificate)
      certificate.signature = signature

      saveCertificate(certificate)
      addNostrStep('Certificate saved', 'completed')

      // Generate PDF and hash
      addNostrStep('Generating PDF...', 'in_progress')
      const pdfBlob = await populateTemplate(null, certificate, selectedTemplate)
      addNostrStep('PDF generated', 'completed')
      
      addNostrStep('Calculating hash...', 'in_progress')
      const pdfHash = await hashPDF(pdfBlob)
      const updated = updateCertificatePDFHash(certificateId, pdfHash)
      addNostrStep('Hash calculated', 'completed')
      
      // Add pdfHash to certificate object for publishing
      certificate.pdfHash = pdfHash

      setGeneratedCertificate(certificate)
      
      // Update preview with the actual generated certificate
      setPreviewCertificate(certificate)
      generatePreview(certificate)
      
      // Publish to Nostr automatically
      if (updated && pdfHash) {
        try {
          setNostrStatus('publishing')
          addNostrStep('Publishing to Nostr...', 'in_progress')
          
          // Scroll to terminal when publishing starts
          setTimeout(() => {
            if (terminalRef.current) {
              terminalRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }
          }, 100)
          
          const { publishToNostr, storeNostrEventInfo, isCertificatePublishedToNostr } = await import('../utils/nostrUtils')
          
          if (!isCertificatePublishedToNostr(updated)) {
            const nostrResult = await publishToNostr(updated, (progress) => {
              setNostrProgress(progress)
              
              if (progress.step === 'signing') {
                if (progress.status === 'in_progress') {
                  addNostrStep('Signing event...', 'in_progress')
                } else if (progress.status === 'completed') {
                  addNostrStep('Event signed ✓', 'completed')
                }
              } else if (progress.step === 'publishing') {
                // Real-time updates - add immediately as they happen
                if (progress.status === 'in_progress') {
                  // Check if this is an update to an existing step
                  setNostrSteps(prev => {
                    const lastStep = prev[prev.length - 1];
                    if (lastStep && lastStep.status === 'in_progress' && 
                        lastStep.message.includes(progress.relayName || '')) {
                      // Update existing step
                      return [...prev.slice(0, -1), { 
                        message: progress.message, 
                        status: 'in_progress',
                        timestamp: new Date()
                      }];
                    }
                    // Add new step
                    return [...prev, { 
                      message: progress.message, 
                      status: 'in_progress',
                      timestamp: new Date()
                    }];
                  });
                  
                  // Auto-scroll terminal to bottom when new messages arrive
                  setTimeout(() => {
                    if (terminalRef.current) {
                      const output = terminalRef.current.querySelector('.nostr-terminal-output')
                      if (output) {
                        output.scrollTop = output.scrollHeight
                      }
                    }
                  }, 50)
                } else if (progress.status === 'completed' && progress.success) {
                  // Update the last in_progress step for this relay
                  setNostrSteps(prev => {
                    const updated = [...prev];
                    // Find the last in_progress step for this relay
                    for (let i = updated.length - 1; i >= 0; i--) {
                      if (updated[i].status === 'in_progress' && 
                          updated[i].message.includes(progress.relayName || '')) {
                        updated[i] = { 
                          message: progress.message, 
                          status: 'completed',
                          timestamp: new Date()
                        };
                        break;
                      }
                    }
                    return updated;
                  });
                  
                  // Auto-scroll terminal to bottom
                  setTimeout(() => {
                    if (terminalRef.current) {
                      const output = terminalRef.current.querySelector('.nostr-terminal-output')
                      if (output) {
                        output.scrollTop = output.scrollHeight
                      }
                    }
                  }, 50)
                } else if (progress.status === 'error') {
                  addNostrStep(progress.message, 'error')
                }
              } else if (progress.step === 'completed' || progress.step === 'final') {
                addNostrStep(progress.message, 'completed')
              }
            })
            
            if (nostrResult && nostrResult.eventId) {
              storeNostrEventInfo(certificateId, nostrResult.eventId, nostrResult.pubKey)
              
              setNostrEventId(nostrResult.eventId)
              setNostrPubKey(nostrResult.pubKeyBech32)
              setNostrStatus('success')
              addNostrStep(`Published to ${nostrResult.publishedTo}/${nostrResult.totalRelays} relays ✓`, 'completed')
              addNostrStep(`Event ID: ${nostrResult.eventId}`, 'completed')
              
              // Scroll to terminal to show success
              setTimeout(() => {
                if (terminalRef.current) {
                  terminalRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                  const output = terminalRef.current.querySelector('.nostr-terminal-output')
                  if (output) {
                    output.scrollTop = output.scrollHeight
                  }
                }
              }, 100)
              
              console.log('✅ Published to Nostr!')
              console.log('   Event ID:', nostrResult.eventId)
              console.log('   Public Key:', nostrResult.pubKeyBech32)
              console.log('   Published to:', nostrResult.publishedTo, 'relays')
            } else {
              setNostrStatus('error')
              addNostrStep('Publishing failed', 'error')
            }
          } else {
            setNostrStatus('success')
            addNostrStep('Already published', 'completed')
            console.log('Certificate already published to Nostr')
          }
        } catch (publishError) {
          console.error('❌ Error publishing to Nostr:', publishError)
          setNostrStatus('error')
          addNostrStep('Publishing error: ' + (publishError.message || 'Unknown error'), 'error')
        }
      } else {
        addNostrStep('Skipping publish (no hash)', 'error')
      }
      
      // Auto-send email if provided
      if (formData.studentEmail && isEmailJSConfigured()) {
        handleSendEmail(certificate)
      }

      // Note: PDF download is now handled by the download button in the UI
      // Removed automatic download - user can choose when to download

      // Update preview with generated certificate
      if (certificate) {
        setPreviewCertificate(certificate)
        generatePreview(certificate)
      }
      
      // Reset form after successful generation (but keep preview)
      setTimeout(() => {
        setFormData({
          studentName: '',
          courseType: 'Bitcoin & Blockchain Fundamentals',
          issueDate: new Date().toISOString().split('T')[0],
          instructor: '',
          studentEmail: ''
        })
        // Don't clear generatedCertificate so preview stays visible
      }, 2000)
    } catch (error) {
      console.error('Error generating certificate:', error)
      alert('Error generating certificate. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSendEmail = async (cert, email) => {
    const emailToUse = email || formData.studentEmail
    if (!emailToUse || !emailToUse.trim()) {
      setEmailStatus({
        success: false,
        message: 'Please enter a valid email address'
      })
      return
    }

    setIsSendingEmail(true)
    setEmailStatus(null)

    try {
      const result = await sendCertificateEmail(
        cert || generatedCertificate,
        emailToUse.trim(),
        selectedTemplate
      )

      if (result.success) {
        setEmailStatus({
          success: true,
          message: 'Certificate email sent successfully! 🎉'
        })
        setShowEmailModal(false)
        setEmailToSend('')
        // Clear status after 3 seconds
        setTimeout(() => {
          setEmailStatus(null)
        }, 3000)
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

  const handleSendEmailClick = () => {
    if (formData.studentEmail && formData.studentEmail.trim()) {
      // Use the email from the form if available
      handleSendEmail(generatedCertificate, formData.studentEmail)
    } else {
      // Show modal to enter email
      setShowEmailModal(true)
      setEmailToSend('')
      setEmailStatus(null)
    }
  }


  return (
    <div className="issuance-terminal">
      <div className="terminal-header">
        <div>
          <h1>Issuance Terminal</h1>
          <p className="terminal-subtitle">Configure and generate digital credentials</p>
        </div>
        <div className="terminal-actions">
          <button className="icon-btn" title="Database">
            <Database size={20} />
          </button>
          <button className="icon-btn" title="Print">
            <Printer size={20} />
          </button>
        </div>
      </div>

      <div className="terminal-content">
        {/* Left Side - Form */}
        <div className="terminal-form-section">
          <div className="form-section">
            <label className="form-label">
              Student Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="studentName"
              value={formData.studentName}
              onChange={handleInputChange}
              placeholder="e.g. Jane Doe"
              className="form-input"
              list="studentNames"
            />
            <datalist id="studentNames">
              {studentNames.map(name => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="form-section">
            <label className="form-label">
              Course Title <span className="required">*</span>
            </label>
            <select
              name="courseType"
              value={formData.courseType}
              onChange={handleInputChange}
              className="form-input"
            >
              {courses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <label className="form-label">
              Issue Date <span className="required">*</span>
            </label>
            <div className="date-input-wrapper">
              <Calendar size={18} className="date-icon" />
              <input
                type="date"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleInputChange}
                className="form-input date-input"
              />
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">Instructor</label>
            <input
              type="text"
              name="instructor"
              value={formData.instructor}
              onChange={handleInputChange}
              placeholder="e.g. Larvine M."
              className="form-input"
            />
          </div>

          <div className="form-section">
            <label className="form-label">
              Email <span className="optional">(Optional)</span>
            </label>
            <input
              type="email"
              name="studentEmail"
              value={formData.studentEmail}
              onChange={handleInputChange}
              placeholder="student@example.com"
              className="form-input"
            />
            <small className="form-hint">Send certificate via email after generation</small>
          </div>

          <div className="template-selector-section">
            <div className="section-header">
              <Palette size={18} />
              <span className="section-title">Select Certificate Template</span>
              <button
                type="button"
                className="toggle-template-btn"
                onClick={() => setShowTemplateSelector(!showTemplateSelector)}
              >
                {showTemplateSelector ? 'Hide' : 'Show'} Templates
              </button>
            </div>
            
            {showTemplateSelector && (
              <div className="template-selector-wrapper">
                <TemplateSelector
                  selectedTemplate={selectedTemplate}
                  onSelect={setSelectedTemplate}
                  previewData={{
                    studentName: formData.studentName || 'John Doe',
                    courseType: formData.courseType || 'Bitcoin & Blockchain Fundamentals',
                    cohort: 'Cohort 2025-01',
                    certificateType: 'Certificate of Completion',
                    issueDate: formData.issueDate || new Date().toISOString().split('T')[0],
                    id: 'DD-2025-SAMPLE',
                    instructor: formData.instructor || 'Lead Instructor',
                    createdAt: new Date().toISOString()
                  }}
                />
              </div>
            )}
          </div>

          <div className="processing-info">
            <span className="processing-label">Est. Processing Time</span>
            <span className="processing-time">~2 seconds</span>
          </div>

          <button
            onClick={handleIssueCertificate}
            className="btn-issue-certificate"
            disabled={isGenerating || !formData.studentName || !formData.courseType}
          >
            {isGenerating ? 'Generating...' : 'ISSUE CERTIFICATE →'}
          </button>

          {emailStatus && (
            <div className={`email-status ${emailStatus.success ? 'success' : 'error'}`}>
              {emailStatus.message}
            </div>
          )}
        </div>

        {/* Right Side - Preview */}
        <div className="terminal-preview-section">
          <div className="preview-header">
            <div className="preview-logo">
              <img 
                src={theme === 'dark' ? '/logo-dark.png' : '/logo.png'} 
                alt="Bitcoin Dada" 
                className="preview-logo-img"
              />
              <span>Bitcoin Dada</span>
            </div>
            <div className="preview-cert-id">
              <span className="cert-id-label">CERTIFICATE ID</span>
              <span className="cert-id-value">
                {previewCertificate?.id || 'BD-PENDING-HASH'}
              </span>
            </div>
          </div>

          {/* Reduced Certificate Preview */}
          <div className="certificate-preview-container-small">
            {isGeneratingPreview ? (
              <div className="preview-loading-state">
                <Loader2 size={20} className="spinning" />
                <p>Generating preview...</p>
              </div>
            ) : previewError ? (
              <div className="preview-error-state">
                <AlertCircle size={20} />
                <p>Preview Error</p>
                <p className="error-message">{previewError}</p>
                <button 
                  onClick={() => previewCertificate && generatePreview(previewCertificate)}
                  className="btn-retry-preview"
                >
                  Retry
                </button>
              </div>
            ) : previewUrl ? (
              <div className="certificate-preview-wrapper">
                <iframe
                  src={previewUrl}
                  className="certificate-preview-iframe-small"
                  title="Certificate Preview"
                  onLoad={() => console.log('Preview iframe loaded successfully')}
                  onError={(e) => {
                    console.error('Preview iframe error:', e)
                    setPreviewError('Failed to load PDF preview')
                  }}
                />
              </div>
            ) : (
              <div className="preview-placeholder">
                <p>Certificate preview will appear here</p>
                <p className="preview-hint">Fill in the form to see a live preview</p>
              </div>
            )}
          </div>

          {/* Real-time Nostr Publishing Terminal */}
          {(nostrStatus === 'publishing' || nostrStatus === 'success' || nostrStatus === 'error') && (
            <div className="nostr-terminal-section" ref={terminalRef}>
              <div className="nostr-terminal-header">
                <Zap size={14} style={{ color: nostrStatus === 'success' ? '#10b981' : nostrStatus === 'error' ? '#ef4444' : '#3b82f6' }} />
                <span className="nostr-terminal-title">
                  {nostrStatus === 'publishing' ? 'PUBLISHING TO NOSTR' : 
                   nostrStatus === 'success' ? 'PUBLISHED TO NOSTR' : 
                   'PUBLISH ERROR'}
                </span>
              </div>
              <div className="nostr-terminal-output">
                {nostrSteps.map((step, index) => {
                  const timestamp = step.timestamp ? new Date(step.timestamp).toLocaleTimeString() : '';
                  const statusIcon = step.status === 'in_progress' ? '⟳' : 
                                    step.status === 'completed' ? '✓' : 
                                    step.status === 'error' ? '✗' : '';
                  const statusColor = step.status === 'in_progress' ? '#3b82f6' : 
                                     step.status === 'completed' ? '#10b981' : 
                                     step.status === 'error' ? '#ef4444' : '#ffffff';
                  
                  // Check if this step contains an event ID
                  const isEventIdLine = step.message && step.message.startsWith('Event ID:')
                  
                  return (
                    <div key={index} className={`nostr-terminal-line ${step.status}`}>
                      <span className="terminal-timestamp">{timestamp}</span>
                      <span className="terminal-status" style={{ color: statusColor }}>{statusIcon}</span>
                      <span className="terminal-message">
                        {isEventIdLine && nostrEventId ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all', flex: 1, minWidth: '200px' }}>
                                {nostrEventId}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(nostrEventId)
                                  alert('Event ID copied to clipboard!')
                                }}
                                style={{
                                  background: 'transparent',
                                  border: '1px solid #3b82f6',
                                  color: '#3b82f6',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  fontSize: '0.7rem'
                                }}
                                title="Copy Event ID"
                              >
                                <Copy size={12} />
                                Copy
                              </button>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                              <a 
                                href={`https://snort.social/e/${nostrEventId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ 
                                  color: '#3b82f6', 
                                  textDecoration: 'none',
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                View on Snort <ExternalLink size={12} />
                              </a>
                              <a 
                                href={`https://damus.io/e/${nostrEventId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ 
                                  color: '#3b82f6', 
                                  textDecoration: 'none',
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                View on Damus <ExternalLink size={12} />
                              </a>
                              <a 
                                href={`https://nostr.band/e/${nostrEventId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ 
                                  color: '#3b82f6', 
                                  textDecoration: 'none',
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                View on Nostr.band <ExternalLink size={12} />
                              </a>
                            </div>
                            {nostrPubKey && (
                              <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.25rem' }}>
                                Public Key: {nostrPubKey}
                              </div>
                            )}
                          </div>
                        ) : (
                          step.message
                        )}
                      </span>
                    </div>
                  );
                })}
                {nostrStatus === 'publishing' && (
                  <div className="nostr-terminal-line in_progress">
                    <span className="terminal-cursor">▊</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Download and Email Buttons - Always Visible */}
          <div className="download-section">
            <div style={{ display: 'flex', gap: '0.75rem', flexDirection: 'column' }}>
              <button
                onClick={async () => {
                  const cert = generatedCertificate || previewCertificate;
                  if (!cert) {
                    alert('Please generate a certificate first');
                    return;
                  }
                  const pdfBlob = await populateTemplate(null, cert, selectedTemplate);
                  downloadPDF(pdfBlob, `Certificate-${cert.id || 'preview'}.pdf`);
                }}
                className="btn-download-cert"
                disabled={!previewUrl && !generatedCertificate}
              >
                <Download size={18} />
                Download Certificate
              </button>
              
              {isEmailJSConfigured() && generatedCertificate && (
                <button
                  onClick={handleSendEmailClick}
                  className="btn-send-email"
                  disabled={isSendingEmail}
                >
                  <Mail size={18} />
                  {isSendingEmail ? 'Sending...' : 'Send via Email'}
                </button>
              )}
            </div>
            
            {emailStatus && (
              <div className={`email-status ${emailStatus.success ? 'success' : 'error'}`} style={{ marginTop: '1rem' }}>
                {emailStatus.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>📧 Send Certificate via Email</h3>
            <p>
              Send certificate to:
            </p>
            {generatedCertificate && (
              <>
                <p className="modal-cert-name">{generatedCertificate.studentName}</p>
                <p className="modal-cert-id">ID: {generatedCertificate.id}</p>
              </>
            )}
            
            <div style={{ marginTop: '1.5rem' }}>
              <label htmlFor="email-input-issue" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Recipient Email:
              </label>
              <input
                id="email-input-issue"
                type="email"
                value={emailToSend}
                onChange={(e) => setEmailToSend(e.target.value)}
                placeholder="student@example.com"
                className="form-input"
                style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem' }}
                disabled={isSendingEmail}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && emailToSend.trim() && !isSendingEmail) {
                    handleSendEmail(generatedCertificate, emailToSend)
                  }
                }}
                autoFocus
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
                  setShowEmailModal(false)
                  setEmailToSend('')
                  setEmailStatus(null)
                }}
                className="btn-cancel"
                disabled={isSendingEmail}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSendEmail(generatedCertificate, emailToSend)}
                className="btn-primary"
                disabled={isSendingEmail || !emailToSend || !emailToSend.trim()}
                style={{ background: '#f0b400', color: '#000' }}
              >
                {isSendingEmail ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Status Bar - Nostr Publishing Status */}
      <div className="terminal-status-bar">
        {nostrStatus === 'idle' || nostrStatus === null ? (
          <>
            <div className="status-item">
              <Zap size={14} />
              <span>READY</span>
            </div>
            <div className="status-item">
              <span>Click "Issue Certificate" to begin</span>
            </div>
          </>
        ) : nostrStatus === 'publishing' ? (
          <>
            <div className="status-item">
              <Zap size={14} style={{ color: '#3b82f6', animation: 'pulse 1s infinite' }} />
              <span>PUBLISHING TO NOSTR</span>
            </div>
            <div className="status-item">
              <span>{nostrSteps.length > 0 ? nostrSteps[nostrSteps.length - 1].message : 'Initializing...'}</span>
            </div>
            {nostrProgress && nostrProgress.currentRelay && (
              <div className="status-item">
                <span>→ {nostrProgress.currentRelay.replace('wss://', '').split('.')[0]}</span>
              </div>
            )}
          </>
        ) : nostrStatus === 'success' ? (
          <>
            <div className="status-item">
              <CheckCircle size={14} style={{ color: '#10b981' }} />
              <span>PUBLISHED TO NOSTR</span>
            </div>
            {nostrSteps.length > 0 && (
              <div className="status-item">
                <span>{nostrSteps[nostrSteps.length - 1].message}</span>
              </div>
            )}
            {nostrProgress && nostrProgress.result && (
              <div className="status-item">
                <span>Event: {nostrProgress.result.eventId.substring(0, 12)}...</span>
              </div>
            )}
          </>
        ) : nostrStatus === 'error' ? (
          <>
            <div className="status-item">
              <AlertCircle size={14} style={{ color: '#ef4444' }} />
              <span>PUBLISH ERROR</span>
            </div>
            {nostrSteps.length > 0 && (
              <div className="status-item">
                <span>{nostrSteps[nostrSteps.length - 1].message}</span>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

export default IssueCertificateWizard
