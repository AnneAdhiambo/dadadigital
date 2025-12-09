import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateCertificateId, createDigitalSignature, saveCertificate, getStoredCertificates } from '../utils/certificateUtils'
import { getAllTemplates, populateTemplate } from '../utils/templateUtils'
import { sendCertificateEmail, isEmailJSConfigured, initEmailJS } from '../utils/emailUtils'
import { hashPDF, updateCertificatePDFHash } from '../utils/certificateUtils'
import { downloadPDF } from '../utils/pdfTemplateUtils'
import { cleanupTemplates } from '../utils/templateStorage'
import { Download, CheckCircle, Palette, Loader2, AlertCircle, Zap, ChevronRight, ChevronLeft, User, FileText, Rocket } from 'lucide-react'
import TemplateSelector from '../components/TemplateSelector'
import CertificateHTMLPreview from '../components/CertificateHTMLPreview'
import { useTheme } from '../contexts/ThemeContext'
import './IssueCertificateWizard.css'

const WIZARD_STEPS = [
  { id: 1, title: 'Choose Template', icon: Palette },
  { id: 2, title: 'Student Details', icon: User },
  { id: 3, title: 'Review & Issue', icon: FileText },
  { id: 4, title: 'Download & Publish', icon: Rocket }
]

function IssueCertificateWizard() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [formData, setFormData] = useState({
    studentName: '',
    courseType: 'Bitcoin & Blockchain Fundamentals',
    issueDate: new Date().toISOString().split('T')[0],
    instructor: '',
    studentEmail: ''
  })
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedCertificate, setGeneratedCertificate] = useState(null)
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState(null)
  const [studentNames, setStudentNames] = useState([])
  const [nostrStatus, setNostrStatus] = useState(null)
  const [nostrProgress, setNostrProgress] = useState(null)
  const [nostrSteps, setNostrSteps] = useState([])
  const [publishedEventId, setPublishedEventId] = useState(null)
  const terminalRef = useRef(null)
  const terminalSectionRef = useRef(null)

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
    // Clean up templates on load to remove duplicates and conflicts
    cleanupTemplates()
    initEmailJS()
    const certificates = getStoredCertificates()
    const names = [...new Set(certificates.map(cert => cert.studentName))].sort()
    setStudentNames(names)
  }, [])

  // Auto-scroll terminal when new steps are added
  useEffect(() => {
    if (terminalRef.current && nostrSteps.length > 0) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [nostrSteps])

  // Scroll terminal into view when it first appears
  useEffect(() => {
    if ((isGenerating || nostrStatus) && terminalSectionRef.current) {
      setTimeout(() => {
        terminalSectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        })
      }, 300)
    }
  }, [isGenerating, nostrStatus])


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
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight
      }
    }, 100)
  }

  const handleIssueCertificate = async () => {
    if (!formData.studentName || !formData.courseType) {
      alert('Please fill in all required fields')
      return
    }

    // Navigate to step 4 first to show preview and terminal
    setCurrentStep(4)
    
    // Initialize terminal state
    setIsGenerating(true)
    setNostrStatus('idle')
    setNostrSteps([])
    setNostrProgress(null)
    setPublishedEventId(null)

    // Small delay to ensure step 4 is rendered before starting generation
    await new Promise(resolve => setTimeout(resolve, 100))

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
      let pdfBlob
      try {
        pdfBlob = await populateTemplate(null, certificate, selectedTemplate)
        if (!pdfBlob || pdfBlob.size === 0) {
          throw new Error('Generated PDF is empty or invalid')
        }
        addNostrStep('PDF generated', 'completed')
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError)
        addNostrStep(`PDF generation failed: ${pdfError.message}`, 'error')
        throw new Error(`Failed to generate PDF: ${pdfError.message}`)
      }
      
      addNostrStep('Calculating hash...', 'in_progress')
      let pdfHash
      let updated
      try {
        pdfHash = await hashPDF(pdfBlob)
        if (!pdfHash) {
          throw new Error('Hash calculation returned empty result')
        }
        updated = updateCertificatePDFHash(certificateId, pdfHash)
        if (!updated) {
          throw new Error('Failed to update certificate with hash')
        }
        addNostrStep('Hash calculated', 'completed')
      } catch (hashError) {
        console.error('Hash calculation error:', hashError)
        addNostrStep(`Hash calculation failed: ${hashError.message}`, 'error')
        throw new Error(`Failed to calculate PDF hash: ${hashError.message}`)
      }
      
      certificate.pdfHash = pdfHash
      setGeneratedCertificate(certificate)
      setGeneratedPdfBlob(pdfBlob)
      
      // Publish to Nostr automatically
      if (updated && pdfHash) {
        try {
          setNostrStatus('publishing')
          addNostrStep('Publishing to Nostr...', 'in_progress')
          
          const { publishToNostr, storeNostrEventInfo, isCertificatePublishedToNostr } = await import('../utils/nostrUtils')
          
          if (!isCertificatePublishedToNostr(updated)) {
            const nostrResult = await publishToNostr(updated, (progress) => {
              setNostrProgress(progress)
              
              if (progress.step === 'signing') {
                if (progress.status === 'in_progress') {
                  addNostrStep('Signing event...', 'in_progress')
                } else if (progress.status === 'completed') {
                  addNostrStep('Event signed ✓', 'completed')
                  if (progress.eventId) {
                    setPublishedEventId(progress.eventId)
                  }
                }
              } else if (progress.step === 'publishing') {
                if (progress.status === 'in_progress') {
                  setNostrSteps(prev => {
                    const lastStep = prev[prev.length - 1]
                    if (lastStep && lastStep.status === 'in_progress' && 
                        lastStep.message.includes(progress.relayName || '')) {
                      return [...prev.slice(0, -1), { 
                        message: progress.message, 
                        status: 'in_progress',
                        timestamp: new Date()
                      }]
                    }
                    return [...prev, { 
                      message: progress.message, 
                      status: 'in_progress',
                      timestamp: new Date()
                    }]
                  })
                } else if (progress.status === 'completed' && progress.success) {
                  setNostrSteps(prev => {
                    const updated = [...prev]
                    for (let i = updated.length - 1; i >= 0; i--) {
                      if (updated[i].status === 'in_progress' && 
                          updated[i].message.includes(progress.relayName || '')) {
                        updated[i] = { 
                          message: progress.message, 
                          status: 'completed',
                          timestamp: new Date()
                        }
                        break
                      }
                    }
                    return updated
                  })
                } else if (progress.status === 'error') {
                  addNostrStep(progress.message, 'error')
                }
              } else if (progress.step === 'completed' || progress.step === 'final') {
                addNostrStep(progress.message, 'completed')
                if (progress.result && progress.result.eventId) {
                  setPublishedEventId(progress.result.eventId)
                }
              }
            })
            
            if (nostrResult && nostrResult.eventId) {
              storeNostrEventInfo(certificateId, nostrResult.eventId, nostrResult.pubKey)
              
              setPublishedEventId(nostrResult.eventId)
              setNostrStatus('success')
              addNostrStep(`Published to ${nostrResult.publishedTo}/${nostrResult.totalRelays} relays ✓`, 'completed')
              addNostrStep(`Event ID: ${nostrResult.eventId}`, 'completed')
              addNostrStep(`Public Key (npub): ${nostrResult.pubKeyBech32}`, 'completed')
            } else {
              setNostrStatus('error')
              addNostrStep('Publishing failed', 'error')
            }
          } else {
            setNostrStatus('success')
            addNostrStep('Already published', 'completed')
          }
        } catch (publishError) {
          console.error('❌ Error publishing to Nostr:', publishError)
          setNostrStatus('error')
          addNostrStep('Publishing error: ' + (publishError.message || 'Unknown error'), 'error')
        }
      }
      
      // Auto-send email if provided
      if (formData.studentEmail && isEmailJSConfigured()) {
        try {
          await sendCertificateEmail(certificate, formData.studentEmail, selectedTemplate)
          addNostrStep('Email sent successfully', 'completed')
        } catch (emailError) {
          console.error('Email error:', emailError)
          addNostrStep('Email sending failed', 'error')
        }
      }
    } catch (error) {
      console.error('Error generating certificate:', error)
      addNostrStep(`Error: ${error.message || 'Failed to generate certificate'}`, 'error')
      setNostrStatus('error')
      alert(`Error generating certificate: ${error.message || 'Please check the console for details and try again.'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 1 && !selectedTemplate) {
      alert('Please select a template')
      return
    }
    if (currentStep === 2) {
      if (!formData.studentName || !formData.courseType) {
        alert('Please fill in all required fields')
        return
      }
    }
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleDownload = async () => {
    const cert = generatedCertificate
    if (!cert) {
      alert('Please generate a certificate first')
      return
    }
    // Use stored PDF blob if available, otherwise generate new one
    if (generatedPdfBlob) {
      downloadPDF(generatedPdfBlob, `Certificate-${cert.id}.pdf`)
    } else {
      const pdfBlob = await populateTemplate(null, cert, selectedTemplate)
      downloadPDF(pdfBlob, `Certificate-${cert.id}.pdf`)
    }
  }

  const canProceed = () => {
    if (currentStep === 1) return selectedTemplate !== null
    if (currentStep === 2) return formData.studentName && formData.courseType
    return true
  }

  return (
    <div className="wizard-container">
      <div className="wizard-header">
        <h1>Issue Certificate</h1>
        <p className="wizard-subtitle">Step-by-step certificate generation wizard</p>
      </div>

      {/* Wizard Steps Indicator */}
      <div className="wizard-steps">
        {WIZARD_STEPS.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id
          
          return (
            <div key={step.id} className={`wizard-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
              <div className="wizard-step-icon">
                {isCompleted ? (
                  <CheckCircle size={20} />
                ) : (
                  <Icon size={20} />
                )}
              </div>
              <div className="wizard-step-content">
                <div className="wizard-step-number">Step {step.id}</div>
                <div className="wizard-step-title">{step.title}</div>
              </div>
              {index < WIZARD_STEPS.length - 1 && (
                <ChevronRight size={20} className="wizard-step-arrow" />
              )}
            </div>
          )
        })}
      </div>

      {/* Wizard Content */}
      <div className="wizard-content">
        {/* Step 1: Choose Template */}
        {currentStep === 1 && (
          <div className="wizard-step-content">
            <h2>Choose Certificate Template</h2>
            <p className="wizard-step-description">Select a template for your certificate</p>
            <div className="template-selection-area">
              <TemplateSelector
                selectedTemplate={selectedTemplate}
                onSelect={setSelectedTemplate}
                previewData={{
                  studentName: 'Student Name',
                  courseType: 'Bitcoin & Blockchain Fundamentals',
                  cohort: 'Cohort 2025-01',
                  certificateType: 'Certificate of Completion',
                  issueDate: new Date().toISOString().split('T')[0],
                  id: 'DD-2025-SAMPLE',
                  instructor: 'Lead Instructor',
                  createdAt: new Date().toISOString()
                }}
                showManageLink={true}
              />
            </div>
          </div>
        )}

        {/* Step 2: Student Details */}
        {currentStep === 2 && (
          <div className="wizard-step-content">
            <h2>Student Information</h2>
            <p className="wizard-step-description">Enter the student's details for the certificate</p>
            
            <div className="wizard-step-two-column">
              {/* Left Column: Form */}
              <div className="wizard-form-column">
                <div className="wizard-form">
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
                    <input
                      type="date"
                      name="issueDate"
                      value={formData.issueDate}
                      onChange={handleInputChange}
                      className="form-input"
                    />
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
                </div>
              </div>

              {/* Right Column: Preview */}
              {selectedTemplate && (
                <div className="wizard-preview-column">
                  <div className="wizard-preview-section">
                    <h3>Preview</h3>
                    <div className="wizard-preview-container">
                      <CertificateHTMLPreview
                        templateId={selectedTemplate}
                        certificate={{
                          studentName: formData.studentName || 'Student Name',
                          courseType: formData.courseType || 'Bitcoin & Blockchain Fundamentals',
                          cohort: 'Cohort 2025-01',
                          certificateType: 'Certificate of Completion',
                          issueDate: formData.issueDate,
                          instructor: formData.instructor || 'Lead Instructor'
                        }}
                        scale={0.5}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Review & Issue */}
        {currentStep === 3 && (
          <div className="wizard-step-content">
            <h2>Review & Issue Certificate</h2>
            <p className="wizard-step-description">Review the details and issue the certificate</p>
            
            <div className="review-section">
              <div className="review-card">
                <h3>Certificate Details</h3>
                <div className="review-details">
                  <div className="review-item">
                    <span className="review-label">Template:</span>
                    <span className="review-value">{templates.find(t => t.id === selectedTemplate)?.name || 'N/A'}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Student Name:</span>
                    <span className="review-value">{formData.studentName}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Course:</span>
                    <span className="review-value">{formData.courseType}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Issue Date:</span>
                    <span className="review-value">{new Date(formData.issueDate).toLocaleDateString()}</span>
                  </div>
                  {formData.instructor && (
                    <div className="review-item">
                      <span className="review-label">Instructor:</span>
                      <span className="review-value">{formData.instructor}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="review-preview">
                <h3>Certificate Preview</h3>
                <div className="wizard-preview-container-large">
                  <CertificateHTMLPreview
                    templateId={selectedTemplate}
                    certificate={{
                      studentName: formData.studentName,
                      courseType: formData.courseType,
                      cohort: 'Cohort 2025-01',
                      certificateType: 'Certificate of Completion',
                      issueDate: formData.issueDate,
                      instructor: formData.instructor || 'Lead Instructor'
                    }}
                    scale={0.6}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Download & Terminal - Split Screen Layout */}
        {currentStep === 4 && (
          <div className="wizard-step-content certificate-issued-layout">
            <div className="certificate-issued-split">
              {/* Left Side: Large Certificate Preview */}
              <div className="certificate-preview-panel">
                <div className="certificate-preview-container-full">
                  {generatedCertificate ? (
                    <CertificateHTMLPreview
                      templateId={selectedTemplate}
                      certificate={generatedCertificate}
                      scale={1.0}
                    />
                  ) : (
                    <CertificateHTMLPreview
                      templateId={selectedTemplate}
                      certificate={{
                        studentName: formData.studentName || 'Student Name',
                        courseType: formData.courseType || 'Bitcoin & Blockchain Fundamentals',
                        cohort: 'Cohort 2025-01',
                        certificateType: 'Certificate of Completion',
                        issueDate: formData.issueDate,
                        instructor: formData.instructor || 'Lead Instructor'
                      }}
                      scale={1.0}
                    />
                  )}
                </div>
              </div>

              {/* Right Side: Action & Status Panel */}
              <div className="action-status-panel" ref={terminalSectionRef}>
                {/* Massive Download Button */}
                {generatedCertificate && (
                  <button
                    onClick={handleDownload}
                    className="btn-download-cert-massive"
                  >
                    <Download size={24} />
                    <span>Download Certificate PDF</span>
                  </button>
                )}

                {/* Live Terminal Window */}
                <div className="live-terminal-window">
                  <div className="terminal-window-header">
                    <div className="terminal-window-controls">
                      <span className="terminal-control-dot terminal-control-close"></span>
                      <span className="terminal-control-dot terminal-control-minimize"></span>
                      <span className="terminal-control-dot terminal-control-maximize"></span>
                    </div>
                    <div className="terminal-window-title">
                      <Zap size={12} style={{ color: nostrStatus === 'success' ? '#10b981' : nostrStatus === 'error' ? '#ef4444' : '#3b82f6' }} />
                      <span>
                        {nostrStatus === 'publishing' || (isGenerating && !nostrStatus) ? 'PUBLISHING TO NOSTR' : 
                         nostrStatus === 'success' ? 'PUBLISHED TO NOSTR' : 
                         nostrStatus === 'error' ? 'PUBLISH ERROR' :
                         'LIVE TERMINAL'}
                      </span>
                    </div>
                  </div>
                  <div className="terminal-window-body" ref={terminalRef}>
                    {nostrSteps.length === 0 && !isGenerating && (
                      <div className="terminal-log-line">
                        <span className="terminal-log-prompt">$</span>
                        <span className="terminal-log-message">Ready to generate certificate...</span>
                      </div>
                    )}
                    {nostrSteps.map((step, index) => {
                      const timestamp = step.timestamp ? new Date(step.timestamp).toLocaleTimeString() : ''
                      const statusIcon = step.status === 'in_progress' ? '⟳' : 
                                        step.status === 'completed' ? '✓' : 
                                        step.status === 'error' ? '✗' : '→'
                      const statusColor = step.status === 'in_progress' ? '#3b82f6' : 
                                         step.status === 'completed' ? '#10b981' : 
                                         step.status === 'error' ? '#ef4444' : '#a0a0a0'
                      
                      return (
                        <div key={index} className={`terminal-log-line terminal-log-${step.status}`}>
                          <span className="terminal-log-time">[{timestamp}]</span>
                          <span className="terminal-log-status" style={{ color: statusColor }}>{statusIcon}</span>
                          <span className="terminal-log-message">{step.message}</span>
                        </div>
                      )
                    })}
                    {(nostrStatus === 'publishing' || (isGenerating && !nostrStatus)) && (
                      <div className="terminal-log-line terminal-log-in_progress">
                        <span className="terminal-log-prompt">$</span>
                        <span className="terminal-cursor-blink">▊</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Event ID Display Section */}
                  {publishedEventId && (
                    <div className="terminal-event-info">
                      <div className="terminal-event-header">
                        <CheckCircle size={14} style={{ color: '#10b981' }} />
                        <span>EVENT PUBLISHED</span>
                      </div>
                      <div className="terminal-event-id-container">
                        <div className="terminal-event-id-label">Event ID:</div>
                        <div className="terminal-event-id-value" title={publishedEventId}>
                          {publishedEventId}
                        </div>
                        <button 
                          className="btn-copy-terminal"
                          onClick={() => {
                            navigator.clipboard.writeText(publishedEventId)
                            alert('Event ID copied to clipboard!')
                          }}
                          title="Copy Event ID"
                        >
                          COPY
                        </button>
                      </div>
                      <div className="terminal-event-links">
                        <div className="terminal-event-links-title">VIEW ON:</div>
                        <div className="terminal-event-links-grid">
                          <a 
                            href={`https://snort.social/e/${publishedEventId}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="terminal-event-link"
                          >
                            SNORT
                          </a>
                          <a 
                            href={`https://damus.io/e/${publishedEventId}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="terminal-event-link"
                          >
                            DAMUS
                          </a>
                          <a 
                            href={`https://nostr.band/e/${publishedEventId}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="terminal-event-link"
                          >
                            NOSTR.BAND
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Wizard Navigation */}
      <div className="wizard-navigation">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="btn-wizard-nav btn-wizard-prev"
        >
          <ChevronLeft size={18} />
          Previous
        </button>
        
        {currentStep === 3 ? (
          <button
            onClick={handleIssueCertificate}
            disabled={isGenerating || !canProceed()}
            className="btn-wizard-nav btn-wizard-primary"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="spinning" />
                Processing...
              </>
            ) : (
              <>
                <Rocket size={18} />
                Issue & Continue
              </>
            )}
          </button>
        ) : currentStep < 4 ? (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="btn-wizard-nav btn-wizard-primary"
          >
            Next
            <ChevronRight size={18} />
          </button>
        ) : (
          <button
            onClick={() => {
              setCurrentStep(1)
              setFormData({
                studentName: '',
                courseType: 'Bitcoin & Blockchain Fundamentals',
                issueDate: new Date().toISOString().split('T')[0],
                instructor: '',
                studentEmail: ''
              })
              setGeneratedCertificate(null)
              setNostrStatus(null)
              setNostrSteps([])
              setPublishedEventId(null)
              setGeneratedPdfBlob(null)
            }}
            className="btn-wizard-nav btn-wizard-primary"
          >
            Issue Another Certificate
          </button>
        )}
      </div>
    </div>
  )
}

export default IssueCertificateWizard
