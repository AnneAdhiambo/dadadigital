/**
 * Template utilities for certificate generation - PDF ONLY
 * 
 * This module handles PDF template loading and certificate generation.
 * Text is overlaid on PDF templates at specific coordinates.
 */

import { generateCertificatePDF } from './pdfTemplateUtils'

export const TEMPLATES = {
  'achievement': {
    id: 'achievement',
    name: 'Achievement Certificate',
    filename: 'Clean PDF Template.pdf',
    type: 'pdf',
    description: 'Clean certificate template with borders',
    // Professional Certificate Layout (ALL text overlaid on blank template)
    // PDF coordinate system: (0,0) is bottom-left, y increases upward
    // Template is BLANK - we overlay ALL text
    // Order: CERTIFICATE (bold) → Certificate of Completion (small) → rest
    textPositions: {
      // 1. "CERTIFICATE" - LARGE BOLD TITLE (FIRST/TOP)
      mainTitle: {
        x: 505.5,
        y: 80,
        fontSize: 56,
        fontWeight: 'bold',
        fontFamily: 'TimesRoman',
        color: { r: 0, g: 0, b: 0 },
        align: 'center'
      },
      
      // 2. "CERTIFICATE OF COMPLETION" - small header (below CERTIFICATE)
      certificateTitle: {
        x: 505.5,
        y: 145,
        fontSize: 13,
        fontWeight: 'normal',
        fontFamily: 'Helvetica',
        color: { r: 0.4, g: 0.4, b: 0.4 },
        align: 'center',
        letterSpacing: 1.5
      },
      
      // 3. "THIS CERTIFICATE IS PROUDLY PRESENTED TO" - subtitle
      presentedTo: {
        x: 505.5,
        y: 200,
        fontSize: 12,
        fontWeight: 'normal',
        fontFamily: 'Helvetica',
        color: { r: 0.4, g: 0.4, b: 0.4 },
        align: 'center',
        letterSpacing: 2
      },
      
      // 4. Student Name - large, prominent
      studentName: { 
        x: 505.5,
        y: 265,
        fontSize: 52,
        fontWeight: 'bold',
        fontFamily: 'TimesRoman',
        color: { r: 0, g: 0, b: 0 },
        align: 'center'
      },
      
      // 5. "For successfully completing" - small descriptive text (MOVED UP)
      completingText: {
        x: 505.5,
        y: 310,
        fontSize: 13,
        fontWeight: 'normal',
        fontFamily: 'Helvetica',
        color: { r: 0.4, g: 0.4, b: 0.4 },
        align: 'center'
      },
      
      // 6. Course Name - medium emphasis (MOVED UP)
      courseType: { 
        x: 505.5,
        y: 345,
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: 'Helvetica',
        color: { r: 0, g: 0, b: 0 },
        align: 'center'
      },
      
      // 7. Cohort - MOVED HIGHER to avoid overlapping the seal completely
      cohort: { 
        x: 505.5,
        y: 390,
        fontSize: 17,
        fontWeight: 'normal',
        fontFamily: 'Helvetica',
        color: { r: 0.4, g: 0.4, b: 0.4 },
        align: 'center'
      },
      
      // 8. Issue Date - bottom (visible, below seal and signature lines)
      issueDate: { 
        x: 505.5,
        y: 625,
        fontSize: 11,
        fontWeight: 'normal',
        fontFamily: 'Helvetica',
        color: { r: 0.4, g: 0.4, b: 0.4 },
        align: 'center'
      },
      
      // 9. Left signature line label
      signerTitle1: {
        x: 250,
        y: 650,
        fontSize: 10,
        fontWeight: 'normal',
        fontFamily: 'Helvetica',
        color: { r: 0.4, g: 0.4, b: 0.4 },
        align: 'center'
      },
      
      // 10. Right signature line label
      signerTitle2: {
        x: 760,
        y: 650,
        fontSize: 10,
        fontWeight: 'normal',
        fontFamily: 'Helvetica',
        color: { r: 0.4, g: 0.4, b: 0.4 },
        align: 'center'
      }
    }
  },
  'minimalist': {
    id: 'minimalist',
    name: 'Minimalist Certificate',
    filename: 'Minimalist Certificate.pdf',
    type: 'pdf',
    description: 'Modern minimalist design with gold accents',
    // Final Minimalist Layout matching the provided screenshot
    // COORDINATES ARE PIXELS FROM TOP (0 = Top Edge)
    // Page Height approx 600px
    textPositions: {
      // 1. Main Title - "CERTIFICATE" (Top)
      mainTitle: {
        x: 422, // Center
        y: 90,  // ~90px from top
        fontSize: 56,
        fontWeight: 'bold',
        fontFamily: 'TimesRoman',
        color: { r: 0, g: 0, b: 0 },
        align: 'center'
      },
      
      // 2. Subtitle - "OF ACHIEVEMENT" (Below Title)
      certificateTitle: {
        x: 422,
        y: 135, // ~45px below title
        fontSize: 24,
        fontWeight: 'normal',
        fontFamily: 'TimesRomanItalic',
        color: { r: 0.2, g: 0.2, b: 0.2 },
        align: 'center',
        letterSpacing: 2,
        text: 'OF ACHIEVEMENT'
      },
      
      // 3. "This certificate is awarded to"
      presentedTo: {
        x: 422,
        y: 200,
        fontSize: 14,
        fontWeight: 'normal',
        fontFamily: 'Helvetica',
        color: { r: 0.4, g: 0.4, b: 0.4 },
        align: 'center'
      },
      
      // 4. Student Name - Script Font (AmsterdamFour)
      studentName: { 
        x: 422,
        y: 300, // Positioned ON the line
        fontSize: 60,
        fontWeight: 'normal',
        fontFamily: 'AmsterdamFour',
        color: { r: 0, g: 0, b: 0 },
        align: 'center'
      },
      
      // 5. Reason / Completing Text - "For successfully completing..."
      // MOVED DOWN to be clearly BELOW the line
      completingText: {
        x: 422,
        y: 390, // ~90px below name
        fontSize: 14,
        fontWeight: 'normal',
        fontFamily: 'TimesRomanItalic',
        color: { r: 0.2, g: 0.2, b: 0.2 },
        align: 'center'
      },
      
      // 6. Course Name - Below reason text
      courseType: { 
        x: 422,
        y: 415,
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'TimesRoman',
        color: { r: 0, g: 0, b: 0 },
        align: 'center'
      },
      
      // 7. Cohort - Below course
      cohort: { 
        x: 422,
        y: 435,
        fontSize: 12,
        fontWeight: 'normal',
        fontFamily: 'Helvetica',
        color: { r: 0.4, g: 0.4, b: 0.4 },
        align: 'center'
      },
      
      // 7. Signature (Founder & CEO) - Bottom
      signerTitle1: {
        x: 422, // Center aligned for single signature in screenshot
        y: 500, // Bottom area
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'TimesRomanItalic',
        color: { r: 0, g: 0, b: 0 },
        align: 'center'
      },
      
      signerTitle2: {
        x: 422,
        y: 520,
        fontSize: 12,
        fontWeight: 'normal',
        fontFamily: 'Helvetica',
        color: { r: 0.3, g: 0.3, b: 0.3 },
        align: 'center'
      }
    }
  }
}

// Default template if none selected
export const DEFAULT_TEMPLATE = 'achievement'

/**
 * Get template by ID
 */
export function getTemplate(templateId) {
  return TEMPLATES[templateId] || TEMPLATES.achievement
}

/**
 * Get all available templates
 */
export function getAllTemplates() {
  return Object.values(TEMPLATES)
}

/**
 * Load template (returns path for PDF templates)
 * 
 * @param {string} templateId - Template ID
 * @returns {Promise<string>} - Template path
 */
export async function loadTemplate(templateId) {
  const template = getTemplate(templateId)
  return `/templates/${template.filename}`
}

/**
 * Populate template with certificate data (PDF only)
 * 
 * @param {string} templatePath - Template path (not used, kept for compatibility)
 * @param {object} certificate - Certificate data object
 * @param {string} templateId - Template ID
 * @returns {Promise<Blob>} - Generated PDF as Blob
 */
export async function populateTemplate(templatePath, certificate, templateId) {
  const template = getTemplate(templateId)
  const templatePathActual = `/templates/${template.filename}`
  return await generateCertificatePDF(templatePathActual, certificate, template.textPositions)
}
