import { useState, useEffect, useRef } from 'react'
import { 
  getAllTemplates, 
  loadTemplate,
  getTemplate,
  createTemplateFromBase 
} from '../utils/templateUtils'
import { 
  saveCustomTemplate,
  validateTemplate 
} from '../utils/templateStorage'
import { loadFont, parseFontFromFilename } from '../utils/fontUtils'
import { getStoredSignatures } from '../utils/signatureUtils'
import TemplateCanvas from './TemplateCanvas'
import ElementList from './ElementList'
import ElementProperties from './ElementProperties'
import { X, ArrowLeft, ArrowRight, Save, Upload, Type, PenTool, Undo2, Redo2 } from 'lucide-react'
import './TemplateEditor.css'

function TemplateEditor({ template, onClose }) {
  const [step, setStep] = useState(1)
  const [baseTemplateId, setBaseTemplateId] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [templateImageUrl, setTemplateImageUrl] = useState(null)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [templateType, setTemplateType] = useState('png')
  const [fontName, setFontName] = useState(null)
  
  // Elements management
  const [elements, setElements] = useState([])
  const [selectedElementId, setSelectedElementId] = useState(null)
  const [activeElementType, setActiveElementType] = useState(null) // 'text' or 'signature'
  const [activeField, setActiveField] = useState(null) // For text elements
  
  // Undo/redo
  const [history, setHistory] = useState([[]])
  const [historyIndex, setHistoryIndex] = useState(0)
  
  const availableTemplates = getAllTemplates().filter(t => t.isBuiltIn)
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

  // Initialize from existing template
  useEffect(() => {
    if (template) {
      setTemplateName(template.name || '')
      setTemplateDescription(template.description || '')
      setTemplateType(template.type || 'png')
      setFontName(template.fontName || null)
      
      // Convert legacy textPositions to elements array
      if (template.elements && template.elements.length > 0) {
        setElements(template.elements)
        setHistory([template.elements])
        setHistoryIndex(0)
      } else if (template.textPositions) {
        // Migrate from old format
        const migratedElements = Object.keys(template.textPositions).map((field, index) => ({
          id: `element-${Date.now()}-${index}`,
          type: 'text',
          field: field,
          ...template.textPositions[field]
        }))
        setElements(migratedElements)
        setHistory([migratedElements])
        setHistoryIndex(0)
      } else {
        setElements([])
        setHistory([[]])
        setHistoryIndex(0)
      }
      
      // Load template image
      if (template.templateContent) {
        setTemplateImageUrl(template.templateContent)
        setStep(2)
      } else if (template.baseTemplateId) {
        setBaseTemplateId(template.baseTemplateId)
        setStep(2)
        loadTemplatePreview(template.baseTemplateId)
      } else if (template.filename) {
        loadTemplateFromFilename(template.filename)
      } else {
        // If no template content, start at step 1
        setStep(1)
      }
    } else {
      // Reset for new template
      setTemplateName('')
      setTemplateDescription('')
      setTemplateType('png')
      setFontName(null)
      setElements([])
      setHistory([[]])
      setHistoryIndex(0)
      setBaseTemplateId(null)
      setUploadedFile(null)
      setTemplateImageUrl(null)
      setStep(1)
    }
  }, [template])

  // Save to history for undo/redo
  const saveToHistory = (newElements) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push([...newElements])
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const loadTemplatePreview = async (templateId) => {
    try {
      const templateData = getTemplate(templateId)
      const imageUrl = await loadTemplate(templateId)
      setTemplateImageUrl(imageUrl)
      setTemplateType(templateData.type || 'png')
      
      // Detect and load font
      if (templateData.fontName) {
        setFontName(templateData.fontName)
        try {
          await loadFont(templateData.fontName)
        } catch (err) {
          console.warn('Failed to load font:', err)
        }
      } else if (templateData.filename) {
        const detectedFont = parseFontFromFilename(templateData.filename)
        if (detectedFont) {
          setFontName(detectedFont)
          try {
            await loadFont(detectedFont)
          } catch (err) {
            console.warn('Failed to load font:', err)
          }
        }
      }
    } catch (error) {
      console.error('Error loading template:', error)
      alert('Failed to load template preview')
    }
  }

  const loadTemplateFromFilename = async (filename) => {
    try {
      const response = await fetch(`/templates/${filename}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setTemplateImageUrl(url)
        setStep(2)
        
        // Detect font from filename
        const detectedFont = parseFontFromFilename(filename)
        if (detectedFont) {
          setFontName(detectedFont)
          try {
            await loadFont(detectedFont)
          } catch (err) {
            console.warn('Failed to load font:', err)
          }
        }
      }
    } catch (error) {
      console.error('Error loading template from filename:', error)
    }
  }

  const handleBaseTemplateSelect = (templateId) => {
    setBaseTemplateId(templateId)
    loadTemplatePreview(templateId)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.type === 'image/png' || file.name.endsWith('.png')) {
      setTemplateType('png')
      const reader = new FileReader()
      reader.onload = (event) => {
        const url = event.target.result
        setTemplateImageUrl(url)
        setUploadedFile(file)
        setStep(2)
        
        // Detect font from filename
        const detectedFont = parseFontFromFilename(file.name)
        if (detectedFont) {
          setFontName(detectedFont)
          loadFont(detectedFont).catch(err => console.warn('Failed to load font:', err))
        }
      }
      reader.readAsDataURL(file)
    } else {
      alert('Please upload a PNG file')
    }
  }

  // Handle canvas click to add element
  const handleCanvasClick = (x, y) => {
    if (!activeElementType) return

    if (activeElementType === 'text' && activeField) {
      // Add text element
      const newElement = {
        id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'text',
        field: activeField,
        x: x,
        y: y,
        fontSize: 24,
        fontFamily: fontName || 'Arial',
        fontWeight: 'normal',
        color: '#000000'
      }
      const newElements = [...elements, newElement]
      setElements(newElements)
      setSelectedElementId(newElement.id)
      saveToHistory(newElements)
      setActiveElementType(null)
      setActiveField(null)
    } else if (activeElementType === 'signature') {
      // Add signature element
      const signatures = getStoredSignatures()
      if (signatures.length === 0) {
        alert('No signatures available. Please create a signature first.')
        setActiveElementType(null)
        return
      }
      
      const newElement = {
        id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'signature',
        x: x,
        y: y,
        width: 200,
        height: 80,
        signatureId: signatures[0].id,
        signatureData: signatures[0].signatureData
      }
      const newElements = [...elements, newElement]
      setElements(newElements)
      setSelectedElementId(newElement.id)
      saveToHistory(newElements)
      setActiveElementType(null)
    }
  }

  // Handle element selection
  const handleElementSelect = (elementId) => {
    setSelectedElementId(elementId)
  }

  // Handle element update
  const handleElementUpdate = (elementId, updates) => {
    const newElements = elements.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    )
    setElements(newElements)
    saveToHistory(newElements)
    
    // Update signature data if signatureId changed
    if (updates.signatureId) {
      const signatures = getStoredSignatures()
      const signature = signatures.find(s => s.id === updates.signatureId)
      if (signature) {
        const updatedElements = newElements.map(el =>
          el.id === elementId ? { ...el, signatureData: signature.signatureData } : el
        )
        setElements(updatedElements)
      }
    }
  }

  // Handle element deletion
  const handleElementDelete = (elementId) => {
    if (window.confirm('Are you sure you want to delete this element?')) {
      const newElements = elements.filter(el => el.id !== elementId)
      setElements(newElements)
      saveToHistory(newElements)
      if (selectedElementId === elementId) {
        setSelectedElementId(null)
      }
    }
  }

  // Handle element drag
  const handleElementDrag = (elementId, x, y) => {
    const newElements = elements.map(el =>
      el.id === elementId ? { ...el, x, y } : el
    )
    setElements(newElements)
  }

  // Handle element drop
  const handleElementDrop = (elementId) => {
    // Save to history when drag ends
    saveToHistory(elements)
  }

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setElements([...history[newIndex]])
      setSelectedElementId(null)
    }
  }

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setElements([...history[newIndex]])
      setSelectedElementId(null)
    }
  }

  const handleNext = () => {
    if (step === 1) {
      if (!baseTemplateId && !uploadedFile && !templateImageUrl) {
        alert('Please select a base template or upload a file')
        return
      }
      if (!templateImageUrl) {
        alert('Please wait for template to load')
        return
      }
      setStep(2)
    } else if (step === 2) {
      // Validate required fields
      const requiredFields = fieldOptions.filter(f => f.required)
      const hasRequiredFields = requiredFields.some(f => 
        elements.some(el => el.type === 'text' && el.field === f.key)
      )
      if (!hasRequiredFields) {
        alert(`Please add at least one required field: ${requiredFields.map(f => f.label).join(', ')}`)
        return
      }
      setStep(3)
    } else if (step === 3) {
      if (!templateName.trim()) {
        alert('Please enter a template name')
        return
      }
      handleSave()
    }
  }

  const handleSave = () => {
    try {
      // Convert elements to textPositions for backward compatibility
      const textPositions = {}
      elements.forEach(element => {
        if (element.type === 'text') {
          textPositions[element.field] = {
            x: element.x,
            y: element.y,
            fontSize: element.fontSize,
            fontWeight: element.fontWeight,
            fontFamily: element.fontFamily,
            fill: element.color
          }
        }
      })

      const newTemplate = {
        id: template?.id || undefined,
        name: templateName.trim(),
        description: templateDescription.trim(),
        type: templateType,
        filename: uploadedFile?.name || (baseTemplateId ? getTemplate(baseTemplateId)?.filename : null) || template?.filename,
        fontName: fontName,
        elements: elements,
        textPositions: textPositions, // For backward compatibility
        baseTemplateId: baseTemplateId || template?.baseTemplateId,
        templateContent: templateImageUrl || template?.templateContent
      }

      const validation = validateTemplate(newTemplate)
      if (!validation.isValid) {
        alert(`Template validation failed:\n${validation.errors.join('\n')}`)
        return
      }

      saveCustomTemplate(newTemplate)
      alert('Template saved successfully!')
      onClose(true)
    } catch (error) {
      console.error('Error saving template:', error)
      alert(`Error saving template: ${error.message}`)
    }
  }

  const selectedElement = elements.find(el => el.id === selectedElementId)

  return (
    <div className="template-editor-overlay" onClick={(e) => {
      if (e.target.classList.contains('template-editor-overlay')) {
        onClose(false)
      }
    }}>
      <div className="template-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-editor-header">
          <h2>{template ? 'Edit Template' : 'Create New Template'}</h2>
          <button className="close-btn" onClick={() => onClose(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="template-editor-steps">
          <div className={`step-indicator ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Select Base</span>
          </div>
          <div className={`step-indicator ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Edit Elements</span>
          </div>
          <div className={`step-indicator ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Metadata</span>
          </div>
        </div>

        <div className="template-editor-content">
          {/* Step 1: Select Base Template or Upload */}
          {step === 1 && (
            <div className="editor-step">
              <h3>Select Base Template or Upload Custom</h3>
              <div className="base-template-selector">
                <div className="template-options">
                  <h4>Start from Built-in Template</h4>
                  <div className="template-list">
                    {availableTemplates.map(t => (
                      <button
                        key={t.id}
                        className={`template-option ${baseTemplateId === t.id ? 'selected' : ''}`}
                        onClick={() => handleBaseTemplateSelect(t.id)}
                      >
                        <div className="template-option-name">{t.name}</div>
                        <div className="template-option-desc">{t.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="divider">OR</div>
                <div className="upload-section">
                  <h4>Upload Custom Template</h4>
                  <label className="upload-area">
                    <Upload size={32} />
                    <span>Click to upload PNG template</span>
                    <input
                      type="file"
                      accept=".png"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {uploadedFile && (
                    <div className="uploaded-file">
                      <span>✓ {uploadedFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Visual Editor */}
          {step === 2 && templateImageUrl && (
            <div className="editor-step visual-editor">
              <div className="editor-toolbar">
                <div className="toolbar-section">
                  <h4>Add Elements</h4>
                  <div className="toolbar-buttons">
                    <button
                      className={`toolbar-btn ${activeElementType === 'text' ? 'active' : ''}`}
                      onClick={() => {
                        setActiveElementType('text')
                        setActiveField('studentName')
                      }}
                    >
                      <Type size={18} />
                      Text
                    </button>
                    <button
                      className={`toolbar-btn ${activeElementType === 'signature' ? 'active' : ''}`}
                      onClick={() => setActiveElementType('signature')}
                    >
                      <PenTool size={18} />
                      Signature
                    </button>
                  </div>
                </div>
                
                {activeElementType === 'text' && (
                  <div className="toolbar-section">
                    <h4>Text Field</h4>
                    <select
                      value={activeField || ''}
                      onChange={(e) => setActiveField(e.target.value)}
                      className="field-select"
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

                <div className="toolbar-section">
                  <div className="toolbar-buttons">
                    <button
                      className="toolbar-btn"
                      onClick={handleUndo}
                      disabled={historyIndex === 0}
                      title="Undo (Ctrl+Z)"
                    >
                      <Undo2 size={18} />
                    </button>
                    <button
                      className="toolbar-btn"
                      onClick={handleRedo}
                      disabled={historyIndex === history.length - 1}
                      title="Redo (Ctrl+Y)"
                    >
                      <Redo2 size={18} />
                    </button>
                  </div>
                </div>

                {activeElementType && (
                  <div className="toolbar-hint">
                    Click on the canvas to place {activeElementType === 'text' ? 'text' : 'signature'}
                  </div>
                )}
              </div>

              <div className="editor-workspace">
                <div className="workspace-left">
                  <ElementList
                    elements={elements}
                    selectedElementId={selectedElementId}
                    onElementSelect={handleElementSelect}
                    onElementDelete={handleElementDelete}
                  />
                </div>
                <div className="workspace-center">
                  <TemplateCanvas
                    templateImageUrl={templateImageUrl}
                    elements={elements}
                    selectedElementId={selectedElementId}
                    onElementClick={handleElementSelect}
                    onElementDrag={handleElementDrag}
                    onElementDrop={handleElementDrop}
                    onCanvasClick={handleCanvasClick}
                    scale={0.7}
                    templateWidth={1200}
                    templateHeight={800}
                  />
                </div>
                <div className="workspace-right">
                  <ElementProperties
                    element={selectedElement}
                    onUpdate={handleElementUpdate}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Metadata */}
          {step === 3 && (
            <div className="editor-step">
              <h3>Template Information</h3>
              <div className="metadata-form">
                <div className="form-group">
                  <label>Template Name *</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Custom Achievement Certificate"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Describe this template..."
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="template-editor-footer">
          <button className="btn-secondary" onClick={() => step > 1 ? setStep(step - 1) : onClose(false)}>
            <ArrowLeft size={18} />
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          {step < 3 ? (
            <button className="btn-primary" onClick={handleNext}>
              Next
              <ArrowRight size={18} />
            </button>
          ) : (
            <button className="btn-primary" onClick={handleSave}>
              <Save size={18} />
              Save Template
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TemplateEditor
