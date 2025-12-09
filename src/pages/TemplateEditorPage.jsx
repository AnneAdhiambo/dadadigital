import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { 
  getAllTemplates, 
  getTemplate,
  loadTemplate
} from '../utils/templateUtils'
import {
  saveCustomTemplate,
  getCustomTemplate
} from '../utils/templateStorage'
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2,
  Type,
  PenTool,
  Upload,
  X,
  Search,
  QrCode
} from 'lucide-react'
import { getStoredSignatures, getSignatureById } from '../utils/signatureUtils'
import './TemplateEditorPage.css'

function TemplateEditorPage() {
  const navigate = useNavigate()
  const { templateId } = useParams()
  const { theme } = useTheme()
  
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [originalTemplateName, setOriginalTemplateName] = useState('') // Track original name for "Save As"
  const [backgroundImage, setBackgroundImage] = useState(null)
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null)
  const [imageDimensions, setImageDimensions] = useState({ width: 1200, height: 800 }) // Default, will be updated when image loads
  const [elements, setElements] = useState([])
  const [selectedElement, setSelectedElement] = useState(null)
  const [activeField, setActiveField] = useState(null)
  const [activeElementType, setActiveElementType] = useState(null)
  const [previewScale, setPreviewScale] = useState(1.0)
  const [isSaving, setIsSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState('edit') // 'edit' or 'final'
  
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const imageRef = useRef(null)

  const fieldOptions = [
    { key: 'studentName', label: 'Student Name', required: true },
    { key: 'courseType', label: 'Course Type', required: true },
    { key: 'cohort', label: 'Cohort', required: false },
    { key: 'certificateType', label: 'Certificate Type', required: false },
    { key: 'issueDate', label: 'Issue Date', required: false },
    { key: 'signerName', label: 'Signer Name', required: false },
    { key: 'signerTitle', label: 'Signer Title', required: false },
    { key: 'custom', label: 'Custom Text', required: false }
  ]

  const availableFonts = [
    { value: 'Amsterdam Four_ttf 400', label: 'Amsterdam Four' },
    { value: 'Brightwall Personal Use Only', label: 'Brightwall' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Poppins', label: 'Poppins' },
    { value: 'Open Sans', label: 'Open Sans' }
  ]


  const loadExistingTemplate = useCallback(async (id) => {
    try {
      const template = getTemplate(id)
      if (!template) {
        alert('Template not found')
        navigate('/admin/templates')
        return
      }

      setTemplateName(template.name || '')
      setOriginalTemplateName(template.name || '') // Store original name for "Save As" detection
      setTemplateDescription(template.description || '')
      
      // Load background image - ensure it persists
      if (template.templateContent) {
        const imageUrl = template.templateContent
        setBackgroundImageUrl(imageUrl)
        // Load image dimensions if stored
        if (template.imageWidth && template.imageHeight) {
          setImageDimensions({ width: template.imageWidth, height: template.imageHeight })
        } else {
          // Detect dimensions from image
          const img = new Image()
          img.onload = () => {
            setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
          }
          img.onerror = () => {
            console.error('Failed to load image from templateContent')
          }
          img.src = imageUrl
        }
      } else if (template.filename) {
        try {
          const imageUrl = await loadTemplate(id)
          if (imageUrl) {
            setBackgroundImageUrl(imageUrl)
            // Detect dimensions from image
            const img = new Image()
            img.onload = () => {
              setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
            }
            img.onerror = () => {
              console.error('Failed to load image from filename')
            }
            img.src = imageUrl
          }
        } catch (error) {
          console.error('Error loading template image:', error)
        }
      }

      // Load elements - ONLY use elements array, NEVER auto-convert textPositions
      // Base templates should start clean with no elements - user adds them manually
      if (template.elements && template.elements.length > 0) {
        // Use elements array - this is the new format
        setElements(template.elements)
      } else {
        // Start with empty elements - user will add elements manually
        // Do NOT auto-convert textPositions - this causes prefilled templates
        setElements([])
      }
    } catch (error) {
      console.error('Error loading template:', error)
      alert('Failed to load template')
    }
  }, [navigate])

  useEffect(() => {
    if (templateId && templateId !== 'new') {
      loadExistingTemplate(templateId)
    }
  }, [templateId, loadExistingTemplate])



  const handleBackgroundUpload = (e) => {
    const file = e.target.files[0]
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const url = event.target.result
        setBackgroundImageUrl(url)
        setBackgroundImage(file)
        
        // Detect actual image dimensions
        const img = new Image()
        img.onload = () => {
          setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
          console.log('Image dimensions detected:', img.naturalWidth, 'x', img.naturalHeight)
        }
        img.src = url
      }
      reader.readAsDataURL(file)
    } else {
      alert('Please upload a PNG or JPEG image')
    }
  }

  const handleCanvasClick = (e) => {
    if (!activeElementType || !backgroundImageUrl) return

    const imageElement = imageRef.current
    if (!imageElement) return

    // Get the image element's bounding rect to calculate accurate coordinates
    const imageRect = imageElement.getBoundingClientRect()
    
    // Calculate scale factor: displayed size vs natural size
    const scale = imageRect.width / imageDimensions.width
    
    // Calculate coordinates relative to the image's natural dimensions
    const x = (e.clientX - imageRect.left) / scale
    const y = (e.clientY - imageRect.top) / scale

    if (activeElementType === 'text' && activeField) {
      const newElement = {
        id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'text',
        field: activeField,
        x: x,
        y: y,
        fontSize: 24,
        fontWeight: 'normal',
        fontFamily: activeField === 'custom' ? 'Montserrat' : 'Amsterdam Four_ttf 400',
        color: '#000000',
        align: 'center',
        customText: activeField === 'custom' ? 'Custom Text' : undefined
      }
      setElements([...elements, newElement])
      setSelectedElement(newElement.id)
      setActiveElementType(null)
      setActiveField(null)
    } else if (activeElementType === 'signature') {
      // Handle signature placement
      const newElement = {
        id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'signature',
        x: x,
        y: y,
        width: 200,
        height: 80,
        signatureId: null
      }
      setElements([...elements, newElement])
      setSelectedElement(newElement.id)
      setActiveElementType(null)
    } else if (activeElementType === 'qrcode') {
      // Handle QR code placement
      const newElement = {
        id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'qrcode',
        x: x,
        y: y,
        size: 70 // Default QR code size
      }
      setElements([...elements, newElement])
      setSelectedElement(newElement.id)
      setActiveElementType(null)
    }
  }

  const handleElementUpdate = (elementId, updates) => {
    setElements(elements.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ))
  }

  const handleElementDelete = (elementId) => {
    if (window.confirm('Delete this element?')) {
      setElements(elements.filter(el => el.id !== elementId))
      if (selectedElement === elementId) {
        setSelectedElement(null)
      }
    }
  }

  const handleElementDrag = (elementId, x, y) => {
    setElements(elements.map(el => 
      el.id === elementId ? { ...el, x, y } : el
    ))
  }

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name')
      return
    }

    if (!backgroundImageUrl) {
      alert('Please upload a background image')
      return
    }

    const requiredFields = fieldOptions.filter(f => f.required)
    const hasRequiredFields = requiredFields.some(f => 
      elements.some(el => el.type === 'text' && el.field === f.key)
    )

    if (!hasRequiredFields) {
      alert(`Please add at least one required field: ${requiredFields.map(f => f.label).join(', ')}`)
      return
    }

    setIsSaving(true)
    try {
      // "Save As" logic: If name changed from original, create new template
      const nameChanged = templateId && templateId !== 'new' && 
                         originalTemplateName && 
                         templateName.trim() !== originalTemplateName.trim()
      
      // When using elements array, do NOT save textPositions to avoid double rendering
      // Only save textPositions for backward compatibility with very old templates
      const templateData = {
        // If name changed, create new template (Save As), otherwise use existing ID
        id: (nameChanged || templateId === 'new') ? undefined : templateId,
        name: templateName.trim(),
        description: templateDescription.trim(),
        type: 'png',
        elements: elements, // Can be empty array - user adds elements manually
        // Do NOT include textPositions when elements exist - this prevents double rendering
        textPositions: undefined,
        templateContent: backgroundImageUrl, // Always save the image URL
        imageWidth: imageDimensions.width, // Store actual image dimensions
        imageHeight: imageDimensions.height, // Store actual image dimensions
        createdAt: (nameChanged || templateId === 'new') ? new Date().toISOString() : (getTemplate(templateId)?.createdAt || new Date().toISOString()),
        updatedAt: new Date().toISOString()
      }

      // If editing from a base template, preserve the baseTemplateId relationship
      if (templateId && templateId !== 'new') {
        const existingTemplate = getTemplate(templateId)
        if (existingTemplate?.baseTemplateId) {
          templateData.baseTemplateId = existingTemplate.baseTemplateId
        }
      }

      console.log('Saving template with elements:', templateData.elements?.length || 0, 'elements')
      if (nameChanged) {
        console.log('Name changed - creating new template (Save As)')
      }
      saveCustomTemplate(templateData)
      console.log('Template saved successfully')
      alert(nameChanged ? 'Template saved as new template!' : 'Template saved successfully!')
      navigate('/admin/templates')
    } catch (error) {
      console.error('Error saving template:', error)
      alert(`Error saving template: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedElementData = elements.find(el => el.id === selectedElement)

  return (
    <div className="template-editor-page">
      <div className="template-editor-header">
        <button 
          className="btn-back"
          onClick={() => navigate('/admin/templates')}
        >
          <ArrowLeft size={18} />
          Back to Templates
        </button>
        <h1>{templateId === 'new' ? 'Create New Template' : 'Edit Template'}</h1>
        <button 
          className="btn-save"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Save Template'}
        </button>
      </div>

      <div className="template-editor-content">
        {/* Left Panel - Elements & Controls */}
        <div className="editor-left-panel">
          <div className="panel-section">
            <h3>Template Info</h3>
            <div className="form-group">
              <label>Template Name *</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Achievement Certificate"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Describe this template..."
                rows={3}
              />
            </div>
          </div>

          <div className="panel-section">
            <h3>Background Image</h3>
            <label className="upload-button">
              <Upload size={18} />
              Upload Background
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleBackgroundUpload}
                style={{ display: 'none' }}
              />
            </label>
            {backgroundImageUrl && (
              <button 
                className="btn-remove"
                onClick={() => {
                  setBackgroundImageUrl(null)
                  setBackgroundImage(null)
                }}
              >
                <X size={16} />
                Remove Background
              </button>
            )}
          </div>

          <div className="panel-section">
            <h3>Add Elements</h3>
            <div className="element-buttons">
              <button
                className={`element-btn ${activeElementType === 'text' ? 'active' : ''}`}
                onClick={() => {
                  setActiveElementType('text')
                  setActiveField('studentName')
                }}
              >
                <Type size={18} />
                Add Text
              </button>
              <button
                className={`element-btn ${activeElementType === 'signature' ? 'active' : ''}`}
                onClick={() => setActiveElementType('signature')}
              >
                <PenTool size={18} />
                Add Signature
              </button>
              <button
                className={`element-btn ${activeElementType === 'qrcode' ? 'active' : ''}`}
                onClick={() => setActiveElementType('qrcode')}
              >
                <QrCode size={18} />
                Add QR Code
              </button>
            </div>
            {activeElementType === 'text' && (
              <div className="field-selector">
                <label>Select Field:</label>
                <select
                  value={activeField || ''}
                  onChange={(e) => setActiveField(e.target.value)}
                >
                  <option value="">Select field...</option>
                  {fieldOptions.map(field => (
                    <option key={field.key} value={field.key}>
                      {field.label} {field.required ? '*' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {activeElementType && (
              <p className="hint">Click on the preview to place {activeElementType === 'text' ? 'text' : activeElementType === 'signature' ? 'signature' : 'QR code'}</p>
            )}
          </div>

          <div className="panel-section">
            <h3>Elements ({elements.length})</h3>
            <div className="elements-list">
              {elements.length === 0 ? (
                <p className="empty-hint">No elements added yet</p>
              ) : (
                elements.map(element => (
                  <div
                    key={element.id}
                    className={`element-item ${selectedElement === element.id ? 'selected' : ''}`}
                    onClick={() => setSelectedElement(element.id)}
                  >
                    <div className="element-info">
                      <strong>
                        {element.type === 'text' 
                          ? fieldOptions.find(f => f.key === element.field)?.label || element.field
                          : 'Signature'}
                      </strong>
                      <span className="element-position">
                        ({Math.round(element.x)}, {Math.round(element.y)})
                      </span>
                    </div>
                    <button
                      className="btn-delete-small"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleElementDelete(element.id)
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Center Panel - Preview */}
        <div className="editor-center-panel">
          <div className="preview-controls">
            <div className="preview-mode-toggle">
              <button
                className={`mode-btn ${previewMode === 'edit' ? 'active' : ''}`}
                onClick={() => setPreviewMode('edit')}
              >
                Edit Mode
              </button>
              <button
                className={`mode-btn ${previewMode === 'final' ? 'active' : ''}`}
                onClick={() => setPreviewMode('final')}
              >
                Final Preview
              </button>
            </div>
            <>
              <label>Zoom:</label>
              <input
                type="range"
                min="0.3"
                max="1.5"
                step="0.1"
                value={previewScale}
                onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
              />
              <span>{Math.round(previewScale * 100)}%</span>
            </>
          </div>
          <div 
            className="preview-container"
            ref={containerRef}
            onClick={previewMode === 'edit' ? handleCanvasClick : undefined}
            style={{ cursor: previewMode === 'edit' && activeElementType ? 'crosshair' : 'default' }}
          >
            {previewMode === 'edit' ? (
              backgroundImageUrl ? (
                <div 
                  className="certificate-preview"
                  style={{
                    position: 'relative',
                    display: 'inline-block'
                  }}
                >
                  <img
                    ref={imageRef}
                    src={backgroundImageUrl}
                    alt="Certificate template"
                    style={{
                      maxWidth: '1400px',
                      maxHeight: '100%',
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
                    {elements.map(element => (
                      <ElementPreview
                        key={element.id}
                        element={element}
                        isSelected={selectedElement === element.id}
                        onSelect={() => setSelectedElement(element.id)}
                        onDrag={handleElementDrag}
                        scale={1}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="preview-placeholder">
                  <Upload size={48} />
                  <p>Upload a background image to get started</p>
                </div>
              )
            ) : (
              backgroundImageUrl && elements.length > 0 ? (
                <div className="html-preview-wrapper">
                  <HTMLCertificatePreview
                    backgroundImageUrl={backgroundImageUrl}
                    elements={elements}
                    scale={previewScale}
                    imageWidth={imageDimensions.width}
                    imageHeight={imageDimensions.height}
                  />
                  <p className="html-preview-note">This is exactly how the certificate will look when generated</p>
                </div>
              ) : (
                <div className="preview-placeholder">
                  <p>Upload background and add elements to see preview</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Right Panel - Properties */}
        {selectedElementData && (
          <div className="editor-right-panel">
            <div className="properties-header">
              <h3>Element Properties</h3>
            </div>
            <div className="properties-content">
              <ElementProperties
                element={selectedElementData}
                onUpdate={(updates) => handleElementUpdate(selectedElement, updates)}
                availableFonts={availableFonts}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ElementPreview({ element, isSelected, onSelect, onDrag, scale }) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const elementRef = useRef(null)
  const previewRef = useRef(null)

  const handleMouseDown = (e) => {
    e.stopPropagation()
    e.preventDefault()
    onSelect()
    
    const previewElement = e.currentTarget.closest('.certificate-preview')
    if (!previewElement) return
    
    const previewRect = previewElement.getBoundingClientRect()
    const elementRect = e.currentTarget.getBoundingClientRect()
    
    // Calculate the element's position relative to the preview (not scaled)
    const elementCenterX = element.x
    const elementCenterY = element.y
    
    // Calculate mouse position relative to preview (scaled)
    const mouseX = (e.clientX - previewRect.left) / scale
    const mouseY = (e.clientY - previewRect.top) / scale
    
    // Calculate offset from element center to mouse
    setDragOffset({
      x: mouseX - elementCenterX,
      y: mouseY - elementCenterY
    })
    
    setDragStart({ x: e.clientX, y: e.clientY })
    setIsDragging(true)
    previewRef.current = previewElement
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && previewRef.current) {
        const previewRect = previewRef.current.getBoundingClientRect()
        // Calculate mouse position relative to preview (scaled)
        const mouseX = (e.clientX - previewRect.left) / scale
        const mouseY = (e.clientY - previewRect.top) / scale
        
        // Calculate new element position
        const newX = mouseX - dragOffset.x
        const newY = mouseY - dragOffset.y
        
        onDrag(element.id, newX, newY)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      previewRef.current = null
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset, scale, element.id, onDrag])

  if (element.type === 'text') {
    const sampleText = getSampleText(element.field, element.customText)
    const fontFamily = element.fontFamily || 'Amsterdam Four_ttf 400'
    // For web fonts, don't wrap in quotes
    const fontFamilyValue = ['Montserrat', 'Poppins', 'Open Sans'].includes(fontFamily) 
      ? fontFamily 
      : `"${fontFamily}"`
    return (
      <div
        ref={elementRef}
        className={`element-preview text-element ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
        style={{
          position: 'absolute',
          left: `${element.x}px`,
          top: `${element.y}px`,
          fontSize: `${element.fontSize}px`,
          fontWeight: element.fontWeight,
          fontFamily: `${fontFamilyValue}, Arial, sans-serif`,
          color: element.color,
          textAlign: element.align || 'center',
          cursor: 'move',
          padding: '4px 8px',
          border: isSelected ? '2px dashed var(--admin-accent)' : '2px solid transparent',
          transform: `translate(-50%, -50%)`,
          whiteSpace: 'nowrap',
          backgroundColor: isDragging ? 'rgba(247, 147, 26, 0.2)' : 'transparent',
          opacity: isDragging ? 0.9 : 1,
          zIndex: isDragging ? 100 : (isSelected ? 20 : 10),
          transition: isDragging ? 'none' : 'all 0.1s ease'
        }}
        onMouseDown={handleMouseDown}
      >
        {sampleText}
      </div>
    )
  } else if (element.type === 'signature') {
    // Get signature data - check signatureData first, then load by signatureId
    let signatureData = element.signatureData
    if (!signatureData && element.signatureId) {
      const signature = getSignatureById(element.signatureId)
      if (signature && signature.signatureData) {
        signatureData = signature.signatureData
      }
    }
    
    return (
      <div
        ref={elementRef}
        className={`element-preview signature-element ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
        style={{
          position: 'absolute',
          left: `${element.x}px`,
          top: `${element.y}px`,
          width: `${element.width || 200}px`,
          height: `${element.height || 80}px`,
          border: isSelected ? '2px dashed var(--admin-accent)' : '2px dashed #ccc',
          cursor: 'move',
          transform: `translate(-50%, -50%)`,
          backgroundColor: isDragging ? 'rgba(247, 147, 26, 0.3)' : (signatureData ? 'transparent' : 'rgba(255, 255, 255, 0.5)'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#666',
          zIndex: isDragging ? 100 : (isSelected ? 20 : 10),
          transition: isDragging ? 'none' : 'all 0.1s ease',
          overflow: 'hidden'
        }}
        onMouseDown={handleMouseDown}
      >
        {signatureData ? (
          <img 
            src={signatureData} 
            alt="Signature" 
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              pointerEvents: 'none'
            }}
          />
        ) : (
          <span>Signature Placeholder</span>
        )}
      </div>
    )
  } else if (element.type === 'qrcode') {
    return (
      <div
        ref={elementRef}
        className={`element-preview qrcode-element ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
        style={{
          position: 'absolute',
          left: `${element.x}px`,
          top: `${element.y}px`,
          width: `${element.size || 70}px`,
          height: `${element.size || 70}px`,
          border: isSelected ? '2px dashed var(--admin-accent)' : '2px dashed #ccc',
          cursor: 'move',
          transform: `translate(-50%, -50%)`,
          backgroundColor: isDragging ? 'rgba(247, 147, 26, 0.3)' : 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          color: '#666',
          zIndex: isDragging ? 100 : (isSelected ? 20 : 10),
          transition: isDragging ? 'none' : 'all 0.1s ease',
          overflow: 'hidden'
        }}
        onMouseDown={handleMouseDown}
      >
        <QrCode size={element.size ? element.size * 0.6 : 42} style={{ opacity: 0.6 }} />
      </div>
    )
  }
  return null
}

function getSampleText(field, customText) {
  if (field === 'custom' && customText) {
    return customText
  }
  const samples = {
    studentName: 'John Doe',
    courseType: 'Bitcoin & Blockchain Fundamentals',
    cohort: 'Cohort 2025-01',
    certificateType: 'Certificate of Completion',
    issueDate: 'January 15, 2025',
    signerName: 'Lead Instructor',
    signerTitle: 'Course Director',
    custom: customText || 'Custom Text'
  }
  return samples[field] || 'Sample Text'
}

function HTMLCertificatePreview({ backgroundImageUrl, elements, imageWidth = 1200, imageHeight = 800, scale = 1.0 }) {
  const sampleData = {
    studentName: 'John Doe',
    courseType: 'Bitcoin & Blockchain Fundamentals',
    cohort: 'Cohort 2025-01',
    certificateType: 'Certificate of Completion',
    issueDate: 'January 15, 2025',
    instructor: 'Lead Instructor',
    signerTitle: 'Course Director'
  }

  const getTextForField = (field) => {
    return sampleData[field] || getSampleText(field)
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

  return (
    <div 
      className="html-certificate-preview"
      style={{
        position: 'relative',
        display: 'inline-block'
      }}
    >
      <img
        src={backgroundImageUrl}
        alt="Certificate template"
        style={{
          maxWidth: '1400px',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto',
          display: 'block',
          objectFit: 'contain',
          transform: `scale(${scale})`,
          transformOrigin: 'top left'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          pointerEvents: 'none',
          transform: `scale(${scale})`,
          transformOrigin: 'top left'
        }}
      >
      {elements.map(element => {
        if (element.type === 'text') {
          let text = element.field === 'custom' && element.customText 
            ? element.customText 
            : getTextForField(element.field)
          if (element.field === 'issueDate') {
            text = formatDate(sampleData.issueDate)
          }
          
          const textAlign = element.align || 'center'
          const fontFamily = element.fontFamily || 'Amsterdam Four_ttf 400'
          // For web fonts, don't wrap in quotes
          const fontFamilyValue = ['Montserrat', 'Poppins', 'Open Sans'].includes(fontFamily) 
            ? fontFamily 
            : `"${fontFamily}"`
          
          let left = element.x
          if (textAlign === 'center') {
            // Center alignment - x is the center point
          } else if (textAlign === 'right') {
            // Right alignment - x is the right edge
          }
          // Left alignment - x is the left edge

          return (
            <div
              key={element.id}
              className="html-preview-text"
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
                lineHeight: 1.2
              }}
            >
              {text}
            </div>
          )
        } else if (element.type === 'signature') {
          // Get signature data - check signatureData first, then load by signatureId
          let signatureData = element.signatureData
          if (!signatureData && element.signatureId) {
            const signature = getSignatureById(element.signatureId)
            if (signature && signature.signatureData) {
              signatureData = signature.signatureData
            }
          }
          
          return (
            <div
              key={element.id}
              className="html-preview-text"
              style={{
                position: 'absolute',
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: `${element.width || 200}px`,
                height: `${element.height || 80}px`,
                border: signatureData ? 'none' : '1px dashed #ccc',
                transform: 'translate(-50%, -50%)',
                backgroundColor: signatureData ? 'transparent' : 'rgba(255, 255, 255, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#666',
                fontFamily: 'Arial, sans-serif',
                overflow: 'hidden'
              }}
            >
              {signatureData ? (
                <img 
                  src={signatureData} 
                  alt="Signature" 
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    pointerEvents: 'none'
                  }}
                />
              ) : (
                <span>Signature Placeholder</span>
              )}
            </div>
          )
        } else if (element.type === 'qrcode') {
          // Generate a sample QR code for preview
          return (
            <div
              key={element.id}
              className="html-preview-text"
              style={{
                position: 'absolute',
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: `${element.size || 70}px`,
                height: `${element.size || 70}px`,
                border: '1px dashed #ccc',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#666',
                fontFamily: 'Arial, sans-serif',
                overflow: 'hidden'
              }}
            >
              <QrCode size={element.size ? element.size * 0.6 : 42} style={{ opacity: 0.6 }} />
            </div>
          )
        }
        return null
      })}
      </div>
    </div>
  )
}

function ElementProperties({ element, onUpdate, availableFonts = [] }) {
  const [signatureSearch, setSignatureSearch] = useState('')
  const [showSignatureDropdown, setShowSignatureDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const signatures = getStoredSignatures()
  
  const filteredSignatures = signatures.filter(sig => {
    if (!signatureSearch) return true
    const searchLower = signatureSearch.toLowerCase()
    return (
      sig.signerName?.toLowerCase().includes(searchLower) ||
      new Date(sig.signedAt).toLocaleDateString().toLowerCase().includes(searchLower)
    )
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSignatureDropdown(false)
      }
    }

    if (showSignatureDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showSignatureDropdown])

  if (element.type === 'text') {
    return (
      <div className="element-properties">
        {element.field === 'custom' && (
          <div className="prop-group">
            <label>Custom Text</label>
            <input
              type="text"
              value={element.customText || 'Custom Text'}
              onChange={(e) => onUpdate({ customText: e.target.value || 'Custom Text' })}
              placeholder="Enter custom text..."
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
        )}
        <div className="prop-group">
          <label>Font Family</label>
          <select
            value={element.fontFamily || 'Amsterdam Four_ttf 400'}
            onChange={(e) => onUpdate({ fontFamily: e.target.value })}
          >
            {availableFonts.map(font => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </div>
        <div className="prop-group">
          <label>Font Size</label>
          <input
            type="number"
            value={element.fontSize}
            onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) || 12 })}
            min="8"
            max="200"
          />
        </div>
        <div className="prop-group">
          <label>Font Weight</label>
          <select
            value={element.fontWeight || 'normal'}
            onChange={(e) => onUpdate({ fontWeight: e.target.value })}
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
          </select>
        </div>
        <div className="prop-group">
          <label>Color</label>
          <input
            type="color"
            value={element.color || '#000000'}
            onChange={(e) => onUpdate({ color: e.target.value })}
          />
        </div>
        <div className="prop-group">
          <label>Alignment</label>
          <select
            value={element.align || 'center'}
            onChange={(e) => onUpdate({ align: e.target.value })}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
    )
  } else if (element.type === 'signature') {
    const selectedSignature = signatures.find(sig => sig.id === element.signatureId)
    
    return (
      <div className="element-properties">
        <div className="prop-group">
          <label>Select Signature</label>
          <div className="signature-select-wrapper" ref={dropdownRef}>
            <div 
              className="signature-select-input"
              onClick={() => setShowSignatureDropdown(!showSignatureDropdown)}
            >
              <Search size={16} />
              <input
                type="text"
                placeholder="Search signatures..."
                value={signatureSearch}
                onChange={(e) => {
                  setSignatureSearch(e.target.value)
                  setShowSignatureDropdown(true)
                }}
                onFocus={() => setShowSignatureDropdown(true)}
              />
            </div>
            {showSignatureDropdown && (
              <div className="signature-dropdown">
                {filteredSignatures.length === 0 ? (
                  <div className="signature-dropdown-item empty">
                    No signatures found
                  </div>
                ) : (
                  filteredSignatures.map(sig => (
                    <div
                      key={sig.id}
                      className={`signature-dropdown-item ${element.signatureId === sig.id ? 'selected' : ''}`}
                      onClick={() => {
                        onUpdate({ 
                          signatureId: sig.id,
                          signatureData: sig.signatureData
                        })
                        setShowSignatureDropdown(false)
                        setSignatureSearch('')
                      }}
                    >
                      <div className="signature-item-name">{sig.signerName || 'Unknown'}</div>
                      <div className="signature-item-date">
                        {new Date(sig.signedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {selectedSignature && (
            <div className="selected-signature-info">
              Selected: {selectedSignature.signerName} ({new Date(selectedSignature.signedAt).toLocaleDateString()})
            </div>
          )}
        </div>
        {element.signatureId && (
          <>
            <div className="prop-group">
              <label>Width</label>
              <input
                type="number"
                value={element.width || 200}
                onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 200 })}
                min="50"
                max="500"
              />
            </div>
            <div className="prop-group">
              <label>Height</label>
              <input
                type="number"
                value={element.height || 80}
                onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 80 })}
                min="30"
                max="300"
              />
            </div>
          </>
        )}
      </div>
    )
  } else if (element.type === 'qrcode') {
    return (
      <div className="element-properties">
        <div className="prop-group">
          <label>QR Code Size</label>
          <input
            type="number"
            value={element.size || 70}
            onChange={(e) => onUpdate({ size: parseInt(e.target.value) || 70 })}
            min="30"
            max="200"
          />
        </div>
        <div className="prop-group">
          <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
            The QR code will link to the certificate verification page.
          </p>
        </div>
      </div>
    )
  }
  return null
}

export default TemplateEditorPage

