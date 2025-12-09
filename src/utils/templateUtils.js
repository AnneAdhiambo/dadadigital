/**
 * Template utilities for certificate generation
 * 
 * IMPORTANT: Templates should contain placeholders like:
 * - {{STUDENT_NAME}} or {STUDENT_NAME} or STUDENT_NAME
 * - {{COURSE_TYPE}} or {{COURSE_NAME}} or {COURSE_TYPE} or {COURSE_NAME}
 * - {{COHORT}} or {{COHORT_NAME}} or {COHORT} or {COHORT_NAME}
 * - {{CERTIFICATE_TYPE}} or {CERTIFICATE_TYPE} or CERTIFICATE_TYPE
 * - {{ISSUE_DATE}} or {ISSUE_DATE} or ISSUE_DATE
 * - {{CERTIFICATE_ID}} or {CERTIFICATE_ID} or CERTIFICATE_ID
 * - {{SIGNATURE}} or {SIGNATURE} or SIGNATURE
 * - {{SIGNER_TITLE_1}} or {SIGNER_TITLE_1}
 * - {{SIGNER_TITLE_2}} or {SIGNER_TITLE_2}
 * 
 * The function will replace these placeholders with actual certificate data
 * without modifying the template structure - only text content is replaced.
 */

import { getAllCustomTemplates, getCustomTemplate, saveCustomTemplate, generateTemplateId } from './templateStorage'
import { parseFontFromFilename } from './fontUtils'

export const TEMPLATES = {
  'achievement': {
    id: 'achievement',
    name: 'Modern Achievement',
    filename: 'Amsterdam Four_ttf 400Modern Achievement.png',
    type: 'png',
    description: 'Classic achievement certificate design',
    fontName: 'Amsterdam Four_ttf 400',
    // Elements array for drag-and-drop editor
    elements: [],
    // Legacy textPositions for backward compatibility
    textPositions: {
      studentName: { x: 421, y: 320, fontSize: 48, fontWeight: 'bold', fontFamily: 'Amsterdam Four_ttf 400', fill: '#000000' },
      courseType: { x: 421, y: 380, fontSize: 24, fontWeight: 'normal', fontFamily: 'Amsterdam Four_ttf 400', fill: '#000000' },
      cohort: { x: 421, y: 420, fontSize: 18, fontWeight: 'normal', fontFamily: 'Amsterdam Four_ttf 400', fill: '#666666' },
      certificateType: { x: 421, y: 100, fontSize: 32, fontWeight: 'bold', fontFamily: 'Amsterdam Four_ttf 400', fill: '#000000' },
      issueDate: { x: 421, y: 550, fontSize: 16, fontWeight: 'normal', fontFamily: 'Amsterdam Four_ttf 400', fill: '#666666' }
    }
  },
  'minimalist': {
    id: 'minimalist',
    name: 'Minimalist Certificate',
    filename: 'Amsterdam Four_ttf 400_Minimalist Certificate.png',
    type: 'png',
    description: 'Clean and simple minimalist design',
    fontName: 'Amsterdam Four_ttf 400',
    elements: [],
    textPositions: {
      studentName: { x: 421, y: 300, fontSize: 48, fontWeight: 'bold', fontFamily: 'Amsterdam Four_ttf 400', fill: '#000000' },
      courseType: { x: 421, y: 360, fontSize: 24, fontWeight: 'normal', fontFamily: 'Amsterdam Four_ttf 400', fill: '#000000' },
      cohort: { x: 421, y: 400, fontSize: 18, fontWeight: 'normal', fontFamily: 'Amsterdam Four_ttf 400', fill: '#666666' },
      certificateType: { x: 421, y: 100, fontSize: 32, fontWeight: 'bold', fontFamily: 'Amsterdam Four_ttf 400', fill: '#000000' },
      issueDate: { x: 421, y: 530, fontSize: 16, fontWeight: 'normal', fontFamily: 'Amsterdam Four_ttf 400', fill: '#666666' }
    }
  },
  'brightwall-achievement': {
    id: 'brightwall-achievement',
    name: 'BrightWall Achievement',
    filename: 'BrightWall_Achievement.png',
    type: 'png',
    description: 'Bright and modern achievement design',
    fontName: 'BrightWall',
    elements: [],
    textPositions: {
      studentName: { x: 421, y: 320, fontSize: 48, fontWeight: 'bold', fontFamily: 'BrightWall', fill: '#000000' },
      courseType: { x: 421, y: 380, fontSize: 24, fontWeight: 'normal', fontFamily: 'BrightWall', fill: '#000000' },
      cohort: { x: 421, y: 420, fontSize: 18, fontWeight: 'normal', fontFamily: 'BrightWall', fill: '#666666' },
      certificateType: { x: 421, y: 100, fontSize: 32, fontWeight: 'bold', fontFamily: 'BrightWall', fill: '#000000' },
      issueDate: { x: 421, y: 550, fontSize: 16, fontWeight: 'normal', fontFamily: 'BrightWall', fill: '#666666' }
    }
  }
}

// Template content cache (for SVG/PNG)
const templateCache = {
  'achievement': null,
  'minimalist': null,
  'brightwall-achievement': null
}

// Default template if none selected
export const DEFAULT_TEMPLATE = 'achievement'

/**
 * Get template by ID (checks both built-in and custom templates)
 */
export function getTemplate(templateId) {
  // First check built-in templates
  if (TEMPLATES[templateId]) {
    const template = { ...TEMPLATES[templateId] }
    // For base templates, remove textPositions to prevent auto-conversion
    // Base templates should start clean with empty elements array
    delete template.textPositions
    return template
  }
  
  // Then check custom templates
  const customTemplate = getCustomTemplate(templateId)
  if (customTemplate) {
    // Clean up textPositions if elements exist to prevent double rendering
    const cleaned = { ...customTemplate }
    if (cleaned.elements && cleaned.elements.length > 0 && cleaned.textPositions) {
      delete cleaned.textPositions
    }
    return cleaned
  }
  
  // Fallback to default
  const defaultTemplate = { ...TEMPLATES.achievement }
  delete defaultTemplate.textPositions
  return defaultTemplate
}

/**
 * Get all available templates (built-in + custom)
 * Ensures no duplicate IDs between built-in and custom templates
 */
export function getAllTemplates() {
  const builtInTemplates = Object.values(TEMPLATES)
  const customTemplates = getAllCustomTemplates()
  
  // Get built-in template IDs to prevent conflicts
  const builtInIds = new Set(builtInTemplates.map(t => t.id))
  
  // Mark built-in templates and remove textPositions so they start clean
  const builtIn = builtInTemplates.map(t => {
    const cleaned = { ...t, isBuiltIn: true }
    delete cleaned.textPositions
    return cleaned
  })
  
  // Mark custom templates and clean up textPositions if elements exist
  // NOTE: This is a READ operation - we do NOT save templates here to avoid infinite loops
  // ID conflicts should be fixed by saveCustomTemplate() when templates are saved
  const custom = customTemplates
    .filter(t => {
      // Filter out templates with conflicting IDs (they'll be fixed on next save)
      if (builtInIds.has(t.id)) {
        console.warn(`Custom template "${t.name}" has conflicting ID "${t.id}" with built-in template. It will be fixed on next save.`)
        return false // Don't show conflicting templates in the list
      }
      return true
    })
    .map(t => {
      const cleaned = { ...t, isBuiltIn: false }
      // Remove textPositions if elements array exists to prevent double rendering
      if (cleaned.elements && cleaned.elements.length > 0 && cleaned.textPositions) {
        delete cleaned.textPositions
      }
      return cleaned
    })
  
  // Remove any duplicate IDs within custom templates (keep first occurrence)
  const seenIds = new Set()
  const uniqueCustom = custom.filter(t => {
    if (seenIds.has(t.id)) {
      console.warn(`Duplicate custom template ID "${t.id}" found for "${t.name}". Skipping duplicate.`)
      return false // Skip duplicates
    }
    seenIds.add(t.id)
    return true
  })
  
  // Combine and return
  return [...builtIn, ...uniqueCustom]
}

/**
 * Load template content (supports SVG and PNG)
 * Loads the original template file without any modifications
 * Tries multiple paths to find the template file
 * For PNG templates, returns the image URL/data URL
 */
export async function loadTemplate(templateId) {
  try {
    const template = getTemplate(templateId)
    
    // Check if it's a custom template with stored content
    if (template.templateContent) {
      return template.templateContent
    }
    
    // Check cache first
    if (templateCache[templateId]) {
      console.log('Using cached template for', templateId)
      return templateCache[templateId]
    }
    
    // Detect font from filename if not already set
    if (!template.fontName && template.filename) {
      template.fontName = parseFontFromFilename(template.filename)
    }
    
    // For PNG templates, return the image URL
    if (template.type === 'png') {
      const pathsToTry = template.filename ? [
        `/templates/${template.filename}`, // Public folder
        `/src/templates/${template.filename}`, // Source folder (dev)
        `./templates/${template.filename}`, // Relative path
      ] : []
      
      for (const path of pathsToTry) {
        try {
          console.log('Trying to load PNG template from:', path)
          const response = await fetch(path)
          if (response.ok) {
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            console.log('Successfully loaded PNG template from:', path)
            templateCache[templateId] = url
            return url
          }
        } catch (fetchError) {
          console.warn('Failed to load from', path, ':', fetchError.message)
          continue
        }
      }
      
      throw new Error(`PNG template file not found: ${template.filename || 'No filename specified'}`)
    }
    
    // For SVG templates (legacy support)
    if (template.type === 'svg') {
      const pathsToTry = template.filename ? [
        `/templates/${template.filename}`, // Public folder
        `/src/templates/${template.filename}`, // Source folder (dev)
        `./templates/${template.filename}`, // Relative path
      ] : []
      
      for (const path of pathsToTry) {
        try {
          console.log('Trying to load SVG template from:', path)
          const response = await fetch(path)
          if (response.ok) {
            const content = await response.text()
            console.log('Successfully loaded SVG template from:', path, 'Length:', content.length)
            templateCache[templateId] = content
            return content
          }
        } catch (fetchError) {
          console.warn('Failed to load from', path, ':', fetchError.message)
          continue
        }
      }
      
      // Fallback for SVG
      console.warn('Could not load template file, using fallback for', templateId)
      const fallback = getFallbackSVG()
      templateCache[templateId] = fallback
      return fallback
    }
    
    throw new Error(`Unsupported template type: ${template.type}`)
  } catch (error) {
    console.error('Error loading template:', error)
    const template = getTemplate(templateId)
    if (template.type === 'svg') {
      console.warn('Using fallback template')
      return getFallbackSVG()
    } else {
      throw error
    }
  }
}

/**
 * Load SVG template content (legacy function for backward compatibility)
 * @deprecated Use loadTemplate() instead
 */
export async function loadTemplateSVG(templateId) {
  return loadTemplate(templateId)
}

/**
 * Fallback SVG template if file loading fails
 */
function getFallbackSVG() {
  return `
    <svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="800" fill="#ffffff" stroke="#f0b400" stroke-width="4"/>
      <text x="600" y="100" font-family="Arial" font-size="36" font-weight="bold" text-anchor="middle" fill="#000000">{{CERTIFICATE_TYPE}}</text>
      <text x="600" y="200" font-family="Arial" font-size="18" text-anchor="middle" fill="#666666">This is to certify that</text>
      <text x="600" y="280" font-family="Arial" font-size="32" font-weight="bold" text-anchor="middle" fill="#000000">{{STUDENT_NAME}}</text>
      <text x="600" y="340" font-family="Arial" font-size="18" text-anchor="middle" fill="#666666">has successfully completed</text>
      <text x="600" y="400" font-family="Arial" font-size="24" font-weight="bold" text-anchor="middle" fill="#f0b400">{{COURSE_TYPE}}</text>
      <text x="600" y="460" font-family="Arial" font-size="16" text-anchor="middle" fill="#666666">Cohort: {{COHORT}}</text>
      <text x="600" y="700" font-family="Arial" font-size="14" text-anchor="middle" fill="#666666">Issued on {{ISSUE_DATE}}</text>
      <text x="600" y="750" font-family="Arial" font-size="12" text-anchor="middle" fill="#999999">Certificate ID: {{CERTIFICATE_ID}}</text>
    </svg>
  `
}

/**
 * Populate template with certificate data and convert to PDF
 * Supports both PNG and SVG templates
 * 
 * @param {string|null} templateContent - The original template content (null to load from templateId)
 * @param {object} certificate - Certificate data object
 * @param {string} templateId - Template ID (required if templateContent is null)
 * @returns {Promise<Blob>} - PDF blob with certificate data
 */
export async function populateTemplate(templateContent, certificate, templateId) {
  try {
    const template = getTemplate(templateId || 'achievement')
    
    // Load template if not provided
    let templateData = templateContent
    if (!templateData && templateId) {
      templateData = await loadTemplate(templateId)
    }
    
    if (!templateData) {
      throw new Error('Template content is required. Provide templateContent or templateId.')
    }
    
    // Handle PNG templates
    if (template.type === 'png') {
      // Import pdfTemplateUtils for PNG handling
      const { generatePDFFromPNGTemplate } = await import('./pdfTemplateUtils')
      return await generatePDFFromPNGTemplate(templateData, certificate, templateId)
    }
    
    // Handle SVG templates (legacy)
    if (template.type === 'svg') {
      // Populate SVG with certificate data
      const populatedSVG = populateTemplateSVG(templateData, certificate)
      
      // Convert SVG to PDF
      const pdfBlob = await convertSVGToPDF(populatedSVG, certificate, templateId)
      return pdfBlob
    }
    
    throw new Error(`Unsupported template type: ${template.type}`)
  } catch (error) {
    console.error('Error in populateTemplate:', error)
    throw new Error(`Failed to generate certificate PDF: ${error.message}`)
  }
}

/**
 * Replace placeholders in SVG template with certificate data
 * 
 * This function modifies ONLY the text content in the SVG by replacing placeholders.
 * The SVG structure, styling, paths, and all other elements remain unchanged.
 * 
 * For SVGs with path-based text (like the provided templates), this function uses DOM parsing
 * to inject new text elements at appropriate positions or replace existing text content.
 * 
 * @param {string} svgContent - The original SVG content as a string
 * @param {object} certificate - Certificate data object
 * @returns {string} - SVG with placeholders replaced by actual data
 */
export function populateTemplateSVG(svgContent, certificate) {
  if (!svgContent || typeof svgContent !== 'string') {
    console.warn('Invalid SVG content provided')
    return svgContent
  }
  
  // Create a copy to avoid mutating the original
  let populatedSVG = svgContent
  
  // Prepare replacement values
  const issueDate = certificate.issueDate 
    ? new Date(certificate.issueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
  
  const signature = certificate.signature 
    ? `${certificate.signature.substring(0, 12)}...${certificate.signature.substring(certificate.signature.length - 8)}`
    : ''
  
  // Define replacement map - supports multiple placeholder formats
  const replacements = {
    // Double curly braces format: {{PLACEHOLDER}}
    '{{STUDENT_NAME}}': certificate.studentName || '',
    '{{COURSE_TYPE}}': certificate.courseType || '',
    '{{COHORT}}': certificate.cohort || '',
    '{{CERTIFICATE_TYPE}}': certificate.certificateType || 'Certificate of Completion',
    '{{ISSUE_DATE}}': issueDate,
    '{{CERTIFICATE_ID}}': certificate.id || '',
    '{{SIGNATURE}}': signature,
    // Single curly braces format: {PLACEHOLDER}
    '{STUDENT_NAME}': certificate.studentName || '',
    '{COURSE_TYPE}': certificate.courseType || '',
    '{COHORT}': certificate.cohort || '',
    '{CERTIFICATE_TYPE}': certificate.certificateType || 'Certificate of Completion',
    '{ISSUE_DATE}': issueDate,
    '{CERTIFICATE_ID}': certificate.id || '',
    '{SIGNATURE}': signature,
    // Without braces: PLACEHOLDER (less common but supported)
    'STUDENT_NAME': certificate.studentName || '',
    'COURSE_TYPE': certificate.courseType || '',
    'COHORT': certificate.cohort || '',
    'CERTIFICATE_TYPE': certificate.certificateType || 'Certificate of Completion',
    'ISSUE_DATE': issueDate,
    'CERTIFICATE_ID': certificate.id || '',
    'SIGNATURE': signature,
    // Common sample names that might be hardcoded in templates
    'Anne Mahonga': certificate.studentName || '',
    'Daniel Gallego': certificate.studentName || '',
    'John Doe': certificate.studentName || '',
    'Sample Course': certificate.courseType || '',
    'Cohort 2025-01': certificate.cohort || '',
  }
  
  // Apply replacements - replace all occurrences in the SVG string
  // This only changes text content, not SVG structure
  Object.keys(replacements).forEach(placeholder => {
    // Escape special regex characters in placeholder
    const escapedPlaceholder = placeholder.replace(/[{}]/g, '\\$&')
    // Create regex that matches the placeholder (case-insensitive, global)
    const regex = new RegExp(escapedPlaceholder, 'gi')
    populatedSVG = populatedSVG.replace(regex, replacements[placeholder])
  })
  
  // Try to use DOM parsing for more sophisticated text replacement and injection
  // This is useful for SVGs that have path-based text and need text elements injected
  try {
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(populatedSVG, 'image/svg+xml')
    
    // Check for parsing errors
    const parserError = svgDoc.querySelector('parsererror')
    if (parserError) {
      console.warn('SVG parsing error, using string replacement only:', parserError.textContent)
    } else {
      const svgElement = svgDoc.documentElement
      
      // Find and replace existing text elements
      const textElements = svgDoc.querySelectorAll('text, tspan')
      textElements.forEach(textEl => {
        const textContent = textEl.textContent || ''
        // Replace common sample text with actual certificate data
        if (textContent.includes('Anne Mahonga') || textContent.includes('Daniel Gallego') || textContent.includes('John Doe')) {
          textEl.textContent = certificate.studentName || textContent
        }
        if (textContent.includes('Sample Course')) {
          textEl.textContent = certificate.courseType || textContent
        }
        if (textContent.includes('Cohort 2025-01')) {
          textEl.textContent = certificate.cohort || textContent
        }
      })
      
      // If template has text positions defined, inject text elements
      // This is for SVGs with path-based text where we need to overlay text elements
      const templateId = certificate.templateId || 'achievement'
  const template = getTemplate(templateId)
      
      if (template.textPositions && certificate.studentName) {
        // Create a group for certificate text (so it can be easily styled/manipulated)
        let textGroup = svgDoc.querySelector('g.certificate-text-group')
        if (!textGroup) {
          textGroup = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g')
          textGroup.setAttribute('class', 'certificate-text-group')
          svgElement.appendChild(textGroup)
        }
        
        const positions = template.textPositions
        
        // Inject student name
        if (positions.studentName && certificate.studentName) {
          const studentNameText = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'text')
          studentNameText.setAttribute('x', positions.studentName.x)
          studentNameText.setAttribute('y', positions.studentName.y)
          studentNameText.setAttribute('font-size', positions.studentName.fontSize)
          studentNameText.setAttribute('font-weight', positions.studentName.fontWeight)
          studentNameText.setAttribute('font-family', positions.studentName.fontFamily)
          studentNameText.setAttribute('fill', positions.studentName.fill)
          studentNameText.setAttribute('text-anchor', 'middle')
          studentNameText.textContent = certificate.studentName
          textGroup.appendChild(studentNameText)
        }
        
        // Inject course type
        if (positions.courseType && certificate.courseType) {
          const courseTypeText = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'text')
          courseTypeText.setAttribute('x', positions.courseType.x)
          courseTypeText.setAttribute('y', positions.courseType.y)
          courseTypeText.setAttribute('font-size', positions.courseType.fontSize)
          courseTypeText.setAttribute('font-weight', positions.courseType.fontWeight)
          courseTypeText.setAttribute('font-family', positions.courseType.fontFamily)
          courseTypeText.setAttribute('fill', positions.courseType.fill)
          courseTypeText.setAttribute('text-anchor', 'middle')
          courseTypeText.textContent = certificate.courseType
          textGroup.appendChild(courseTypeText)
        }
        
        // Inject cohort
        if (positions.cohort && certificate.cohort) {
          const cohortText = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'text')
          cohortText.setAttribute('x', positions.cohort.x)
          cohortText.setAttribute('y', positions.cohort.y)
          cohortText.setAttribute('font-size', positions.cohort.fontSize)
          cohortText.setAttribute('font-weight', positions.cohort.fontWeight)
          cohortText.setAttribute('font-family', positions.cohort.fontFamily)
          cohortText.setAttribute('fill', positions.cohort.fill)
          cohortText.setAttribute('text-anchor', 'middle')
          cohortText.textContent = `Cohort: ${certificate.cohort}`
          textGroup.appendChild(cohortText)
        }
        
        // Inject certificate type
        if (positions.certificateType && certificate.certificateType) {
          const certTypeText = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'text')
          certTypeText.setAttribute('x', positions.certificateType.x)
          certTypeText.setAttribute('y', positions.certificateType.y)
          certTypeText.setAttribute('font-size', positions.certificateType.fontSize)
          certTypeText.setAttribute('font-weight', positions.certificateType.fontWeight)
          certTypeText.setAttribute('font-family', positions.certificateType.fontFamily)
          certTypeText.setAttribute('fill', positions.certificateType.fill)
          certTypeText.setAttribute('text-anchor', 'middle')
          certTypeText.textContent = certificate.certificateType
          textGroup.appendChild(certTypeText)
        }
        
        // Inject issue date
        if (positions.issueDate && certificate.issueDate) {
          const issueDateText = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'text')
          issueDateText.setAttribute('x', positions.issueDate.x)
          issueDateText.setAttribute('y', positions.issueDate.y)
          issueDateText.setAttribute('font-size', positions.issueDate.fontSize)
          issueDateText.setAttribute('font-weight', positions.issueDate.fontWeight)
          issueDateText.setAttribute('font-family', positions.issueDate.fontFamily)
          issueDateText.setAttribute('fill', positions.issueDate.fill)
          issueDateText.setAttribute('text-anchor', 'middle')
          issueDateText.textContent = `Issued on ${issueDate}`
          textGroup.appendChild(issueDateText)
        }
      }
      
      // Convert back to string
      const serializer = new XMLSerializer()
      populatedSVG = serializer.serializeToString(svgDoc.documentElement)
    }
  } catch (error) {
    console.warn('DOM parsing failed, using string replacement only:', error)
    // Continue with string-based replacement
  }
  
  // Ensure SVG has proper scaling attributes for responsive rendering
  // Add preserveAspectRatio if not present
  if (!populatedSVG.includes('preserveAspectRatio')) {
    populatedSVG = populatedSVG.replace(
      /<svg([^>]*)>/i,
      '<svg$1 preserveAspectRatio="xMidYMid meet">'
    )
  }
  
  // Ensure SVG has viewBox if it has width and height (for better scaling)
  if (populatedSVG.match(/<svg[^>]*width=["'](\d+)["'][^>]*height=["'](\d+)["']/i) && !populatedSVG.includes('viewBox')) {
    const widthMatch = populatedSVG.match(/width=["'](\d+)["']/i)
    const heightMatch = populatedSVG.match(/height=["'](\d+)["']/i)
    if (widthMatch && heightMatch) {
      const width = widthMatch[1]
      const height = heightMatch[1]
      populatedSVG = populatedSVG.replace(
        /<svg([^>]*)>/i,
        `<svg$1 viewBox="0 0 ${width} ${height}">`
      )
    }
  }
  
  return populatedSVG
}

/**
 * Convert SVG to PDF using pdf-lib with text positions
 * 
 * @param {string} svgContent - SVG content as string (used for reference, actual rendering uses text positions)
 * @param {object} certificate - Certificate data
 * @param {string} templateId - Template ID
 * @returns {Promise<Blob>} - PDF blob
 */
async function convertSVGToPDF(svgContent, certificate, templateId) {
  try {
    // Import pdf-lib dynamically
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib')
    const QRCode = (await import('qrcode')).default
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create()
    
    // Get template configuration for dimensions and text positions
    const templateConfig = getTemplate(templateId || 'achievement')
    const width = 1200 // Default width in points (8.33 inches)
    const height = 800 // Default height in points (5.56 inches)
    
    // Create page with dimensions
    const page = pdfDoc.addPage([width, height])
    
    // Set white background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: height,
      color: rgb(1, 1, 1),
    })
    
    // Draw border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderColor: rgb(0.94, 0.71, 0), // #f0b400
      borderWidth: 4,
    })
    
    // Embed fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
    
    // Use text positions from template to draw text
    if (templateConfig.textPositions) {
      const positions = templateConfig.textPositions
      
      // Helper to get font
      const getFont = (fontFamily, fontWeight) => {
        if (fontWeight === 'bold') {
          return fontFamily === 'serif' ? timesRomanBoldFont : helveticaBoldFont
        }
        return fontFamily === 'serif' ? timesRomanFont : helveticaFont
      }
      
      // Helper to get color
      const getColor = (colorStr) => {
        if (colorStr === '#000000' || colorStr === 'black') return rgb(0, 0, 0)
        if (colorStr === '#666666' || colorStr === 'gray') return rgb(0.4, 0.4, 0.4)
        return rgb(0, 0, 0)
      }
      
      // Draw certificate type (title)
      if (positions.certificateType && certificate.certificateType) {
        const pos = positions.certificateType
        const font = getFont(pos.fontFamily, pos.fontWeight)
        const color = getColor(pos.fill)
        page.drawText(certificate.certificateType, {
          x: pos.x - (font.widthOfTextAtSize(certificate.certificateType, pos.fontSize) / 2),
          y: height - pos.y,
          size: pos.fontSize,
          font: font,
          color: color,
        })
      }
      
      // Draw student name
      if (positions.studentName && certificate.studentName) {
        const pos = positions.studentName
        const font = getFont(pos.fontFamily, pos.fontWeight)
        const color = getColor(pos.fill)
        const textWidth = font.widthOfTextAtSize(certificate.studentName, pos.fontSize)
        page.drawText(certificate.studentName, {
          x: pos.x - (textWidth / 2),
          y: height - pos.y,
          size: pos.fontSize,
          font: font,
          color: color,
        })
      }
      
      // Draw course type
      if (positions.courseType && certificate.courseType) {
        const pos = positions.courseType
        const font = getFont(pos.fontFamily, pos.fontWeight)
        const color = getColor(pos.fill)
        const textWidth = font.widthOfTextAtSize(certificate.courseType, pos.fontSize)
        page.drawText(certificate.courseType, {
          x: pos.x - (textWidth / 2),
          y: height - pos.y,
          size: pos.fontSize,
          font: font,
          color: color,
        })
      }
      
      // Draw cohort
      if (positions.cohort && certificate.cohort) {
        const pos = positions.cohort
        const font = getFont(pos.fontFamily, pos.fontWeight)
        const color = getColor(pos.fill)
        const text = `Cohort: ${certificate.cohort}`
        const textWidth = font.widthOfTextAtSize(text, pos.fontSize)
        page.drawText(text, {
          x: pos.x - (textWidth / 2),
          y: height - pos.y,
          size: pos.fontSize,
          font: font,
          color: color,
        })
      }
      
      // Draw issue date
      if (positions.issueDate && certificate.issueDate) {
        const pos = positions.issueDate
        const font = getFont(pos.fontFamily, pos.fontWeight)
        const color = getColor(pos.fill)
        const issueDate = certificate.issueDate 
          ? new Date(certificate.issueDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          : new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
        const text = `Issued on ${issueDate}`
        const textWidth = font.widthOfTextAtSize(text, pos.fontSize)
        page.drawText(text, {
          x: pos.x - (textWidth / 2),
          y: height - pos.y,
          size: pos.fontSize,
          font: font,
          color: color,
        })
      }
    }
    
    // Add QR code for verification
    try {
      const verificationUrl = `${window.location.origin}/verify/${certificate.id}`
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      const qrCodeImageBytes = await fetch(qrCodeDataUrl).then(res => res.arrayBuffer())
      const qrCodeImage = await pdfDoc.embedPng(qrCodeImageBytes)
      
      const qrSize = 70
      page.drawImage(qrCodeImage, {
        x: 50,
        y: 50,
        width: qrSize,
        height: qrSize
      })
    } catch (qrError) {
      console.warn('Failed to generate QR code:', qrError)
    }
    
    // Set metadata
    pdfDoc.setTitle(`Certificate ${certificate.id}`)
    pdfDoc.setAuthor('Bitcoin Dada')
    pdfDoc.setSubject('Digital Certificate')
    
    // Save PDF
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    
    if (blob.size === 0) {
      throw new Error('Generated PDF is empty')
    }
    
    return blob
  } catch (error) {
    console.error('Error converting SVG to PDF:', error)
    throw new Error(`Failed to convert SVG to PDF: ${error.message}`)
  }
}

/**
 * Create a template from a base template
 * @param {string} baseTemplateId - ID of the base template
 * @param {Object} customizations - Custom text positions and metadata
 * @returns {Object} New template object
 */
export function createTemplateFromBase(baseTemplateId, customizations) {
  const baseTemplate = getTemplate(baseTemplateId)
  if (!baseTemplate) {
    throw new Error(`Base template not found: ${baseTemplateId}`)
  }

  return {
    ...baseTemplate,
    ...customizations,
    baseTemplateId: baseTemplateId,
    isBuiltIn: false
  }
}

/**
 * Validate template structure
 * @param {Object} template - Template object to validate
 * @returns {Object} Validation result
 */
export function validateTemplate(template) {
  const errors = []

  if (!template.name || typeof template.name !== 'string' || template.name.trim() === '') {
    errors.push('Template name is required')
  }

  if (!template.textPositions || typeof template.textPositions !== 'object') {
    errors.push('Template textPositions is required and must be an object')
  } else {
    // Validate required text positions
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
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
