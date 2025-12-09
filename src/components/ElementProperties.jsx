import { getStoredSignatures } from '../utils/signatureUtils'
import { useState, useEffect } from 'react'
import './ElementProperties.css'

function ElementProperties({ element, onUpdate, availableSignatures = [], availableFonts = [] }) {
  const [signatures, setSignatures] = useState([])

  useEffect(() => {
    if (element?.type === 'signature') {
      const sigs = getStoredSignatures()
      setSignatures(sigs)
    }
  }, [element])

  if (!element) {
    return (
      <div className="element-properties">
        <div className="element-properties-empty">
          <p>Select an element to edit its properties</p>
        </div>
      </div>
    )
  }

  const handleChange = (property, value) => {
    if (onUpdate) {
      onUpdate(element.id, { [property]: value })
    }
  }

  const getElementTypeLabel = () => {
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
      return 'Signature'
    }
    return 'Element'
  }

  return (
    <div className="element-properties">
      <div className="element-properties-header">
        <h3>{getElementTypeLabel()}</h3>
      </div>
      <div className="element-properties-content">
        {/* Position */}
        <div className="property-group">
          <label>Position</label>
          <div className="property-row">
            <div className="property-field">
              <label>X:</label>
              <input
                type="number"
                value={Math.round(element.x)}
                onChange={(e) => handleChange('x', parseFloat(e.target.value) || 0)}
                step="1"
              />
            </div>
            <div className="property-field">
              <label>Y:</label>
              <input
                type="number"
                value={Math.round(element.y)}
                onChange={(e) => handleChange('y', parseFloat(e.target.value) || 0)}
                step="1"
              />
            </div>
          </div>
        </div>

        {/* Text-specific properties */}
        {element.type === 'text' && (
          <>
            <div className="property-group">
              <label>Font Size</label>
              <input
                type="number"
                value={element.fontSize || 24}
                onChange={(e) => handleChange('fontSize', parseFloat(e.target.value) || 24)}
                min="8"
                max="200"
                step="1"
              />
            </div>

            <div className="property-group">
              <label>Font Family</label>
              {availableFonts && availableFonts.length > 0 ? (
                <select
                  value={element.fontFamily || availableFonts[0].value}
                  onChange={(e) => handleChange('fontFamily', e.target.value)}
                >
                  {availableFonts.map(font => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={element.fontFamily || 'Arial'}
                  onChange={(e) => handleChange('fontFamily', e.target.value)}
                  placeholder="Font name"
                />
              )}
            </div>

            <div className="property-group">
              <label>Font Weight</label>
              <select
                value={element.fontWeight || 'normal'}
                onChange={(e) => handleChange('fontWeight', e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="300">Light</option>
                <option value="500">Medium</option>
                <option value="600">Semi-bold</option>
                <option value="700">Bold</option>
              </select>
            </div>

            <div className="property-group">
              <label>Color</label>
              <div className="property-row">
                <input
                  type="color"
                  value={element.color || '#000000'}
                  onChange={(e) => handleChange('color', e.target.value)}
                />
                <input
                  type="text"
                  value={element.color || '#000000'}
                  onChange={(e) => handleChange('color', e.target.value)}
                  placeholder="#000000"
                />
              </div>
            </div>

            {element.field === 'custom' && (
              <div className="property-group">
                <label>Custom Text</label>
                <input
                  type="text"
                  value={element.customText || ''}
                  onChange={(e) => handleChange('customText', e.target.value)}
                  placeholder="Enter custom text"
                />
              </div>
            )}
          </>
        )}

        {/* Signature-specific properties */}
        {element.type === 'signature' && (
          <>
            <div className="property-group">
              <label>Select Signature</label>
              <select
                value={element.signatureId || ''}
                onChange={(e) => handleChange('signatureId', e.target.value)}
              >
                <option value="">Select a signature...</option>
                {signatures.map(sig => (
                  <option key={sig.id} value={sig.id}>
                    {sig.signerName} ({new Date(sig.signedAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            {element.signatureId && (
              <>
                <div className="property-group">
                  <label>Width</label>
                  <input
                    type="number"
                    value={element.width || 200}
                    onChange={(e) => handleChange('width', parseFloat(e.target.value) || 200)}
                    min="50"
                    max="500"
                    step="10"
                  />
                </div>

                <div className="property-group">
                  <label>Height</label>
                  <input
                    type="number"
                    value={element.height || 80}
                    onChange={(e) => handleChange('height', parseFloat(e.target.value) || 80)}
                    min="30"
                    max="200"
                    step="10"
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ElementProperties

