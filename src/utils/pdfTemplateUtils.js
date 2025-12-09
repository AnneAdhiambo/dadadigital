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
import { getTemplate } from './templateUtils'
import { getFontFilename } from './fontUtils'
import { getSignatureById } from './signatureUtils'

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
 * Load a custom font from assets
 */
async function loadCustomFont(pdfDoc, fontName) {
  try {
    console.log(`Attempting to load custom font: ${fontName}`)
    
    if (!fontName) return null
    
    // Get font filename
    const filename = getFontFilename(fontName)
    if (!filename) {
      console.warn(`Could not determine filename for font: ${fontName}`)
      return null
    }
    
    // Try loading from assets/fonts (Vite handles this)
    const pathsToTry = [
      `/src/assets/fonts/${filename}`,
      `./assets/fonts/${filename}`,
      `/fonts/${filename}`,
      `/templates/${filename}` // Fallback to public templates
    ]
    
    let fontBytes = null
    for (const path of pathsToTry) {
      try {
        const response = await fetch(path)
        if (response.ok) {
          fontBytes = await response.arrayBuffer()
          break
        }
      } catch (e) {
        continue
      }
    }
    
    if (!fontBytes) {
      // Try importing as module (Vite)
      try {
        // @vite-ignore - Dynamic font loading is intentional
        const fontModule = await import(/* @vite-ignore */ `../assets/fonts/${filename}?url`)
        const response = await fetch(fontModule.default)
        fontBytes = await response.arrayBuffer()
      } catch (e) {
        console.warn(`Could not load font ${fontName} from any path`)
        return null
      }
    }

    pdfDoc.registerFontkit(fontkit)
    const customFont = await pdfDoc.embedFont(fontBytes)
    console.log(`Successfully embedded custom font: ${fontName}`)
    return customFont
  } catch (error) {
    console.warn(`Could not load custom font ${fontName}, falling back to standard font. Error:`, error.message)
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
 * Generate PDF from PNG template image
 * 
 * @param {string} templateData - Blob URL of PNG template image (from local /templates/ directory)
 * @param {object} certificate - Certificate data object
 * @param {string} templateId - Template ID to get text positions configuration
 * @param {object} templateConfigOverride - Optional template config to use instead of loading from storage
 * @returns {Promise<Blob>} - Generated PDF as Blob
 */
export async function generatePDFFromPNGTemplate(templateData, certificate, templateId, templateConfigOverride = null) {
  try {
    console.log('Generating PDF from PNG template, certificate data:', {
      studentName: certificate.studentName,
      courseType: certificate.courseType,
      cohort: certificate.cohort
    })
    
    // Load PNG image - handle both data URLs and blob URLs
    console.log('Loading PNG image...')
    let imageBytes = null
    
    // Check if it's a data URL (starts with data:image)
    if (typeof templateData === 'string' && templateData.startsWith('data:image')) {
      console.log('Detected data URL, converting directly...')
      // Convert data URL to ArrayBuffer
      const base64Data = templateData.split(',')[1]
      if (base64Data) {
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        imageBytes = bytes.buffer
      } else {
        throw new Error('Invalid data URL format')
      }
    } else {
      // It's a blob URL or regular URL - fetch it
      console.log('Fetching image from URL...')
      const imageResponse = await fetch(templateData)
      if (!imageResponse.ok) {
        throw new Error(`Failed to load PNG image: ${imageResponse.status} ${imageResponse.statusText}`)
      }
      imageBytes = await imageResponse.arrayBuffer()
    }
    
    // Create new PDF document
    const pdfDoc = await PDFDocument.create()
    
    // Get template configuration for text positions
    // Use override if provided (for preview generation), otherwise load from storage
    const templateConfig = templateConfigOverride || getTemplate(templateId)
    
    // Embed PNG image
    const pngImage = await pdfDoc.embedPng(imageBytes)
    const pngDims = pngImage.scale(1)
    
    // Use stored image dimensions if available, otherwise use detected PNG dimensions
    // This ensures coordinates match exactly between preview and PDF
    // Priority: templateConfig dimensions > PNG dimensions
    const targetWidth = templateConfig.imageWidth || pngDims.width
    const targetHeight = templateConfig.imageHeight || pngDims.height
    
    // Create page with exact dimensions from template config (or PNG if not available)
    const page = pdfDoc.addPage([targetWidth, targetHeight])
    const width = targetWidth
    const height = targetHeight
    console.log(`PDF page size: ${width} x ${height} points (template: ${templateConfig.imageWidth || 'N/A'} x ${templateConfig.imageHeight || 'N/A'}, PNG: ${pngDims.width} x ${pngDims.height})`)
    
    // Draw PNG as background - scale to fit page dimensions exactly
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: width,
      height: height
    })
    
    // Calculate scaling factors if template dimensions differ from PNG dimensions
    // This handles cases where stored dimensions don't match actual PNG size
    const canvasWidth = templateConfig.imageWidth || width  // Use stored width or actual page width
    const canvasHeight = templateConfig.imageHeight || height  // Use stored height or actual page height
    
    // If canvas dimensions match PDF dimensions exactly, no scaling needed (1:1 mapping)
    // Otherwise, scale proportionally (for legacy templates that used different dimensions)
    const scaleX = canvasWidth && canvasWidth > 0 ? width / canvasWidth : 1
    const scaleY = canvasHeight && canvasHeight > 0 ? height / canvasHeight : 1
    console.log(`Coordinate scaling: canvas (${canvasWidth}x${canvasHeight}) -> PDF (${width}x${height}), scale: (${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`)
    
    // If dimensions match exactly, coordinates should be 1:1 (no scaling)
    if (Math.abs(scaleX - 1) < 0.001 && Math.abs(scaleY - 1) < 0.001) {
      console.log('✓ Canvas and PDF dimensions match exactly - using 1:1 coordinate mapping')
    }
    
    // Get text positions - ONLY use elements array, NEVER use textPositions
    // This ensures template manager output is exactly what gets rendered
    let textPositions = {}
    if (templateConfig.elements && templateConfig.elements.length > 0) {
      // Use ONLY elements array - ignore textPositions completely
      console.log('Using elements array for template rendering (ignoring textPositions completely)')
      templateConfig.elements.forEach(element => {
        if (element.type === 'text' && element.field) {
          const fieldKey = element.field === 'custom' 
            ? `custom_${element.id}` 
            : element.field
          textPositions[fieldKey] = {
            x: element.x * scaleX,  // Scale X coordinate
            y: element.y * scaleY,  // Scale Y coordinate
            fontSize: element.fontSize * Math.min(scaleX, scaleY),  // Scale font size proportionally
            fontWeight: element.fontWeight || 'normal',
            fontFamily: element.fontFamily || templateConfig.fontName || 'Arial',
            fill: element.color || '#000000',
            align: element.align || 'center',  // Default to center alignment
            customText: element.field === 'custom' ? element.customText : undefined
          }
        }
      })
    } else {
      // NO fallback to textPositions - if no elements, render nothing
      // This ensures only what's in template manager gets rendered
      console.log('Template has no elements array - rendering only background image (no text)')
    }
    console.log(`Text positions config (scaled):`, textPositions)
    
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
      
      // Check for custom fonts first (handle various font name formats)
      const fontName = fontFamily || templateConfig.fontName || ''
      const fontNameLower = fontName.toLowerCase()
      
      // Web fonts (Montserrat, Poppins, Open Sans) fall back to Helvetica for PDF
      const webFonts = ['montserrat', 'poppins', 'open sans']
      if (webFonts.some(wf => fontNameLower.includes(wf))) {
        // Use Helvetica as fallback for web fonts in PDF
        return weight === 'bold' || weight === '700' || weight === '600' 
          ? helveticaBoldFont 
          : helveticaFont
      }
      
      if (fontName && (fontName.includes('Amsterdam') || fontName.includes('BrightWall') || fontName.includes('Brightwall'))) {
        // Use the actual font name as the key for caching
        const fontKey = fontName
        if (!customFonts[fontKey]) {
          const loaded = await loadCustomFont(pdfDoc, fontName)
          if (loaded) customFonts[fontKey] = loaded
        }
        if (customFonts[fontKey]) return customFonts[fontKey]
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
        // Parse hex color like "#000000" or "fill" property
        if (colorConfig.startsWith('#')) {
          const r = parseInt(colorConfig.slice(1, 3), 16) / 255
          const g = parseInt(colorConfig.slice(3, 5), 16) / 255
          const b = parseInt(colorConfig.slice(5, 7), 16) / 255
          return rgb(r, g, b)
        }
        // Handle color names
        if (colorConfig === 'black' || colorConfig === '#000000') return rgb(0, 0, 0)
        if (colorConfig === 'gray' || colorConfig === '#666666') return rgb(0.4, 0.4, 0.4)
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
    
    // Helper to safely draw text with coordinate conversion
    // CRITICAL: HTML preview uses CSS transforms for centering:
    // - transform: translate(-50%, -50%) centers text at (x, y)
    // - This means (x, y) is the CENTER of the text element
    // - PDF needs to match this exactly for WYSIWYG
    const safeDrawText = async (pos, text, label) => {
      if (!pos) {
        console.warn(`No position config for ${label}`)
        return false
      }
      if (!text || text.trim() === '') {
        console.warn(`No text provided for ${label}`)
        return false
      }
      
      const fontSize = pos.fontSize || pos.size || 12
      const font = await getFont(pos.fontFamily || pos.font, pos.fontWeight || pos.weight)
      const color = getColor(pos.color || pos.fill)
      
      // HTML preview uses: top: y, left: x with transform: translate(-50%, -50%)
      // This means (x, y) is the CENTER of the text element
      // PDF coordinates: (0,0) is bottom-left, y increases upward
      // We need to convert from HTML top-left origin to PDF bottom-left origin
      
      // Convert Y coordinate: HTML top = 0, PDF bottom = 0
      // HTML y is the center of the text (due to translate(-50%, -50%))
      // PDF y is the baseline
      // For exact matching, we need to account for:
      // 1. Y coordinate flip: height - y (converts top-left to bottom-left origin)
      // 2. Text center to baseline: For most fonts, baseline is approximately fontSize * 0.8 below the center
      // Formula: pdfY = height - pos.y - (fontSize * 0.8)
      const pdfY = height - pos.y - (fontSize * 0.8)
      
      // Handle X alignment - HTML uses transform, PDF needs manual calculation
      const textWidth = font.widthOfTextAtSize(text, fontSize)
      let pdfX
      
      if (pos.align === 'center') {
        // HTML: left: x, transform: translate(-50%, -50%) means x is the center
        // PDF: Use x as center, subtract half text width
        pdfX = pos.x - textWidth / 2
      } else if (pos.align === 'right') {
        // HTML: left: x, transform: translate(-100%, -50%) means x is the right edge
        // PDF: Use x as right edge, subtract full text width
        pdfX = pos.x - textWidth
      } else {
        // HTML: left: x, transform: translate(0, -50%) means x is the left edge
        // PDF: Use x directly as left edge
        pdfX = pos.x
      }
      
      // Validate coordinates
      if (pdfY < 0 || pdfY > height) {
        console.warn(`Y position (${pos.y} -> PDF: ${pdfY}) is outside page bounds (height: ${height})`)
        return false
      }
      
      try {
        page.drawText(text, {
          x: pdfX,
          y: pdfY,
          size: fontSize,
          font: font,
          color: color
        })
        console.log(`✓ Overlaid ${label}: "${text}" at PDF(${pdfX.toFixed(1)}, ${pdfY.toFixed(1)}) [HTML: (${pos.x}, ${pos.y})], fontSize: ${fontSize}, align: ${pos.align || 'left'}`)
        return true
      } catch (drawError) {
        console.error(`Error drawing text for ${label}:`, drawError)
        return false
      }
    }
    
    // Overlay certificate text using template text positions
    console.log('=== OVERLAYING CERTIFICATE TEXT ===')
    console.log('Certificate data:', certificate)
    console.log('Template elements:', templateConfig.elements)
    
    // If template uses elements array, render ALL elements exactly as defined in template manager
    if (templateConfig.elements && templateConfig.elements.length > 0) {
      console.log('Rendering all elements from template manager')
      
      // Define placeholder text for blueprint mode (templates should always render)
      const placeholders = {
        studentName: 'Student Name',
        courseType: 'Course Type',
        cohort: 'Cohort 2025-01',
        certificateType: 'Certificate of Completion',
        issueDate: issueDate, // Use formatted date as placeholder
        signerName: 'Lead Instructor',
        signerTitle: 'Course Director'
      }
      
      // Process all text elements from the template manager
      // ALWAYS render elements - templates act as blueprints showing where data goes
      for (const element of templateConfig.elements) {
        if (element.type === 'text' && element.field) {
          // Get the text value - use certificate data if available, otherwise use placeholder
          let textValue = null
          
          if (element.field === 'custom') {
            // Custom text - always use the customText value (blueprint shows custom text)
            textValue = element.customText || 'Custom Text'
          } else {
            // Standard field - get value from certificate data or use placeholder
            const fieldValue = certificate[element.field]
            
            if (fieldValue) {
              // Format the value based on field type
              if (element.field === 'issueDate') {
                textValue = issueDate
              } else if (element.field === 'cohort') {
                // Don't add "Cohort:" prefix - use as is
                textValue = fieldValue
              } else {
                textValue = fieldValue
              }
            } else {
              // No certificate data - use placeholder to show blueprint
              textValue = placeholders[element.field] || 'Sample Text'
            }
          }
          
          // ALWAYS render - templates are blueprints that show where data will go
          const fieldKey = element.field === 'custom' 
            ? `custom_${element.id}` 
            : element.field
          
          // Ensure textValue is never null/undefined - always use placeholder if missing
          if (!textValue) {
            textValue = placeholders[element.field] || element.customText || 'Sample Text'
          }
          
          // Render if textPositions exists for this fieldKey (it should, since we created it from elements)
          if (textPositions[fieldKey]) {
            await safeDrawText(
              textPositions[fieldKey],
              textValue,
              `${element.field} (from template manager - blueprint mode)`
            )
          } else {
            console.warn(`Missing textPositions for fieldKey: ${fieldKey}, element:`, element)
          }
        }
      }
    } else {
      // Legacy mode: use hardcoded field rendering for backward compatibility
      console.log('Using legacy textPositions rendering')
      const positions = textPositions
      
      // Draw certificate type (if configured)
      if (positions.certificateType && certificate.certificateType) {
        await safeDrawText(positions.certificateType, certificate.certificateType, 'certificate type')
      }
      
      // Draw student name (required)
      if (positions.studentName && certificate.studentName) {
        await safeDrawText(positions.studentName, certificate.studentName, 'student name')
      }
      
      // Draw course type (required)
      if (positions.courseType && certificate.courseType) {
        await safeDrawText(positions.courseType, certificate.courseType, 'course name')
      }
      
      // Draw cohort (if configured)
      if (positions.cohort && certificate.cohort) {
        const cohortText = certificate.cohort.startsWith('Cohort') 
          ? certificate.cohort 
          : `Cohort: ${certificate.cohort}`
        await safeDrawText(positions.cohort, cohortText, 'cohort')
      }
      
      // Draw issue date (if configured)
      if (positions.issueDate && certificate.issueDate) {
        await safeDrawText(positions.issueDate, issueDate, 'issue date')
      }
      
      // Draw signer name (if configured)
      if (positions.signerName && certificate.instructor) {
        await safeDrawText(positions.signerName, certificate.instructor, 'signer name')
      }
      
      // Draw signer title (if configured)
      if (positions.signerTitle && certificate.instructor) {
        const signerTitle = certificate.signerTitle || 'Lead Instructor'
        await safeDrawText(positions.signerTitle, signerTitle, 'signer title')
      }
    }
    
    // Handle signature elements (if template uses elements array)
    if (templateConfig.elements && templateConfig.elements.length > 0) {
      const signatureElements = templateConfig.elements.filter(el => el.type === 'signature')
      console.log(`Found ${signatureElements.length} signature element(s) to render`)
      
      for (const sigElement of signatureElements) {
        try {
          let signatureData = sigElement.signatureData
          
          // If signatureData is not directly on element, try to load it from signatureId
          if (!signatureData && sigElement.signatureId) {
            console.log(`Loading signature by ID: ${sigElement.signatureId}`)
            const signature = getSignatureById(sigElement.signatureId)
            if (signature && signature.signatureData) {
              signatureData = signature.signatureData
              console.log(`✓ Signature loaded from ID: ${sigElement.signatureId}`)
            } else {
              console.warn(`Signature not found for ID: ${sigElement.signatureId}`)
            }
          }
          
          if (signatureData) {
            let sigImageBytes = null
            
            // Handle base64 data URLs (data:image/png;base64,...)
            if (signatureData.startsWith('data:image')) {
              console.log(`Loading signature from base64 data URL`)
              // Extract base64 data from data URL
              const base64Data = signatureData.split(',')[1]
              if (base64Data) {
                // Convert base64 to ArrayBuffer
                const binaryString = atob(base64Data)
                const bytes = new Uint8Array(binaryString.length)
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i)
                }
                sigImageBytes = bytes.buffer
              } else {
                console.warn('Invalid base64 data URL format')
              }
            } else {
              // Handle regular URL
              console.log(`Loading signature image from URL: ${signatureData.substring(0, 50)}...`)
              try {
                const sigImageResponse = await fetch(signatureData)
                if (sigImageResponse.ok) {
                  sigImageBytes = await sigImageResponse.arrayBuffer()
                } else {
                  console.warn(`Failed to fetch signature image: ${sigImageResponse.status} ${sigImageResponse.statusText}`)
                }
              } catch (fetchError) {
                console.error('Error fetching signature image:', fetchError)
              }
            }
            
            if (sigImageBytes) {
              try {
                const sigImage = await pdfDoc.embedPng(sigImageBytes)
                
                // Scale signature dimensions
                const sigWidth = (sigElement.width || 200) * scaleX
                const sigHeight = (sigElement.height || 80) * scaleY
                // HTML uses transform: translate(-50%, -50%) which centers at (x, y)
                // PDF: x is center, y is center (after Y flip)
                const sigX = sigElement.x * scaleX - sigWidth / 2  // Center horizontally
                const sigY = height - (sigElement.y * scaleY) - sigHeight / 2  // Center vertically (Y flipped)
                
                page.drawImage(sigImage, {
                  x: sigX,
                  y: sigY,
                  width: sigWidth,
                  height: sigHeight
                })
                
                console.log(`✓ Signature embedded at (${sigX.toFixed(1)}, ${sigY.toFixed(1)}), size: ${sigWidth.toFixed(1)}x${sigHeight.toFixed(1)}`)
              } catch (embedError) {
                console.error('Error embedding signature image:', embedError)
              }
            }
          } else {
            console.warn(`Signature element has no signatureData or signatureId:`, sigElement)
          }
        } catch (sigError) {
          console.error('Failed to embed signature:', sigError)
        }
      }
    }
    
    // Generate and embed QR code for verification
    // Check if template has a QR code element positioned by user
    let qrCodeElement = null
    if (templateConfig.elements && templateConfig.elements.length > 0) {
      qrCodeElement = templateConfig.elements.find(el => el.type === 'qrcode')
    }
    
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
      
      // Use template element position if available, otherwise use default
      let qrSize, qrX, qrY
      if (qrCodeElement) {
        // Use user-defined position and size from template
        qrSize = (qrCodeElement.size || 70) * Math.min(scaleX, scaleY)
        qrX = qrCodeElement.x * scaleX - qrSize / 2  // Center the QR code
        qrY = height - (qrCodeElement.y * scaleY) - qrSize / 2  // Convert Y and center
        console.log(`Using template QR code position: (${qrCodeElement.x}, ${qrCodeElement.y}), size: ${qrCodeElement.size || 70}`)
      } else {
        // Default position (bottom-left corner)
        qrSize = 70
        qrX = 50
        qrY = 50
        console.log('Using default QR code position (bottom-left)')
      }
      
      // Draw QR code
      page.drawImage(qrCodeImage, {
        x: qrX,
        y: qrY,
        width: qrSize,
        height: qrSize
      })
      
      console.log(`✓ QR code embedded at (${qrX.toFixed(1)}, ${qrY.toFixed(1)}), size: ${qrSize.toFixed(1)}x${qrSize.toFixed(1)}`)
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
    console.error('Error generating PDF from PNG template:', error)
    console.error('Error stack:', error.stack)
    throw new Error(`Failed to generate PDF from PNG template: ${error.message}`)
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

