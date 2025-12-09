import { useEffect, useState } from 'react'
import { getTemplate, loadTemplate } from '../utils/templateUtils'
import { getSignatureById } from '../utils/signatureUtils'
import './CertificateHTMLPreview.css'

/**
 * Renders certificate preview using HTML/CSS (no PDF generation)
 * Uses the same rendering logic as TemplateEditorPage
 */
function CertificateHTMLPreview({ 
  templateId, 
  certificate, 
  scale = 1.0,
  className = '' 
}) {
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null)
  const [elements, setElements] = useState([])
  const [imageDimensions, setImageDimensions] = useState({ width: 1200, height: 800 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTemplateData() {
      if (!templateId) return
      
      setLoading(true)
      try {
        const template = getTemplate(templateId)
        if (!template) {
          console.error('Template not found:', templateId)
          return
        }

        console.log('Loading template for preview:', templateId, template)

        // Load background image
        const imageUrl = await loadTemplate(templateId)
        setBackgroundImageUrl(imageUrl)

        // Load image dimensions from template
        if (template.imageWidth && template.imageHeight) {
          setImageDimensions({ width: template.imageWidth, height: template.imageHeight })
        } else {
          // Detect dimensions from image if not stored
          const img = new Image()
          img.onload = () => {
            setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
          }
          img.src = imageUrl
        }

        // Load elements - ONLY use elements array, never convert textPositions
        // This ensures template manager output is exactly what gets rendered
        if (template.elements && template.elements.length > 0) {
          console.log('Template has elements:', template.elements.length, template.elements)
          setElements(template.elements)
        } else {
          // No elements - template is clean, user needs to add elements
          console.log('Template has no elements - showing empty template')
          setElements([])
        }
      } catch (error) {
        console.error('Error loading template:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTemplateData()
  }, [templateId])

  const getTextForField = (field, element) => {
    // Handle custom text elements - always render custom text
    if (field === 'custom') {
      return element?.customText || 'Custom Text'
    }
    
    // Define placeholders for blueprint mode (templates should always show something)
    const placeholders = {
      studentName: 'Student Name',
      courseType: 'Course Type',
      cohort: 'Cohort 2025-01',
      certificateType: 'Certificate of Completion',
      issueDate: formatDate(certificate?.issueDate || new Date().toISOString()),
      signerName: 'Lead Instructor',
      signerTitle: 'Course Director'
    }
    
    // If no certificate data, return placeholder
    if (!certificate) {
      return placeholders[field] || 'Sample Text'
    }
    
    // Get value from certificate, use placeholder if empty or missing
    // This ensures templates always render as blueprints
    const fieldMap = {
      studentName: certificate.studentName?.trim() || placeholders.studentName,
      courseType: certificate.courseType?.trim() || placeholders.courseType,
      cohort: certificate.cohort?.trim() || placeholders.cohort,
      certificateType: certificate.certificateType?.trim() || placeholders.certificateType,
      issueDate: certificate.issueDate ? formatDate(certificate.issueDate) : placeholders.issueDate,
      signerName: certificate.instructor?.trim() || placeholders.signerName,
      signerTitle: placeholders.signerTitle
    }
    
    return fieldMap[field] || placeholders[field] || 'Sample Text'
  }

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading || !backgroundImageUrl) {
    return (
      <div className={`certificate-html-preview-loading ${className}`}>
        <p>Loading preview...</p>
      </div>
    )
  }

  return (
    <div 
      className={`certificate-html-preview ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        border: '2px solid var(--admin-border, #333)',
        backgroundColor: '#ffffff',
        margin: 'auto'
      }}
    >
      <img
        src={backgroundImageUrl}
        alt="Certificate template"
        style={{
          maxWidth: `${imageDimensions.width}px`,
          maxHeight: `${imageDimensions.height}px`,
          width: 'auto',
          height: 'auto',
          display: 'block',
          objectFit: 'contain'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${imageDimensions.width}px`,
          height: `${imageDimensions.height}px`,
          pointerEvents: 'none'
        }}
      >
      {elements.map(element => {
        if (element.type === 'text') {
          const text = getTextForField(element.field, element)
          const textAlign = element.align || 'center'
          const fontFamily = element.fontFamily || 'Amsterdam Four_ttf 400'
          // For web fonts, don't wrap in quotes
          const fontFamilyValue = ['Montserrat', 'Poppins', 'Open Sans'].includes(fontFamily) 
            ? fontFamily 
            : `"${fontFamily}"`
          
          return (
            <div
              key={element.id}
              className="certificate-html-text"
              style={{
                position: 'absolute',
                left: `${element.x}px`,
                top: `${element.y}px`,
                fontSize: `${element.fontSize}px`,
                fontWeight: element.fontWeight || 'normal',
                fontFamily: `${fontFamilyValue}, Arial, sans-serif`,
                color: element.color || '#000000',
                textAlign: textAlign,
                transform: textAlign === 'center' 
                  ? 'translate(-50%, -50%)' 
                  : textAlign === 'right'
                  ? 'translate(-100%, -50%)'
                  : 'translate(0, -50%)',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
                pointerEvents: 'none'
              }}
            >
              {text}
            </div>
          )
        } else if (element.type === 'signature') {
          const signature = element.signatureId 
            ? getSignatureById(element.signatureId)
            : null
          
          return (
            <div
              key={element.id}
              className="certificate-html-signature"
              style={{
                position: 'absolute',
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: `${element.width || 200}px`,
                height: `${element.height || 80}px`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none'
              }}
            >
              {signature?.signatureData ? (
                <img 
                  src={signature.signatureData} 
                  alt="Signature" 
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  border: '1px dashed #ccc',
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  Signature Placeholder
                </div>
              )}
            </div>
          )
        }
        return null
      })}
      </div>
    </div>
  )
}

export default CertificateHTMLPreview

