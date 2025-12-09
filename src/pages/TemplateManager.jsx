import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  getAllTemplates, 
  getTemplate,
  createTemplateFromBase
} from '../utils/templateUtils'
import {
  deleteCustomTemplate,
  duplicateCustomTemplate,
  importCustomTemplates,
  clearAllCustomTemplates,
  cleanupTemplates
} from '../utils/templateStorage'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Link } from 'react-router-dom'
import './TemplateManager.css'

function TemplateManager() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importText, setImportText] = useState('')
  const [importResult, setImportResult] = useState(null)
  const [templateToDelete, setTemplateToDelete] = useState(null)

  useEffect(() => {
    // Clean up existing templates on load to remove textPositions where elements exist
    cleanupTemplates()
    loadTemplates()
  }, [])

  const loadTemplates = () => {
    const allTemplates = getAllTemplates()
    // Log templates for debugging
    console.log('Loaded templates:', allTemplates.length, 'total')
    allTemplates.forEach(t => {
      if (!t.isBuiltIn && !t.id) {
        console.warn('Custom template missing ID:', t.name, t)
      }
    })
    setTemplates(allTemplates)
  }

  const handleCreateNew = () => {
    navigate('/admin/templates/edit/new')
  }

  const handleEdit = (template) => {
    navigate(`/admin/templates/edit/${template.id}`)
  }

  const handleDelete = (template) => {
    if (template.isBuiltIn) {
      alert('Built-in templates cannot be deleted.')
      return
    }
    
    if (!template.id) {
      console.error('Template missing ID:', template)
      alert('Error: Template is missing an ID. Cannot delete.')
      return
    }
    
    console.log('Deleting template:', template.id, template.name)
    setTemplateToDelete(template)
  }

  const confirmDelete = () => {
    if (!templateToDelete) {
      console.error('No template selected for deletion')
      return
    }
    
    if (!templateToDelete.id) {
      console.error('Template missing ID:', templateToDelete)
      alert('Error: Template is missing an ID. Cannot delete.')
      setTemplateToDelete(null)
      return
    }
    
    try {
      console.log('Confirming deletion of template:', templateToDelete.id, templateToDelete.name)
      const success = deleteCustomTemplate(templateToDelete.id)
      
      if (success) {
        console.log('Template deleted successfully:', templateToDelete.id)
        loadTemplates()
        setTemplateToDelete(null)
        // Show success message
        alert(`Template "${templateToDelete.name}" has been deleted successfully.`)
      } else {
        console.warn('Delete returned false for template:', templateToDelete.id)
        alert(`Failed to delete template "${templateToDelete.name}". Template may not exist or has already been deleted.`)
        loadTemplates() // Reload to sync state
        setTemplateToDelete(null)
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      alert(`Error deleting template: ${error.message}`)
      setTemplateToDelete(null)
    }
  }

  const handleDuplicate = (template) => {
    try {
      if (template.isBuiltIn) {
        // Create a new custom template from built-in
        const newTemplate = createTemplateFromBase(template.id, {
          name: `${template.name} (Copy)`,
          description: `Copy of ${template.name}`
        })
        const { saveCustomTemplate } = require('../utils/templateStorage')
        saveCustomTemplate(newTemplate)
      } else {
        // Duplicate custom template
        duplicateCustomTemplate(template.id)
      }
      loadTemplates()
      alert('Template duplicated successfully')
    } catch (error) {
      alert(`Error duplicating template: ${error.message}`)
    }
  }


  const handleImport = () => {
    try {
      const result = importCustomTemplates(importText, false)
      setImportResult(result)
      if (result.success) {
        loadTemplates()
        setTimeout(() => {
          setShowImportDialog(false)
          setImportText('')
          setImportResult(null)
        }, 2000)
      }
    } catch (error) {
      setImportResult({
        success: false,
        errors: [error.message]
      })
    }
  }


  const builtInTemplates = templates.filter(t => t.isBuiltIn)
  const customTemplates = templates.filter(t => !t.isBuiltIn)

  return (
    <div className="template-manager">
      <div className="template-manager-header">
        <div>
          <h1>Template Manager</h1>
          <p className="subtitle">Create, edit, and manage certificate templates</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear ALL custom templates? This cannot be undone.')) {
                clearAllCustomTemplates()
                loadTemplates()
                alert('All custom templates have been cleared.')
              }
            }}
            title="Clear all custom templates"
          >
            <Trash2 size={18} />
            Clear All
          </button>
          <button 
            className="btn-secondary"
            onClick={() => setShowImportDialog(true)}
          >
            <Upload size={18} />
            Import Templates
          </button>
          <button 
            className="btn-primary"
            onClick={handleCreateNew}
          >
            <Plus size={18} />
            Create Template
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="template-info-section">
        <p className="template-info-text">
          To use your templates, go to{' '}
          <Link to="/admin/issue" className="template-info-link">Issue Certificate</Link>
          {' '}or{' '}
          <Link to="/admin/batch" className="template-info-link">Batch Processing</Link>
          {' '}where you can select from all available templates.
        </p>
      </div>

      {/* Built-in Templates Section */}
      {builtInTemplates.length > 0 && (
        <div className="templates-section">
          <h2>Built-in Templates</h2>
          <div className="templates-grid">
            {builtInTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Created Templates Section */}
      <div className="templates-section">
        <h2>Created Templates {customTemplates.length > 0 && `(${customTemplates.length})`}</h2>
        {customTemplates.length === 0 ? (
          <div className="empty-state">
            <Settings size={48} />
            <p>No created templates yet</p>
            <p className="hint">Create your first template to get started</p>
            <button className="btn-primary" onClick={handleCreateNew}>
              <Plus size={18} />
              Create Template
            </button>
          </div>
        ) : (
          <div className="templates-grid">
            {customTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>


      {/* Delete Confirmation Dialog */}
      {templateToDelete && (
        <div className="modal-overlay" onClick={() => setTemplateToDelete(null)}>
          <div className="modal-content destructive" onClick={(e) => e.stopPropagation()}>
            <h3>⚠ Warning: Destructive Action</h3>
            <p>
              You are about to <strong>DELETE</strong> the template:
            </p>
            <p className="modal-template-name">{templateToDelete.name}</p>
            <div className="warning-box">
              <p><strong>This action cannot be undone.</strong></p>
              <p>The template will be permanently removed from your system.</p>
              <p>Any certificates using this template will continue to work, but you won't be able to create new ones with this template.</p>
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => setTemplateToDelete(null)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="btn-delete-confirm"
              >
                Yes, Delete Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="modal-overlay" onClick={() => setShowImportDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Import Templates</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowImportDialog(false)
                  setImportText('')
                  setImportResult(null)
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Paste the JSON export from templates:</p>
              <textarea
                className="import-textarea"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste template JSON here..."
                rows={10}
              />
              {importResult && (
                <div className={`import-result ${importResult.success ? 'success' : 'error'}`}>
                  {importResult.success ? (
                    <>
                      <CheckCircle size={20} />
                      <span>Successfully imported {importResult.imported} of {importResult.total} templates</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={20} />
                      <div>
                        <p>Import failed:</p>
                        <ul>
                          {importResult.errors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowImportDialog(false)
                  setImportText('')
                  setImportResult(null)
                }}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleImport}
                disabled={!importText.trim()}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to get image path for template
function getTemplateImagePath(template) {
  // For built-in templates, use the filename from the template definition
  if (template.isBuiltIn && template.filename) {
    return `/templates/${template.filename}`
  }
  
  // For custom templates, check if they have a preview image
  if (!template.isBuiltIn && template.previewImage) {
    return template.previewImage
  }
  
  // Fallback: try to construct path from template ID for built-in templates
  const templateIdToFilename = {
    'achievement': 'Amsterdam Four_ttf 400Modern Achievement.png',
    'minimalist': 'Amsterdam Four_ttf 400_Minimalist Certificate.png',
    'brightwall-achievement': 'BrightWall_Achievement.png'
  }
  
  if (templateIdToFilename[template.id]) {
    return `/templates/${templateIdToFilename[template.id]}`
  }
  
  return null
}

function TemplateCard({ template, onEdit, onDelete }) {
  const navigate = useNavigate()
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const imagePath = getTemplateImagePath(template)

  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }
    
  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  const handleCardClick = () => {
    // Navigate to template editor to use this template as background
    navigate(`/admin/templates/edit/${template.id}`)
  }

  return (
    <div className="template-card clickable" onClick={handleCardClick}>
      {imageLoading && imagePath && (
        <div className="template-preview-loading">
          Loading preview...
        </div>
      )}
      {imageError || !imagePath ? (
        <div className="template-preview-error">
          Preview unavailable
        </div>
      ) : (
        <img
          src={imagePath}
          alt={template.name}
          className="template-preview-image"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: imageLoading ? 'none' : 'block' }}
        />
      )}
    </div>
  )
}

export default TemplateManager

