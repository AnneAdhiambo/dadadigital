import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Papa from 'papaparse'
import { 
  generateCertificateId, 
  createDigitalSignature, 
  saveCertificate,
  hashPDF,
  updateCertificatePDFHash
} from '../utils/certificateUtils'
import { populateTemplate, getAllTemplates } from '../utils/templateUtils'
import { publishToNostr, isCertificatePublishedToNostr, storeNostrEventInfo } from '../utils/nostrUtils'
import { createAndDownloadZip } from '../utils/zipUtils'
import TemplateSelector from '../components/TemplateSelector'
import CertificateHTMLPreview from '../components/CertificateHTMLPreview'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  X, 
  Zap, 
  Database, 
  Download,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  FileDown,
  FolderDown,
  Settings,
  ChevronRight
} from 'lucide-react'
import './BatchProcessing.css'

const STEPS = [
  { id: 1, name: 'Select Template', icon: Settings },
  { id: 2, name: 'Import Data', icon: Upload },
  { id: 3, name: 'Verify', icon: CheckCircle },
  { id: 4, name: 'Generate', icon: Zap },
  { id: 5, name: 'Download', icon: Download }
]

function BatchProcessing() {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [csvFile, setCsvFile] = useState(null)
  const [csvData, setCsvData] = useState(null)
  const [validationResults, setValidationResults] = useState(null)
  const [generatedCertificates, setGeneratedCertificates] = useState([])
  const [certificatePdfs, setCertificatePdfs] = useState({}) // Map of certId -> pdfBlob
  const [processing, setProcessing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [nostrSteps, setNostrSteps] = useState([])
  const [processingProgress, setProcessingProgress] = useState(null)
  const [selectedCertificate, setSelectedCertificate] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [downloadingZip, setDownloadingZip] = useState(false)
  const fileInputRef = useRef(null)
  const terminalRef = useRef(null)

  // Check for template selection from navigation state
  useEffect(() => {
    if (location.state?.selectedTemplate) {
      setSelectedTemplate(location.state.selectedTemplate)
    }
  }, [location.state])

  // Auto-scroll terminal
  useEffect(() => {
    if (nostrSteps.length > 0 && terminalRef.current) {
      const output = terminalRef.current.querySelector('.batch-terminal-output')
      if (output) {
        output.scrollTop = output.scrollHeight
      }
    }
  }, [nostrSteps])

  const addTerminalStep = (message, status = 'info') => {
    setNostrSteps(prev => [...prev, {
      message,
      status,
      timestamp: new Date()
    }])
    
    setTimeout(() => {
      if (terminalRef.current) {
        const output = terminalRef.current.querySelector('.batch-terminal-output')
        if (output) {
          output.scrollTop = output.scrollHeight
        }
      }
    }, 50)
  }

  // Step 1: Template Selection
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId)
  }


  // Step 2: Import Data
  const downloadCSVTemplate = () => {
    const templateData = [
      {
        studentName: 'John Doe',
        cohort: 'Cohort 2025-01',
        courseType: 'Bitcoin & Blockchain Fundamentals',
        certificateType: 'Certificate of Completion',
        issueDate: new Date().toISOString().split('T')[0],
        instructor: 'Lead Instructor',
        studentEmail: 'john.doe@example.com'
      },
      {
        studentName: 'Jane Smith',
        cohort: 'Cohort 2025-01',
        courseType: 'Advanced Bitcoin Development',
        certificateType: 'Certificate of Achievement',
        issueDate: new Date().toISOString().split('T')[0],
        instructor: 'Lead Instructor',
        studentEmail: 'jane.smith@example.com'
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
    URL.revokeObjectURL(url)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    setUploading(true)
    setCsvFile(file)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data)
        setUploading(false)
      },
      error: (error) => {
        alert(`Error parsing CSV: ${error.message}`)
        setUploading(false)
        setCsvFile(null)
      }
    })
  }

  // Step 3: Verify
  const validateRow = (row, index) => {
    const requiredFields = ['studentName', 'cohort', 'courseType', 'certificateType', 'issueDate']
    const missingFields = requiredFields.filter(field => !row[field] || String(row[field]).trim() === '')
    
    if (missingFields.length > 0) {
      return {
        valid: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      }
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(row.issueDate)) {
      return {
        valid: false,
        error: `Invalid date format. Use YYYY-MM-DD format`
      }
    }

    return { valid: true }
  }

  const handleVerify = () => {
    if (!csvData || csvData.length === 0) {
      alert('Please import CSV data first')
      return
    }

    const valid = []
    const invalid = []
    const errors = []

    csvData.forEach((row, index) => {
      const validation = validateRow(row, index)
      if (validation.valid) {
        valid.push({ row: index + 1, data: row })
      } else {
        invalid.push({ row: index + 1, data: row, error: validation.error })
        errors.push(`Row ${index + 1}: ${validation.error}`)
      }
    })

    setValidationResults({
      total: csvData.length,
      valid: valid.length,
      invalid: invalid.length,
      validRows: valid,
      invalidRows: invalid,
      errors
    })
  }

  // Step 4: Generate
  const handleGenerate = async () => {
    if (!validationResults || validationResults.valid === 0) {
      alert('Please verify data first and ensure there are valid rows')
      return
    }

    setProcessing(true)
    setNostrSteps([])
    setGeneratedCertificates([])
    setCertificatePdfs({})

    addTerminalStep('Starting batch generation...', 'info')
    addTerminalStep(`Template: ${getAllTemplates().find(t => t.id === selectedTemplate)?.name || selectedTemplate}`, 'info')
    addTerminalStep(`Processing ${validationResults.valid} certificates...`, 'info')
    addTerminalStep('', 'divider')

    const certificates = []
    const pdfs = {}

    for (let i = 0; i < validationResults.validRows.length; i++) {
      const item = validationResults.validRows[i]
      const row = item.data
      
      setProcessingProgress({
        current: i + 1,
        total: validationResults.valid,
        percentage: Math.round(((i + 1) / validationResults.valid) * 100)
      })

      try {
        addTerminalStep(`Processing ${i + 1}/${validationResults.valid}: ${row.studentName}`, 'in_progress')
        
        const certificateId = generateCertificateId()
        const certificate = {
          id: certificateId,
          studentName: row.studentName.trim(),
          cohort: row.cohort.trim(),
          courseType: row.courseType.trim(),
          certificateType: row.certificateType.trim(),
          issueDate: row.issueDate.trim(),
          templateId: selectedTemplate,
          instructor: row.instructor?.trim() || 'Lead Instructor',
          studentEmail: row.studentEmail?.trim() || '',
          createdAt: new Date().toISOString()
        }

        const signature = createDigitalSignature(certificate)
        certificate.signature = signature

        saveCertificate(certificate)
        addTerminalStep(`  ✓ Certificate ${certificateId} created`, 'completed')

        addTerminalStep(`  → Generating PDF...`, 'in_progress')
        const pdfBlob = await populateTemplate(null, certificate, selectedTemplate)
        pdfs[certificateId] = pdfBlob
        addTerminalStep(`  ✓ PDF generated`, 'completed')

        addTerminalStep(`  → Calculating hash...`, 'in_progress')
        const pdfHash = await hashPDF(pdfBlob)
        const updated = updateCertificatePDFHash(certificateId, pdfHash)
        certificate.pdfHash = pdfHash
        addTerminalStep(`  ✓ Hash calculated`, 'completed')

        if (updated && pdfHash && !isCertificatePublishedToNostr(updated)) {
          try {
            addTerminalStep(`  → Publishing to Nostr...`, 'in_progress')
            const nostrResult = await publishToNostr(updated, (progress) => {
              if (progress.step === 'publishing' && progress.status === 'completed' && progress.success) {
                addTerminalStep(`  ✓ Published to ${progress.relayName}`, 'completed')
              } else if (progress.step === 'publishing' && progress.status === 'error') {
                addTerminalStep(`  ✗ Failed: ${progress.relayName}`, 'error')
              }
            })
            
            if (nostrResult && nostrResult.eventId) {
              storeNostrEventInfo(certificateId, nostrResult.eventId, nostrResult.pubKey)
              addTerminalStep(`  ✓ Published to ${nostrResult.publishedTo}/${nostrResult.totalRelays} relays`, 'completed')
            }
          } catch (nostrError) {
            addTerminalStep(`  ✗ Nostr error: ${nostrError.message}`, 'error')
          }
        }

        certificates.push(certificate)
        addTerminalStep(`✓ Row ${item.row} completed successfully`, 'completed')
        addTerminalStep('', 'divider')
      } catch (error) {
        addTerminalStep(`✗ Row ${item.row}: ${error.message}`, 'error')
        addTerminalStep('', 'divider')
      }
    }

    addTerminalStep('', 'divider')
    addTerminalStep(`Generation complete! ${certificates.length} certificates created`, 'completed')

    setGeneratedCertificates(certificates)
    setCertificatePdfs(pdfs)
    setProcessing(false)
    setProcessingProgress(null)
  }

  // Step 5: View
  const handleViewCertificate = (certificate) => {
    // No PDF conversion needed - just set selected certificate
    setSelectedCertificate(certificate)
  }

  // Step 6: Download One
  const handleDownloadOne = (certificate) => {
    const pdfBlob = certificatePdfs[certificate.id]
    if (pdfBlob) {
      const filename = `Certificate_${certificate.studentName.replace(/[^a-z0-9]/gi, '_')}_${certificate.id}.pdf`
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  // Step 7: Download ZIP
  const handleDownloadZip = async () => {
    if (generatedCertificates.length === 0) {
      alert('No certificates to download')
      return
    }

    setDownloadingZip(true)
    try {
      const certificatesWithPdfs = generatedCertificates.map(cert => ({
        id: cert.id,
        studentName: cert.studentName,
        pdfBlob: certificatePdfs[cert.id]
      })).filter(cert => cert.pdfBlob)

      await createAndDownloadZip(certificatesWithPdfs, null, (current, total) => {
        console.log(`ZIP progress: ${current}/${total}`)
      })

      alert(`Successfully downloaded ${certificatesWithPdfs.length} certificates as ZIP`)
    } catch (error) {
      alert(`Error creating ZIP: ${error.message}`)
    } finally {
      setDownloadingZip(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!selectedTemplate) {
        alert('Please select a template')
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (!csvData || csvData.length === 0) {
        alert('Please import CSV data first')
        return
      }
      setCurrentStep(3)
      handleVerify()
    } else if (currentStep === 3) {
      if (!validationResults || validationResults.valid === 0) {
        alert('Please verify data first. There must be at least one valid row.')
        return
      }
      setCurrentStep(4)
      handleGenerate()
    } else if (currentStep === 4) {
      if (generatedCertificates.length === 0) {
        alert('Please generate certificates first')
        return
      }
      setCurrentStep(5)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleReset = () => {
    setCurrentStep(1)
    setCsvFile(null)
    setCsvData(null)
    setValidationResults(null)
    setGeneratedCertificates([])
    setCertificatePdfs({})
    setNostrSteps([])
    setProcessingProgress(null)
    setSelectedCertificate(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2>Step 1: Select Template</h2>
            <p className="step-description">Choose a certificate template for this batch</p>
            <TemplateSelector
              selectedTemplate={selectedTemplate}
              onSelect={handleTemplateSelect}
            />
          </div>
        )

      case 2:
        return (
          <div className="step-content">
            <h2>Step 2: Import Data</h2>
            <p className="step-description">Upload your CSV file with certificate data</p>
            
            <div className="csv-template-section">
              <button onClick={downloadCSVTemplate} className="btn-secondary">
                <Download size={18} />
                Download CSV Template
              </button>
            </div>

            <div className="file-upload-area-modern">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="file-input-hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="file-label-modern">
                {csvFile ? (
                  <div className="file-selected-modern">
                    <CheckCircle size={24} />
                    <span>{csvFile.name}</span>
                    <span className="file-row-count">
                      {csvData ? `${csvData.length} rows loaded` : 'Loading...'}
                    </span>
                  </div>
                ) : (
                  <div className="file-placeholder-modern">
                    <Upload size={48} />
                    <span>Click to select CSV file or drag and drop</span>
                    <small>CSV files only</small>
                  </div>
                )}
              </label>
            </div>

            {csvData && csvData.length > 0 && (
              <div className="data-preview">
                <h3>Data Preview (First 5 rows)</h3>
                <div className="preview-table">
                  <table>
                    <thead>
                      <tr>
                        {Object.keys(csvData[0]).map(key => (
                          <th key={key}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 5).map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((val, i) => (
                            <td key={i}>{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="preview-note">Total rows: {csvData.length}</p>
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="step-content">
            <h2>Step 3: Verify</h2>
            <p className="step-description">Review and validate your data</p>

            {!validationResults ? (
              <div className="verify-prompt">
                <p>Click "Verify Data" to validate all rows</p>
                <button className="btn-primary" onClick={handleVerify}>
                  <CheckCircle size={18} />
                  Verify Data
                </button>
              </div>
            ) : (
              <div className="verification-results">
                <div className="verification-stats">
                  <div className="stat-card total">
                    <div className="stat-number">{validationResults.total}</div>
                    <div className="stat-label">Total Rows</div>
                  </div>
                  <div className="stat-card valid">
                    <div className="stat-number">{validationResults.valid}</div>
                    <div className="stat-label">Valid</div>
                  </div>
                  <div className="stat-card invalid">
                    <div className="stat-number">{validationResults.invalid}</div>
                    <div className="stat-label">Invalid</div>
                  </div>
                </div>

                {validationResults.invalid > 0 && (
                  <div className="validation-errors">
                    <h3>Validation Errors</h3>
                    <div className="errors-list">
                      {validationResults.invalidRows.map((item, idx) => (
                        <div key={idx} className="error-item">
                          <span className="error-row">Row {item.row}:</span>
                          <span className="error-message">{item.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {validationResults.valid === 0 && (
                  <div className="no-valid-warning">
                    <AlertCircle size={24} />
                    <p>No valid rows found. Please fix errors and re-import data.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="step-content">
            <h2>Step 4: Generate</h2>
            <p className="step-description">Generate certificates from validated data</p>

            {processing ? (
              <div className="generation-progress-two-column">
                <div className="generation-left-column">
                  <div className="template-preview-section">
                    <h3>Template Preview</h3>
                    <div className="template-preview-container">
                      {selectedTemplate && validationResults?.validRows?.[0] ? (
                        <CertificateHTMLPreview
                          templateId={selectedTemplate}
                          certificate={{
                            studentName: validationResults.validRows[0].data.studentName || 'Sample Student',
                            courseType: validationResults.validRows[0].data.courseType || 'Bitcoin & Blockchain Fundamentals',
                            cohort: validationResults.validRows[0].data.cohort || 'Cohort 2025-01',
                            certificateType: validationResults.validRows[0].data.certificateType || 'Certificate of Completion',
                            issueDate: validationResults.validRows[0].data.issueDate || new Date().toISOString().split('T')[0],
                            instructor: validationResults.validRows[0].data.instructor || 'Lead Instructor'
                          }}
                          scale={0.5}
                        />
                      ) : (
                        <div className="preview-placeholder">
                          <p>Select template and import data to see preview</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="generation-right-column">
                  {processingProgress && (
                    <div className="progress-bar-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${processingProgress.percentage}%` }}
                        />
                      </div>
                      <div className="progress-text">
                        {processingProgress.current} / {processingProgress.total} ({processingProgress.percentage}%)
                      </div>
                    </div>
                  )}

                  <div className="batch-terminal-section" ref={terminalRef}>
                    <div className="batch-terminal-header-inner">
                      <Zap size={14} />
                      <span>GENERATION TERMINAL</span>
                    </div>
                    <div className="batch-terminal-output">
                      {nostrSteps.map((step, index) => {
                        const timestamp = step.timestamp ? new Date(step.timestamp).toLocaleTimeString() : ''
                        const statusIcon = step.status === 'in_progress' ? '⟳' : 
                                          step.status === 'completed' ? '✓' : 
                                          step.status === 'error' ? '✗' : 
                                          step.status === 'divider' ? '' : '→'
                        const statusColor = step.status === 'in_progress' ? '#3b82f6' : 
                                           step.status === 'completed' ? '#10b981' : 
                                           step.status === 'error' ? '#ef4444' : '#ffffff'
                        
                        if (step.status === 'divider') {
                          return <div key={index} className="batch-terminal-divider"></div>
                        }
                        
                        return (
                          <div key={index} className={`batch-terminal-line ${step.status}`}>
                            <span className="terminal-timestamp">{timestamp}</span>
                            <span className="terminal-status" style={{ color: statusColor }}>{statusIcon}</span>
                            <span className="terminal-message">{step.message}</span>
                          </div>
                        )
                      })}
                      {processing && (
                        <div className="batch-terminal-line in_progress">
                          <span className="terminal-cursor">▊</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : generatedCertificates.length > 0 ? (
              <div className="generation-complete">
                <CheckCircle size={48} style={{ color: '#10b981' }} />
                <h3>Generation Complete!</h3>
                <p>{generatedCertificates.length} certificates generated successfully</p>
              </div>
            ) : (
              <div className="generate-prompt-two-column">
                <div className="generate-left-column">
                  <div className="template-preview-section">
                    <h3>Template Preview</h3>
                    <div className="template-preview-container">
                      {selectedTemplate && validationResults?.validRows?.[0] ? (
                        <CertificateHTMLPreview
                          templateId={selectedTemplate}
                          certificate={{
                            studentName: validationResults.validRows[0].data.studentName || 'Sample Student',
                            courseType: validationResults.validRows[0].data.courseType || 'Bitcoin & Blockchain Fundamentals',
                            cohort: validationResults.validRows[0].data.cohort || 'Cohort 2025-01',
                            certificateType: validationResults.validRows[0].data.certificateType || 'Certificate of Completion',
                            issueDate: validationResults.validRows[0].data.issueDate || new Date().toISOString().split('T')[0],
                            instructor: validationResults.validRows[0].data.instructor || 'Lead Instructor'
                          }}
                          scale={0.5}
                        />
                      ) : (
                        <div className="preview-placeholder">
                          <p>Select template and import data to see preview</p>
                        </div>
                      )}
                    </div>
                    <div className="generate-button-container">
                      <p className="ready-text">Ready to generate {validationResults?.valid || 0} certificates</p>
                      <button 
                        className="btn-generate-large" 
                        onClick={handleGenerate} 
                        disabled={!validationResults || validationResults.valid === 0}
                      >
                        <Zap size={24} />
                        Start Generation
                      </button>
                    </div>
                  </div>
                </div>
                <div className="generate-right-column">
                  <div className="terminal-placeholder">
                    <Zap size={48} style={{ color: 'var(--admin-text-secondary)', opacity: 0.3 }} />
                    <p>Terminal will appear here during generation</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 5:
        return (
          <div className="step-content">
            <h2>Step 5: Download</h2>
            <p className="step-description">View, preview, and download certificates</p>

            <div className="download-section-combined">
              {/* View/Preview Section */}
              <div className="certificates-view-section">
                <h3>Generated Certificates ({generatedCertificates.length})</h3>
                <div className="cert-grid">
                  {generatedCertificates.map((cert, idx) => (
                    <div 
                      key={cert.id} 
                      className={`cert-card ${selectedCertificate?.id === cert.id ? 'selected' : ''}`}
                      onClick={() => handleViewCertificate(cert)}
                    >
                      <div className="cert-card-header">
                        <span className="cert-id">{cert.id}</span>
                        <span className="cert-row">#{idx + 1}</span>
                      </div>
                      <div className="cert-card-body">
                        <div className="cert-name">{cert.studentName}</div>
                        <div className="cert-details">
                          {cert.courseType}
                        </div>
                        <div className="cert-cohort">{cert.cohort}</div>
                      </div>
                      <div className="cert-card-actions">
                        <button 
                          className="btn-view-cert"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewCertificate(cert)
                          }}
                        >
                          <Eye size={16} />
                          View
                        </button>
                        <button 
                          className="btn-download-one-small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownloadOne(cert)
                          }}
                          disabled={!certificatePdfs[cert.id]}
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Panel */}
              {selectedCertificate && (
                <div className="certificate-preview-panel">
                  <div className="preview-header">
                    <h3>Preview: {selectedCertificate.studentName}</h3>
                    <button className="btn-close-preview" onClick={() => {
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl)
                        setPreviewUrl(null)
                      }
                      setSelectedCertificate(null)
                    }}>
                      <X size={20} />
                    </button>
                  </div>
                  <CertificateHTMLPreview
                    templateId={selectedTemplate}
                    certificate={selectedCertificate}
                    scale={0.6}
                  />
                </div>
              )}

              {/* Download All Section */}
              <div className="download-all-section">
                <div className="download-all-card">
                  <FolderDown size={32} style={{ color: 'var(--admin-accent)' }} />
                  <div className="download-all-info">
                    <h3>Download All Certificates</h3>
                    <p>{generatedCertificates.length} certificates ready for download</p>
                  </div>
                  <button 
                    className="btn-download-zip"
                    onClick={handleDownloadZip}
                    disabled={downloadingZip || generatedCertificates.length === 0}
                  >
                    {downloadingZip ? (
                      <>
                        <Zap size={18} className="spinning" />
                        Creating ZIP...
                      </>
                    ) : (
                      <>
                        <FolderDown size={18} />
                        Download All as ZIP
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="batch-processing-modern">
      <div className="wizard-header">
        <h1>Batch Certificate Processing</h1>
        <p className="wizard-subtitle">5-step workflow for processing multiple certificates</p>
      </div>

      {/* Wizard Steps Indicator */}
      <div className="wizard-steps">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id
          
          return (
            <div key={step.id} className={`wizard-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
              <div className="wizard-step-icon">
                {isCompleted ? (
                  <CheckCircle size={20} />
                ) : (
                  <StepIcon size={20} />
                )}
              </div>
              <div className="wizard-step-content">
                <div className="wizard-step-number">Step {step.id}</div>
                <div className="wizard-step-title">{step.name}</div>
              </div>
              {index < STEPS.length - 1 && (
                <ChevronRight size={20} className="wizard-step-arrow" />
              )}
            </div>
          )
        })}
      </div>

      <div className="batch-content-modern">
        {renderStepContent()}

        {/* Navigation */}
        <div className="wizard-navigation">
          <button 
            className="btn-wizard-nav btn-wizard-prev"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft size={18} />
            Back
          </button>
          
          {currentStep < STEPS.length ? (
            <button 
              className="btn-wizard-nav btn-wizard-primary"
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !selectedTemplate) ||
                (currentStep === 2 && (!csvData || csvData.length === 0)) ||
                (currentStep === 3 && (!validationResults || validationResults.valid === 0)) ||
                (currentStep === 4 && (processing || generatedCertificates.length === 0))
              }
            >
              Next
              <ArrowRight size={18} />
            </button>
          ) : (
            <button 
              className="btn-wizard-nav btn-wizard-primary" 
              onClick={handleReset}
            >
              Process Another Batch
            </button>
          )}
        </div>
      </div>

      <LoadingSpinner 
        show={uploading} 
        message="Uploading file..." 
        delay={1000}
      />
    </div>
  )
}

export default BatchProcessing
