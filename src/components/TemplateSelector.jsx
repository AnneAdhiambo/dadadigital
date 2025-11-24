import { useState, useEffect } from 'react'
import { getAllTemplates, populateTemplate } from '../utils/templateUtils'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import './TemplateSelector.css'

function TemplateSelector({ selectedTemplate, onSelect, previewData = null }) {
  const [templates, setTemplates] = useState([])
  const [previewUrls, setPreviewUrls] = useState({}) // Store PDF preview URLs
  const [loadingPreviews, setLoadingPreviews] = useState({})

  useEffect(() => {
    const templatesList = getAllTemplates()
    setTemplates(templatesList)
    
    // Set default selection if none selected
    if (!selectedTemplate && templatesList.length > 0) {
      onSelect(templatesList[0].id)
    }
    
    // Load previews for all templates immediately
    templatesList.forEach((template, index) => {
      // Stagger loading slightly to avoid overwhelming
      setTimeout(() => {
        loadPreview(template.id)
      }, index * 200)
    })
  }, [])

  useEffect(() => {
    // Reload preview when previewData changes
    if (selectedTemplate) {
      loadPreview(selectedTemplate)
    }
  }, [selectedTemplate, previewData])

  const loadPreview = async (templateId) => {
    try {
      setLoadingPreviews(prev => ({ ...prev, [templateId]: true }))
      console.log('Loading PDF preview for template:', templateId)
      
      const previewDataObj = previewData || {
        studentName: 'John Doe',
        courseType: 'Bitcoin & Blockchain Fundamentals',
        cohort: 'Cohort 2025-01',
        certificateType: 'Certificate of Completion',
        issueDate: new Date().toISOString().split('T')[0],
        id: 'DD-2025-SAMPLE',
        instructor: 'Lead Instructor',
        createdAt: new Date().toISOString()
      }
      
      console.log('Preview data:', previewDataObj)
      console.log('Template ID:', templateId)
      
      // Generate PDF preview
      const pdfBlob = await populateTemplate(null, previewDataObj, templateId)
      
      if (!pdfBlob) {
        throw new Error('PDF blob is null')
      }
      
      if (pdfBlob.size === 0) {
        throw new Error('Generated PDF preview is empty')
      }
      
      console.log('PDF preview generated for', templateId, 'size:', pdfBlob.size, 'bytes')
      
      // Create object URL for preview
      const url = URL.createObjectURL(pdfBlob)
      setPreviewUrls(prev => {
        // Revoke old URL if exists
        if (prev[templateId]) {
          URL.revokeObjectURL(prev[templateId])
        }
        return { ...prev, [templateId]: url }
      })
      
      console.log('Preview URL created for', templateId, ':', url)
    } catch (error) {
      console.error('Error loading preview for', templateId, ':', error)
      console.error('Error details:', error.message, error.stack)
      setPreviewUrls(prev => ({ ...prev, [templateId]: null }))
    } finally {
      setLoadingPreviews(prev => ({ ...prev, [templateId]: false }))
    }
  }

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach(url => {
        if (url) URL.revokeObjectURL(url)
      })
    }
  }, [])

  return (
    <div className="template-selector">
      <div className="templates-grid">
        {templates.map(template => (
          <div
            key={template.id}
            className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
            onClick={() => onSelect(template.id)}
          >
            <div className="template-card-header">
              <h4>{template.name}</h4>
              <p className="template-description">{template.description}</p>
            </div>
            <div className="template-preview">
              {loadingPreviews[template.id] ? (
                <div className="preview-loading">Loading preview...</div>
              ) : previewUrls[template.id] ? (
                <iframe
                  src={previewUrls[template.id]}
                  className="preview-pdf-container"
                  title={`Preview of ${template.name}`}
                  onLoad={() => console.log(`Preview loaded for ${template.name}`)}
                  onError={(e) => {
                    console.error(`Preview error for ${template.name}:`, e)
                  }}
                />
              ) : (
                <div className="preview-placeholder">
                  <p>Preview unavailable</p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      loadPreview(template.id)
                    }}
                    className="btn-retry-template-preview"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
            {selectedTemplate === template.id && (
              <div className="template-selected-badge">
                <CheckCircle size={14} style={{ marginRight: '0.25rem', display: 'inline-block' }} />
                Selected
              </div>
            )}
          </div>
        ))}
      </div>
      
      {!selectedTemplate && (
        <div className="template-warning" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={16} />
          Please select a template to continue
        </div>
      )}
    </div>
  )
}

export default TemplateSelector
