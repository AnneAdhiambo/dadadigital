import { useState, useRef, useEffect } from 'react'
import Papa from 'papaparse'
import JSZip from 'jszip'
import { generateCertificateId, createDigitalSignature, saveCertificate } from '../utils/certificateUtils'
import { getAllTemplates, populateTemplate } from '../utils/templateUtils'
import { 
  UploadCloud, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  ArrowRight,
  ArrowLeft,
  FileText,
  Loader2,
  Globe,
  X,
  Sparkles,
  MessageSquare
} from 'lucide-react'
import './BatchProcessing.css'

// Step Indicator Component
const StepIndicator = ({ currentStep }) => {
  const steps = [
    { num: 1, label: "Select Template" },
    { num: 2, label: "Upload Data" },
    { num: 3, label: "Review" },
    { num: 4, label: "Issue" }
  ]

  return (
    <div className="step-indicator-container">
      <div className="step-indicator">
        {steps.map((step) => (
          <div key={step.num} className="step-item">
            <div 
              className={`step-circle ${
                currentStep >= step.num 
                  ? 'active' 
                  : ''
              }`}
            >
              {currentStep > step.num ? <CheckCircle size={20} /> : step.num}
            </div>
            <span className={`step-label ${
              currentStep >= step.num ? 'active' : ''
            }`}>
              {step.label}
            </span>
          </div>
        ))}
        
        {/* Progress Bar Background */}
        <div className="step-progress-bg"></div>
        
        {/* Active Progress Bar */}
        <div 
          className="step-progress-active" 
          style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
        ></div>
      </div>
    </div>
  )
}

function BatchProcessing() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState('achievement')
  const [csvFile, setCsvFile] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [results, setResults] = useState(null)
  const [recipients, setRecipients] = useState([])
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [templatePreviewUrls, setTemplatePreviewUrls] = useState({})
  const [loadingPreviews, setLoadingPreviews] = useState({})
  const [showCertificatesView, setShowCertificatesView] = useState(false)
  const [viewingCertificateId, setViewingCertificateId] = useState(null)
  const fileInputRef = useRef(null)

  const templates = getAllTemplates()

  // Generate actual certificate previews for all templates
  useEffect(() => {
    templates.forEach((template, index) => {
      // Stagger loading to avoid overwhelming
      setTimeout(() => {
        loadTemplatePreview(template.id)
      }, index * 200)
    })
  }, [])

  const loadTemplatePreview = async (templateId) => {
    try {
      setLoadingPreviews(prev => ({ ...prev, [templateId]: true }))
      
      const previewData = {
        id: 'BD-PREVIEW',
        studentName: 'John Doe',
        courseType: 'Bitcoin & Blockchain Fundamentals',
        cohort: 'Cohort 2025-01',
        certificateType: 'Certificate of Completion',
        issueDate: new Date().toISOString().split('T')[0],
        templateId: templateId,
        instructor: 'Lead Instructor',
        createdAt: new Date().toISOString()
      }
      
      const pdfBlob = await populateTemplate(null, previewData, templateId)
      
      if (pdfBlob && pdfBlob.size > 0) {
        const url = URL.createObjectURL(pdfBlob)
        setTemplatePreviewUrls(prev => {
          // Revoke old URL if exists
          if (prev[templateId]) {
            URL.revokeObjectURL(prev[templateId])
          }
          return { ...prev, [templateId]: url }
        })
      }
    } catch (error) {
      console.error('Error loading template preview for', templateId, ':', error)
      setTemplatePreviewUrls(prev => ({ ...prev, [templateId]: null }))
    } finally {
      setLoadingPreviews(prev => ({ ...prev, [templateId]: false }))
    }
  }

  // Generate CSV template
  const downloadTemplate = () => {
    const templateData = [
      {
        Name: 'Alice Johnson',
        Email: 'alice@example.com',
        Course: 'Bitcoin & Blockchain Fundamentals'
      },
      {
        Name: 'Bob Smith',
        Email: 'bob@example.com',
        Course: 'Bitcoin & Blockchain Fundamentals'
      }
    ]

    const csv = Papa.unparse(templateData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', 'certificate_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('Please select a CSV file')
        return
      }
      setCsvFile(file)
      parseCSV(file)
    }
  }

  const parseCSV = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsedResults) => {
        const parsedRecipients = parsedResults.data.map((row, index) => {
          const name = row.Name || row.name || row.StudentName || row.studentName || ''
          const email = row.Email || row.email || ''
          const course = row.Course || row.course || row.CourseType || row.courseType || 'Bitcoin & Blockchain Fundamentals'
          
          let status = 'Ready'
          if (!name || name.trim() === '') {
            status = 'Error: Missing Name'
          } else if (!email || email.trim() === '') {
            status = 'Error: Missing Email'
          }

          return {
            name: name.trim(),
            email: email.trim(),
            course: course.trim(),
            status,
            aiMsg: '',
            rowIndex: index + 1
          }
        })

        setRecipients(parsedRecipients)
      },
      error: (error) => {
        alert(`Error parsing CSV: ${error.message}`)
      }
    })
  }

  const handleFileDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setCsvFile(file)
      parseCSV(file)
    }
  }

  const generateAIMessages = async () => {
    setIsGeneratingAI(true)
    
    // Simulate AI generation with fallback messages
    setTimeout(() => {
      const updatedRecipients = recipients.map(r => {
        if (!r.status.includes('Error')) {
          const messages = [
            "Congratulations on mastering blockchain fundamentals!",
            "Outstanding achievement in Bitcoin & Blockchain!",
            "Excellent work completing the course!",
            "Well done on your blockchain journey!",
            "Impressive dedication to learning Bitcoin!"
          ]
          return {
            ...r,
            aiMsg: messages[Math.floor(Math.random() * messages.length)]
          }
        }
        return r
      })
      setRecipients(updatedRecipients)
      setIsGeneratingAI(false)
    }, 2000)
  }

  const handleNext = () => {
    if (currentStep === 1 && !selectedTemplate) {
      alert('Please select a template')
      return
    }
    if (currentStep === 2 && !csvFile) {
      alert('Please upload a CSV file')
      return
    }
    if (currentStep < 4) {
      setCurrentStep(curr => curr + 1)
    }
    if (currentStep === 3) {
      startIssuance()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(curr => curr - 1)
    }
  }

  const startIssuance = async () => {
    setIsProcessing(true)
    setCurrentStep(4)

    const validRecipients = recipients.filter(r => !r.status.includes('Error'))
    const certificates = []
    const errors = []

    for (const recipient of validRecipients) {
      try {
        const certificateId = generateCertificateId()
        const certificate = {
          id: certificateId,
          studentName: recipient.name,
          cohort: 'Cohort 2025-01',
          courseType: recipient.course,
          certificateType: 'Certificate of Completion',
          issueDate: new Date().toISOString().split('T')[0],
          templateId: selectedTemplate,
          createdAt: new Date().toISOString()
        }

        const signature = createDigitalSignature(certificate)
        certificate.signature = signature

        saveCertificate(certificate)
        certificates.push(certificate)
      } catch (error) {
        errors.push({ recipient, error: error.message })
      }
    }

    setTimeout(() => {
      setIsProcessing(false)
      setShowSuccess(true)
      setResults({
        total: recipients.length,
        successful: certificates.length,
        failed: recipients.length - certificates.length,
        certificates
      })
    }, 3000)
  }

  const resetForm = () => {
    setCurrentStep(1)
    setCsvFile(null)
    setRecipients([])
    setResults(null)
    setShowSuccess(false)
    setIsProcessing(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validCount = recipients.filter(r => !r.status.includes('Error')).length

  const downloadAllCertificates = async () => {
    if (!results || !results.certificates || results.certificates.length === 0) {
      alert('No certificates to download')
      return
    }

    try {
      setIsProcessing(true)
      const zip = new JSZip()
      
      // Generate PDF for each certificate and add to ZIP
      for (const certificate of results.certificates) {
        try {
          const pdfBlob = await populateTemplate(null, certificate, certificate.templateId || selectedTemplate)
          const fileName = `Certificate-${certificate.studentName.replace(/[^a-z0-9]/gi, '_')}-${certificate.id}.pdf`
          zip.file(fileName, pdfBlob)
        } catch (error) {
          console.error(`Error generating PDF for certificate ${certificate.id}:`, error)
        }
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      
      // Download ZIP file
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Certificates-Batch-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      setIsProcessing(false)
    } catch (error) {
      console.error('Error creating ZIP file:', error)
      alert('Failed to create ZIP file. Please try again.')
      setIsProcessing(false)
    }
  }

  const handleViewCertificate = async (certificate) => {
    if (viewingCertificateId) return
    
    try {
      setViewingCertificateId(certificate.id)
      const templateId = certificate.templateId || selectedTemplate
      const pdfBlob = await populateTemplate(null, certificate, templateId)
      const url = URL.createObjectURL(pdfBlob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      console.error('Error viewing certificate:', error)
      alert('Failed to generate certificate preview. Please try again.')
    } finally {
      setViewingCertificateId(null)
    }
  }

  return (
    <div className="batch-processing-new">
      {/* Header */}
      <div className="batch-header-new">
        <div className="header-icon">
          <Globe size={24} />
        </div>
        <h1>Batch Issue Certificates</h1>
        <p>Generate and verify credentials for multiple students at once.</p>
      </div>

      {/* Stepper */}
      <StepIndicator currentStep={currentStep} />

      {/* Main Content Card */}
      <div className="batch-card">
        {/* STEP 1: SELECT TEMPLATE */}
        {currentStep === 1 && (
          <div className="step-content">
            <div className="step-header">
              <h2>Choose a Design</h2>
              <p>Select the certificate style for this batch.</p>
            </div>

            <div className="templates-grid-new">
              {templates.map(template => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`template-card-new ${
                    selectedTemplate === template.id ? 'selected' : ''
                  }`}
                >
                  <div className="template-preview-box">
                    {loadingPreviews[template.id] ? (
                      <div className="template-preview-loading">
                        <Loader2 size={24} className="spinning" />
                        <p>Loading preview...</p>
                      </div>
                    ) : templatePreviewUrls[template.id] ? (
                      <iframe
                        src={templatePreviewUrls[template.id]}
                        className="template-preview-iframe"
                        title={`Preview of ${template.name}`}
                        onLoad={() => console.log(`Preview loaded for ${template.name}`)}
                      />
                    ) : (
                      <div className="template-preview-error">
                        <AlertCircle size={24} />
                        <p>Preview unavailable</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            loadTemplatePreview(template.id)
                          }}
                          className="btn-retry-preview-small"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="template-card-footer">
                    <div className="template-card-header">
                      <h3>{template.name}</h3>
                      {selectedTemplate === template.id && (
                        <CheckCircle size={20} className="check-icon" />
                      )}
                    </div>
                    <p>{template.description || 'Professional certificate design'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: UPLOAD CSV */}
        {currentStep === 2 && (
          <div className="step-content">
            <div className="step-header-with-action">
              <div>
                <h2>Upload Recipients</h2>
                <p>Upload a CSV file with student details.</p>
              </div>
              <button onClick={downloadTemplate} className="btn-download-template-new">
                <Download size={14} /> Template
              </button>
            </div>

            <div
              className={`upload-zone-new ${csvFile ? 'has-file' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
            >
              {csvFile ? (
                <div className="file-uploaded">
                  <div className="file-icon-wrapper">
                    <FileText size={32} />
                  </div>
                  <h3>{csvFile.name}</h3>
                  <p className="file-status-success">
                    <CheckCircle size={12} /> Ready to process
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setCsvFile(null)
                      setRecipients([])
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    className="btn-remove-file"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <div className="file-placeholder-new">
                  <div className="upload-icon-wrapper">
                    <UploadCloud size={32} />
                  </div>
                  <h3>Click or Drag File Here</h3>
                  <p>Supported format: .CSV (Max 5MB)</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <div className="info-box">
              <AlertCircle size={18} />
              <div>
                <strong>Tip:</strong> Ensure your CSV has columns named 'Name', 'Email', and 'Course'. 
                Missing fields may cause issuance errors.
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW */}
        {currentStep === 3 && (
          <div className="step-content">
            <div className="step-header-with-action">
              <div>
                <h2>Review & Personalize</h2>
                <p>
                  We found <span className="highlight">{recipients.length} recipients</span>. 
                  Use AI to generate personal notes.
                </p>
              </div>

              <button
                onClick={generateAIMessages}
                disabled={isGeneratingAI || (recipients.length > 0 && recipients[0].aiMsg !== '')}
                className={`btn-ai-generate ${
                  isGeneratingAI
                    ? 'generating'
                    : recipients.length > 0 && recipients[0].aiMsg !== ''
                      ? 'ready'
                      : ''
                }`}
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 size={14} className="spinning" /> Generating...
                  </>
                ) : recipients.length > 0 && recipients[0].aiMsg !== '' ? (
                  <>
                    <CheckCircle size={14} /> AI Notes Ready
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> Generate Personal Notes
                  </>
                )}
              </button>
            </div>

            <div className="recipients-table-container">
              <table className="recipients-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>AI Message</th>
                    <th className="text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((r, i) => (
                    <tr key={i}>
                      <td className="font-medium">{r.name}</td>
                      <td className="text-secondary">{r.email}</td>
                      <td>
                        {r.aiMsg ? (
                          <div className="ai-message-box">
                            <MessageSquare size={12} />
                            {r.aiMsg}
                          </div>
                        ) : (
                          <span className="text-pending">Pending generation...</span>
                        )}
                      </td>
                      <td className="text-right">
                        {r.status.includes('Error') ? (
                          <span className="status-badge error">{r.status}</span>
                        ) : (
                          <span className="status-badge success">Valid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="review-footer">
              * {validCount} Valid records will be processed. {recipients.length - validCount} Error will be skipped.
            </div>
          </div>
        )}

        {/* STEP 4: PROCESSING & SUCCESS */}
        {currentStep === 4 && (
          <div className="step-content processing-step">
            {!showSuccess ? (
              <div className="processing-state">
                <div className="spinner-container">
                  <div className="spinner-ring"></div>
                  <div className="spinner-ring"></div>
                  <Loader2 size={32} className="spinner-icon" />
                </div>
                <h2>Minting Certificates...</h2>
                <p>Anchoring data to the Bitcoin blockchain. Do not close this tab.</p>
              </div>
            ) : (
              <div className="success-state">
                <div className="success-icon-large">
                  <CheckCircle size={48} />
                </div>
                <h2>Batch Completed!</h2>
                <p>
                  Successfully issued <span className="highlight">{results?.successful || 0} certificates</span>. 
                  Emails have been queued for delivery to the recipients.
                </p>

                <div className="success-actions">
                  <button onClick={resetForm} className="btn-secondary-new">
                    Start New Batch
                  </button>
                  <button 
                    onClick={() => setShowCertificatesView(true)}
                    className="btn-view-certificates"
                    disabled={!results || !results.certificates || results.certificates.length === 0}
                  >
                    View Certificates
                  </button>
                  <button 
                    onClick={downloadAllCertificates}
                    className="btn-primary-new"
                    disabled={isProcessing || !results || !results.certificates || results.certificates.length === 0}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={16} className="spinning" /> Generating ZIP...
                      </>
                    ) : (
                      <>
                        <Download size={16} /> Download ZIP
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Footer */}
        {!showSuccess && currentStep < 4 && (
          <div className="navigation-footer">
            {currentStep > 1 ? (
              <button onClick={handleBack} className="btn-back-new">
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <div></div>
            )}

            <button
              onClick={handleNext}
              disabled={(currentStep === 2 && !csvFile) || (currentStep === 1 && !selectedTemplate)}
              className={`btn-continue ${
                (currentStep === 2 && !csvFile) || (currentStep === 1 && !selectedTemplate)
                  ? 'disabled'
                  : ''
              }`}
            >
              {currentStep === 3 ? 'Mint Certificates' : 'Continue'} <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Certificates View Modal */}
      {showCertificatesView && results && results.certificates && (
        <div className="certificates-modal-overlay" onClick={() => setShowCertificatesView(false)}>
          <div className="certificates-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Generated Certificates</h2>
              <button 
                className="modal-close-btn"
                onClick={() => setShowCertificatesView(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              <div className="certificates-list-modal">
                {results.certificates.map((certificate) => (
                  <div key={certificate.id} className="certificate-item-modal">
                    <div className="cert-item-info">
                      <h3>{certificate.studentName}</h3>
                      <p>{certificate.courseType}</p>
                      <span className="cert-id-small">{certificate.id}</span>
                    </div>
                    <div className="cert-item-actions">
                      <button
                        onClick={() => handleViewCertificate(certificate)}
                        className="btn-view-cert"
                        disabled={viewingCertificateId === certificate.id}
                      >
                        {viewingCertificateId === certificate.id ? (
                          <>
                            <Loader2 size={16} className="spinning" /> Opening...
                          </>
                        ) : (
                          <>
                            <FileText size={16} /> View
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={downloadAllCertificates}
                className="btn-download-zip-modal"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="spinning" /> Generating ZIP...
                  </>
                ) : (
                  <>
                    <Download size={16} /> Download All as ZIP
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BatchProcessing
