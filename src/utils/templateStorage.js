/**
 * Template Storage Utility
 * 
 * Manages custom templates in localStorage with CRUD operations
 * Supports both built-in and custom templates
 */

const STORAGE_KEY = 'dadadigital_custom_templates'

/**
 * Generate a unique ID for a custom template
 */
export function generateTemplateId() {
  return `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get all custom templates from storage
 * @returns {Array} Array of custom template objects
 */
export function getAllCustomTemplates() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }
    const templates = JSON.parse(stored)
    return Array.isArray(templates) ? templates : []
  } catch (error) {
    console.error('Error loading custom templates:', error)
    return []
  }
}

/**
 * Get a custom template by ID
 * @param {string} templateId - Template ID
 * @returns {Object|null} Template object or null if not found
 */
export function getCustomTemplate(templateId) {
  const templates = getAllCustomTemplates()
  return templates.find(t => t.id === templateId) || null
}

/**
 * Save a custom template to storage
 * @param {Object} template - Template object
 * @returns {Object} Saved template with generated ID if needed
 */
export function saveCustomTemplate(template) {
  try {
    // Validate template structure
    // New templates use elements array (can be empty), legacy templates use textPositions
    if (!template.name) {
      throw new Error('Template must have a name')
    }
    // Allow templates with empty elements array (user can add elements later)
    // Only require textPositions or elements if neither exists
    if (!template.textPositions && template.elements === undefined) {
      throw new Error('Template must have either textPositions or elements array')
    }

    const templates = getAllCustomTemplates()
    
    // Get list of built-in template IDs to prevent conflicts
    const builtInTemplateIds = ['minimalist', 'achievement', 'classic', 'modern', 'elegant']
    
    // Check if template with this ID already exists (for update vs create logic)
    let existingIndex = templates.findIndex(t => t.id === template.id)
    
    // Generate ID if not provided OR if provided ID conflicts with built-in template
    // OR if ID conflicts with existing custom template (and we're not updating that same template)
    if (!template.id || builtInTemplateIds.includes(template.id)) {
      template.id = generateTemplateId()
      console.log('Generated new unique template ID (missing or built-in conflict):', template.id)
      // Reset existingIndex since we changed the ID
      existingIndex = -1
    } else if (existingIndex < 0) {
      // New template - double-check ID doesn't conflict (shouldn't happen, but safety check)
      const idConflict = templates.find(t => t.id === template.id)
      if (idConflict) {
        template.id = generateTemplateId()
        console.log('ID conflict detected, generated new unique template ID:', template.id)
        existingIndex = -1
      }
    }
    // If existingIndex >= 0, we're updating an existing template, so keep the ID

    // Set timestamps
    const now = new Date().toISOString()
    if (!template.createdAt) {
      template.createdAt = now
    }
    template.updatedAt = now

    // IMPORTANT: If template has elements array, remove textPositions to prevent double rendering
    if (template.elements && template.elements.length > 0) {
      delete template.textPositions
    }

    // Re-check existingIndex after potential ID changes
    if (existingIndex < 0) {
      existingIndex = templates.findIndex(t => t.id === template.id)
    }
    
    if (existingIndex >= 0) {
      // Update existing template - also clean up textPositions if elements exist
      const updatedTemplate = { ...templates[existingIndex], ...template, updatedAt: now }
      if (updatedTemplate.elements && updatedTemplate.elements.length > 0) {
        delete updatedTemplate.textPositions
      }
      templates[existingIndex] = updatedTemplate
    } else {
      // Add new template
      templates.push(template)
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
    
    console.log(`Template ${template.id} saved successfully`)
    return template
  } catch (error) {
    console.error('Error saving custom template:', error)
    throw error
  }
}

/**
 * Update an existing custom template
 * @param {string} templateId - Template ID
 * @param {Object} updates - Partial template object with updates
 * @returns {Object|null} Updated template or null if not found
 */
export function updateCustomTemplate(templateId, updates) {
  try {
    const templates = getAllCustomTemplates()
    const index = templates.findIndex(t => t.id === templateId)
    
    if (index < 0) {
      return null
    }

    // Merge updates with existing template
    const updated = {
      ...templates[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    templates[index] = updated
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
    
    console.log(`Template ${templateId} updated successfully`)
    return updated
  } catch (error) {
    console.error('Error updating custom template:', error)
    throw error
  }
}

/**
 * Delete a custom template
 * @param {string} templateId - Template ID
 * @returns {boolean} True if deleted, false if not found
 */
export function deleteCustomTemplate(templateId) {
  try {
    const templates = getAllCustomTemplates()
    const initialLength = templates.length
    const filtered = templates.filter(t => t.id !== templateId)
    
    if (filtered.length === initialLength) {
      return false // Template not found
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    console.log(`Template ${templateId} deleted successfully`)
    return true
  } catch (error) {
    console.error('Error deleting custom template:', error)
    throw error
  }
}

/**
 * Duplicate a custom template
 * @param {string} templateId - Template ID to duplicate
 * @param {string} newName - Name for the duplicated template
 * @returns {Object|null} New template or null if source not found
 */
export function duplicateCustomTemplate(templateId, newName) {
  try {
    const source = getCustomTemplate(templateId)
    if (!source) {
      return null
    }

    const duplicate = {
      ...source,
      id: generateTemplateId(),
      name: newName || `${source.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Remove source-specific fields
    delete duplicate.baseTemplateId

    return saveCustomTemplate(duplicate)
  } catch (error) {
    console.error('Error duplicating custom template:', error)
    throw error
  }
}

/**
 * Export all custom templates as JSON
 * @returns {string} JSON string of all custom templates
 */
export function exportCustomTemplates() {
  const templates = getAllCustomTemplates()
  return JSON.stringify(templates, null, 2)
}

/**
 * Import custom templates from JSON
 * @param {string} jsonString - JSON string of templates
 * @param {boolean} overwrite - If true, overwrite existing templates with same ID
 * @returns {Object} Result with imported count and errors
 */
export function importCustomTemplates(jsonString, overwrite = false) {
  try {
    const imported = JSON.parse(jsonString)
    if (!Array.isArray(imported)) {
      throw new Error('Imported data must be an array')
    }

    const existing = getAllCustomTemplates()
    const existingIds = new Set(existing.map(t => t.id))
    let importedCount = 0
    const errors = []

    imported.forEach((template, index) => {
      try {
        // Validate template structure
        if (!template.name || !template.textPositions) {
          errors.push(`Template ${index + 1}: Missing required fields (name or textPositions)`)
          return
        }

        // Check if template already exists
        if (existingIds.has(template.id)) {
          if (overwrite) {
            updateCustomTemplate(template.id, template)
            importedCount++
          } else {
            // Generate new ID for duplicate
            const oldId = template.id
            template.id = generateTemplateId()
            saveCustomTemplate(template)
            importedCount++
          }
        } else {
          // New template
          saveCustomTemplate(template)
          importedCount++
        }
      } catch (error) {
        errors.push(`Template ${index + 1}: ${error.message}`)
      }
    })

    return {
      success: true,
      imported: importedCount,
      total: imported.length,
      errors
    }
  } catch (error) {
    console.error('Error importing custom templates:', error)
    return {
      success: false,
      imported: 0,
      total: 0,
      errors: [error.message]
    }
  }
}

/**
 * Clear all custom templates
 * @returns {boolean} True if cleared successfully
 */
export function clearAllCustomTemplates() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log('All custom templates cleared')
    return true
  } catch (error) {
    console.error('Error clearing custom templates:', error)
    return false
  }
}

/**
 * Clean up existing templates by removing textPositions when elements exist
 * Also fixes ID conflicts with built-in templates and removes duplicates
 * This prevents double rendering issues
 * @returns {number} Number of templates cleaned
 */
export function cleanupTemplates() {
  try {
    const templates = getAllCustomTemplates()
    const builtInTemplateIds = ['minimalist', 'achievement', 'classic', 'modern', 'elegant']
    let cleanedCount = 0
    let needsSave = false
    const seenIds = new Set()
    
    const cleanedTemplates = templates.filter((template) => {
      // Skip templates with conflicting IDs
      if (builtInTemplateIds.includes(template.id)) {
        console.warn(`Removing template "${template.name}" with conflicting built-in ID "${template.id}"`)
        cleanedCount++
        needsSave = true
        return false
      }
      
      // Skip duplicate IDs (keep first occurrence)
      if (seenIds.has(template.id)) {
        console.warn(`Removing duplicate template "${template.name}" with ID "${template.id}"`)
        cleanedCount++
        needsSave = true
        return false
      }
      seenIds.add(template.id)
      
      // Remove textPositions if elements exist
      if (template.elements && template.elements.length > 0 && template.textPositions) {
        delete template.textPositions
        cleanedCount++
        needsSave = true
      }
      
      return true
    })
    
    if (needsSave) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedTemplates))
      console.log(`Cleaned up ${cleanedCount} template(s) - removed conflicts and textPositions where elements exist`)
    }
    
    return cleanedCount
  } catch (error) {
    console.error('Error cleaning up templates:', error)
    return 0
  }
}

/**
 * Emergency function to clear all custom templates
 * Use this if templates are corrupted or duplicated
 * Can be called from browser console: window.clearAllTemplates()
 */
export function emergencyClearAllTemplates() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log('✅ All custom templates cleared. Only base templates remain.')
    return true
  } catch (error) {
    console.error('Error clearing templates:', error)
    return false
  }
}

// Make it available globally for emergency use
if (typeof window !== 'undefined') {
  window.clearAllTemplates = emergencyClearAllTemplates
}

/**
 * Validate template structure
 * @param {Object} template - Template object to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateTemplate(template) {
  const errors = []

  if (!template.name || typeof template.name !== 'string' || template.name.trim() === '') {
    errors.push('Template name is required')
  }

  // Support both new elements array and legacy textPositions
  if (template.elements && Array.isArray(template.elements)) {
    // Validate elements array
    const requiredFields = ['studentName', 'courseType']
    const textElements = template.elements.filter(el => el.type === 'text')
    const hasRequiredFields = requiredFields.some(field =>
      textElements.some(el => el.field === field)
    )
    
    if (!hasRequiredFields) {
      errors.push(`Missing required text elements: ${requiredFields.join(', ')}`)
    }
    
    // Validate each element
    template.elements.forEach((element, index) => {
      if (!element.id || !element.type) {
        errors.push(`Element ${index + 1}: Missing id or type`)
      }
      if (typeof element.x !== 'number' || typeof element.y !== 'number') {
        errors.push(`Element ${index + 1}: Invalid coordinates (x, y must be numbers)`)
      }
      if (element.type === 'text' && !element.field) {
        errors.push(`Element ${index + 1}: Text elements must have a field`)
      }
      if (element.type === 'signature' && !element.signatureId) {
        errors.push(`Element ${index + 1}: Signature elements must have a signatureId`)
      }
    })
  } else if (template.textPositions && typeof template.textPositions === 'object') {
    // Legacy validation for textPositions
    const requiredFields = ['studentName', 'courseType']
    requiredFields.forEach(field => {
      if (!template.textPositions[field]) {
        errors.push(`Missing required text position: ${field}`)
      } else {
        const pos = template.textPositions[field]
        if (typeof pos.x !== 'number' || typeof pos.y !== 'number') {
          errors.push(`Invalid coordinates for ${field}: x and y must be numbers`)
        }
        if (!pos.fontSize || typeof pos.fontSize !== 'number') {
          errors.push(`Invalid fontSize for ${field}`)
        }
      }
    })
  } else {
    errors.push('Template must have either elements array or textPositions object')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

