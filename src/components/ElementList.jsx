import { Trash2, Edit } from 'lucide-react'
import './ElementList.css'

function ElementList({ elements, selectedElementId, onElementSelect, onElementDelete }) {
  const getElementLabel = (element) => {
    if (element.type === 'text') {
      const fieldLabels = {
        studentName: 'Student Name',
        courseType: 'Course Type',
        cohort: 'Cohort',
        certificateType: 'Certificate Type',
        issueDate: 'Issue Date',
        signerName: 'Signer Name',
        signerTitle: 'Signer Title',
        custom: 'Custom Text'
      }
      return fieldLabels[element.field] || element.field || 'Text Element'
    } else if (element.type === 'signature') {
      return `Signature${element.signatureId ? ` (${element.signatureId.substring(0, 8)}...)` : ''}`
    }
    return 'Element'
  }

  const getElementIcon = (element) => {
    if (element.type === 'text') {
      return 'T'
    } else if (element.type === 'signature') {
      return '✍'
    }
    return '•'
  }

  return (
    <div className="element-list">
      <div className="element-list-header">
        <h3>Elements ({elements.length})</h3>
      </div>
      <div className="element-list-content">
        {elements.length === 0 ? (
          <div className="element-list-empty">
            <p>No elements added yet</p>
            <p className="hint">Click on the canvas to add elements</p>
          </div>
        ) : (
          <div className="element-items">
            {elements.map(element => (
              <div
                key={element.id}
                className={`element-item ${selectedElementId === element.id ? 'selected' : ''}`}
                onClick={() => onElementSelect && onElementSelect(element.id)}
              >
                <div className="element-item-icon">
                  {getElementIcon(element)}
                </div>
                <div className="element-item-info">
                  <div className="element-item-label">
                    {getElementLabel(element)}
                  </div>
                  <div className="element-item-position">
                    X: {Math.round(element.x)}, Y: {Math.round(element.y)}
                  </div>
                </div>
                <div className="element-item-actions">
                  <button
                    className="element-action-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      onElementDelete && onElementDelete(element.id)
                    }}
                    title="Delete element"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ElementList

