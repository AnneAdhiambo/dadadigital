/**
 * PDF Template utilities for certificate generation
 * 
 * This module handles loading PDF templates and overlaying dynamic text
 * to create certificates with perfect vector quality.
 * 
 * Workflow:
 * 1. Load PDF template (background)
 * 2. Overlay text at specific coordinates
 * 3. Output clean PDF with vector quality
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QRCode from 'qrcode'

/**
 * Load PDF template
 * 
 * @param {string} templatePath - Path to the PDF template file
 * @returns {Promise<ArrayBuffer>} - PDF file as ArrayBuffer
 */
export async function loadPDFTemplate(templatePath) {
  try {
    console.log('Loading PDF template from:', templatePath)
    const response = await fetch(templatePath)
    if (!response.ok) {
      throw new Error(`Failed to load PDF template: ${response.status} ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    console.log('PDF template loaded, size:', arrayBuffer.byteLength, 'bytes')
    if (arrayBuffer.byteLength === 0) {
      throw new Error('PDF template file is empty')
    }
    return arrayBuffer
  } catch (error) {
    console.error('Error loading PDF template:', error)
    throw new Error(`Failed to load PDF template from ${templatePath}: ${error.message}`)
  }
}

/**
 * Load a custom font
 */
async function loadCustomFont(pdfDoc, fontName) {
  try {
    console.log(`Attempting to load custom font: ${fontName}`)
    
    // Determine filename based on font family
    let filename = `${fontName}.ttf`
    if (fontName === 'AmsterdamFour') {
      filename = 'Amsterdam Four_ttf 400.ttf' // User provided specific filename
    }
    
    // Try loading from templates folder first, then root
    // Note: User mentioned it's in the template folder
    const fontUrl = `/templates/${filename}`
    
    console.log(`Fetching font from: ${fontUrl}`)
    const fontBytes = await fetch(fontUrl).then(res => {
      if (!res.ok) throw new Error(`Failed to load font ${fontName} from ${fontUrl} (Status: ${res.status})`)
      return res.arrayBuffer()
    })

    pdfDoc.registerFontkit(fontkit)
    const customFont = await pdfDoc.embedFont(fontBytes)
    console.log(`Successfully embedded custom font: ${fontName}`)
    return customFont
  } catch (error) {
    console.warn(`Could not load custom font ${fontName}, falling back to standard font. Error:`, error.message)
    // Try fallback to root if templates failed?
    if (fontName === 'AmsterdamFour') {
       try {
         console.log('Retrying from root / ...')
         const rootUrl = '/Amsterdam Four_ttf 400.ttf'
         const fontBytes = await fetch(rootUrl).then(r => r.arrayBuffer())
         pdfDoc.registerFontkit(fontkit)
         return await pdfDoc.embedFont(fontBytes)
       } catch (e) { console.warn('Root fallback failed', e) }
    }
    return null
  }
}

/**
 * Overlay text on PDF template
 * 
 * @param {ArrayBuffer} pdfBytes - PDF template as ArrayBuffer
 * @param {object} certificate - Certificate data object
 * @param {object} textPositions - Text positions configuration (in points, PDF coordinates)
 * @returns {Promise<Blob>} - PDF with text overlaid as Blob
 */
export async function overlayTextOnPDF(pdfBytes, certificate, textPositions) {
  try {
    console.log('Overlaying text on PDF, certificate data:', {
      studentName: certificate.studentName,
      courseType: certificate.courseType,
      cohort: certificate.cohort
    })
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const pages = pdfDoc.getPages()
    
    if (pages.length === 0) {
      throw new Error('PDF template has no pages')
    }
    
    const firstPage = pages[0]
    
    // Get page dimensions (in points)
    const { width, height } = firstPage.getSize()
    console.log(`PDF page size: ${width} x ${height} points`)
    console.log(`Text positions config:`, textPositions)
    
    // Embed fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
    const timesRomanItalicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)
    
    // Cache for custom fonts to avoid reloading
    const customFonts = {}

    // Helper function to get font
    const getFont = async (fontFamily, fontWeight) => {
      const family = fontFamily?.toLowerCase() || ''
      const weight = fontWeight?.toLowerCase() || 'normal'
      
      // Check for custom fonts first
      if (fontFamily === 'AmsterdamFour') {
        if (!customFonts['AmsterdamFour']) {
          const loaded = await loadCustomFont(pdfDoc, 'AmsterdamFour')
          if (loaded) customFonts['AmsterdamFour'] = loaded
        }
        if (customFonts['AmsterdamFour']) return customFonts['AmsterdamFour']
      }
      
      if (family.includes('times') || family.includes('serif') || family.includes('roman')) {
        if (family.includes('italic')) return timesRomanItalicFont
        return weight === 'bold' ? timesRomanBoldFont : timesRomanFont
      }
      return weight === 'bold' ? helveticaBoldFont : helveticaFont
    }
    
    // Helper function to get color
    const getColor = (colorConfig) => {
      if (!colorConfig) return rgb(0, 0, 0)
      if (typeof colorConfig === 'string') {
        // Parse hex color like "#000000"
        if (colorConfig.startsWith('#')) {
          const r = parseInt(colorConfig.slice(1, 3), 16) / 255
          const g = parseInt(colorConfig.slice(3, 5), 16) / 255
          const b = parseInt(colorConfig.slice(5, 7), 16) / 255
          return rgb(r, g, b)
        }
      }
      if (typeof colorConfig === 'object' && colorConfig.r !== undefined) {
        return rgb(colorConfig.r, colorConfig.g, colorConfig.b)
      }
      return rgb(0, 0, 0)
    }
    
    // Helper function to draw centered text
    const drawCenteredText = (page, text, x, y, fontSize, font, color) => {
      const textWidth = font.widthOfTextAtSize(text, fontSize)
      page.drawText(text, {
        x: x - textWidth / 2,
        y: y,
        size: fontSize,
        font: font,
        color: color
      })
    }
    
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
    
    // Use provided positions
    const positions = textPositions || {}
    
    // Helper to safely draw text with coordinate conversion
    const safeDrawText = async (pos, text, label) => {
      if (!pos) {
        console.warn(`No position config for ${label}`)
        return false
      }
      if (!text || text.trim() === '') {
        console.warn(`No text provided for ${label}`)
        return false
      }
      
      // PDF coordinates: (0,0) is bottom-left, y increases upward
      // Positions are given as top-down (y from top), so convert: pdfY = height - pos.y
      const pdfY = height - pos.y
      
      // For center alignment, use actual PDF center if x is set to center value
      // This ensures perfect centering regardless of PDF dimensions
      let xPos = pos.x
      if (pos.align === 'center') {
        // If x is close to center (within 10 points), use actual PDF center
        const pdfCenter = width / 2
        if (Math.abs(pos.x - 505.5) < 10 || Math.abs(pos.x - 422) < 10) {
          xPos = pdfCenter
          console.log(`Using PDF center (${pdfCenter.toFixed(1)}) for ${label} instead of ${pos.x}`)
        }
      }
      
      // Validate coordinates
      if (pdfY < 0 || pdfY > height) {
        console.warn(`Y position (${pos.y} -> PDF: ${pdfY}) is outside page bounds (height: ${height})`)
        return false
      }
      
      const font = await getFont(pos.fontFamily, pos.fontWeight)
      const color = getColor(pos.color)
      
      try {
        if (pos.align === 'center') {
          drawCenteredText(firstPage, text, xPos, pdfY, pos.fontSize, font, color)
        } else if (pos.align === 'right') {
          const textWidth = font.widthOfTextAtSize(text, pos.fontSize)
          firstPage.drawText(text, {
            x: xPos - textWidth,
            y: pdfY,
            size: pos.fontSize,
            font: font,
            color: color
          })
        } else {
          firstPage.drawText(text, {
            x: xPos,
            y: pdfY,
            size: pos.fontSize,
            font: font,
            color: color
          })
        }
        console.log(`✓ Overlaid ${label}: "${text}" at (${xPos.toFixed(1)}, ${pdfY.toFixed(1)}) [from top: ${pos.y}], fontSize: ${pos.fontSize}`)
        return true
      } catch (drawError) {
        console.error(`Error drawing text for ${label}:`, drawError)
        return false
      }
    }
    
    // Professional Certificate Text Overlay (template is blank)
    // Order: CERTIFICATE (bold) → Certificate of Completion (small) → rest
    console.log('=== OVERLAYING CERTIFICATE TEXT ===')
    console.log('Certificate data:', certificate)
    
    // 1. Main Title - "CERTIFICATE" (large, bold - FIRST)
    if (positions.mainTitle) {
      await safeDrawText(positions.mainTitle, 'CERTIFICATE', 'main title')
    }
    
    // 2. Certificate Title Header - "CERTIFICATE OF COMPLETION" or custom text
    if (positions.certificateTitle) {
      const titleText = positions.certificateTitle.text || 'CERTIFICATE OF COMPLETION'
      await safeDrawText(positions.certificateTitle, titleText, 'certificate title')
    }
    
    // 3. Presented To Text
    if (positions.presentedTo) {
      await safeDrawText(positions.presentedTo, 'This certificate is awarded to', 'presented to')
    }
    
    // 4. Student Name (DYNAMIC)
    if (positions.studentName && certificate.studentName) {
      await safeDrawText(positions.studentName, certificate.studentName, 'student name')
    }
    
    // 5. Description / Completing text
    if (positions.completingText) {
      const descText = `For successfully completing`
      await safeDrawText(positions.completingText, descText, 'completing text')
    }
    
    // 6. Course Name (DYNAMIC)
    if (positions.courseType && certificate.courseType) {
      const courseText = certificate.courseType || certificate.courseName || ''
      await safeDrawText(positions.courseType, courseText, 'course name')
    }
    
    // 7. Cohort (DYNAMIC)
    if (positions.cohort && certificate.cohort) {
      const cohortText = certificate.cohort.startsWith('Cohort') 
        ? certificate.cohort 
        : `Cohort: ${certificate.cohort}`
      await safeDrawText(positions.cohort, cohortText, 'cohort')
    }
    
    // 8. Issue Date (DYNAMIC)
    if (positions.issueDate && certificate.issueDate) {
      await safeDrawText(positions.issueDate, issueDate, 'issue date')
    }
    
    // 9. Signature Titles (DYNAMIC, if provided)
    if (positions.signerTitle1 && certificate.signerTitle1) {
      await safeDrawText(positions.signerTitle1, certificate.signerTitle1, 'signer title 1')
    }
    if (positions.signerTitle2 && certificate.signerTitle2) {
      await safeDrawText(positions.signerTitle2, certificate.signerTitle2, 'signer title 2')
    }
    
    // Generate and embed QR code for verification
    try {
      const verificationUrl = `${window.location.origin}/verify/${certificate.id}`
      console.log('Generating QR code for:', verificationUrl)
      
      // Generate QR code as PNG data URL
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      // Convert data URL to PNG image
      const qrCodeImageBytes = await fetch(qrCodeDataUrl).then(res => res.arrayBuffer())
      const qrCodeImage = await pdfDoc.embedPng(qrCodeImageBytes)
      
      // Calculate QR code size (make it smaller, about 70-80 points to fit nicely)
      const qrSize = 70
      const qrX = 50 // Left side margin (50 points from left edge)
      const qrY = 50 // Bottom-left area (50 points from bottom)
      
      // Draw QR code on the bottom-left corner
      firstPage.drawImage(qrCodeImage, {
        x: qrX,
        y: qrY,
        width: qrSize,
        height: qrSize
      })
      
      console.log(`✓ QR code embedded at bottom-left (${qrX}, ${qrY}), size: ${qrSize}x${qrSize}`)
    } catch (qrError) {
      console.warn('Failed to generate QR code:', qrError)
      // Continue without QR code if generation fails
    }
    
    console.log('=== OVERLAY COMPLETE ===')
    
    // Set deterministic metadata to ensure consistent hashing
    // Use a fixed date so PDFs with same content have same hash
    const fixedDate = new Date('2025-01-01T00:00:00Z')
    pdfDoc.setCreationDate(fixedDate)
    pdfDoc.setModificationDate(fixedDate)
    // Set title to certificate ID for consistency
    pdfDoc.setTitle(`Certificate ${certificate.id}`)
    pdfDoc.setAuthor('Bitcoin Dada')
    pdfDoc.setSubject('Digital Certificate')
    pdfDoc.setProducer('Bitcoin Dada Certificate System')
    
    // Serialize PDF to bytes
    console.log('Saving PDF with text overlay...')
    const savedPdfBytes = await pdfDoc.save({
      useObjectStreams: false // Disable object streams for more deterministic output
    })
    console.log('PDF saved, size:', savedPdfBytes.length, 'bytes')
    
    // Convert to Blob
    const blob = new Blob([savedPdfBytes], { type: 'application/pdf' })
    console.log('PDF Blob created, size:', blob.size, 'bytes')
    
    if (blob.size === 0) {
      throw new Error('Generated PDF is empty')
    }
    
    return blob
  } catch (error) {
    console.error('Error overlaying text on PDF:', error)
    console.error('Error stack:', error.stack)
    throw new Error(`Failed to overlay text on PDF: ${error.message}`)
  }
}

/**
 * Generate certificate PDF from template
 * 
 * @param {string} templatePath - Path to PDF template
 * @param {object} certificate - Certificate data
 * @param {object} textPositions - Optional text positions configuration
 * @returns {Promise<Blob>} - Generated PDF as Blob
 */
export async function generateCertificatePDF(templatePath, certificate, textPositions) {
  try {
    console.log('Loading PDF template...')
    const pdfBytes = await loadPDFTemplate(templatePath)
    
    console.log('Overlaying text on PDF...')
    const pdfBlob = await overlayTextOnPDF(pdfBytes, certificate, textPositions)
    
    console.log('PDF generated successfully, size:', pdfBlob.size, 'bytes')
    return pdfBlob
  } catch (error) {
    console.error('Error generating certificate PDF:', error)
    throw error
  }
}

/**
 * Download PDF file
 * 
 * @param {Blob} pdfBlob - PDF file as Blob
 * @param {string} filename - Filename for download
 */
export function downloadPDF(pdfBlob, filename) {
  const url = URL.createObjectURL(pdfBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'certificate.pdf'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

