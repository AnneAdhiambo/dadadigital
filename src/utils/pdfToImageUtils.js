/**
 * Utility functions to convert PDF blobs to images for preview
 */

/**
 * Convert PDF blob to image data URL
 * @param {Blob} pdfBlob - PDF file as Blob
 * @param {number} scale - Scale factor for rendering (default: 2 for retina)
 * @returns {Promise<string>} - Data URL of the rendered image
 */
export async function pdfBlobToImage(pdfBlob, scale = 2) {
  try {
    // Dynamically import pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist')
    
    // Set worker source (required for pdf.js)
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
    
    // Convert blob to array buffer
    const arrayBuffer = await pdfBlob.arrayBuffer()
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    
    // Get first page
    const page = await pdf.getPage(1)
    
    // Get viewport with scale
    const viewport = page.getViewport({ scale })
    
    // Create canvas
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width
    
    // Render PDF page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    }
    
    await page.render(renderContext).promise
    
    // Convert canvas to data URL
    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Error converting PDF to image:', error)
    throw new Error(`Failed to convert PDF to image: ${error.message}`)
  }
}

/**
 * Convert PDF blob to image with specific dimensions (maintaining aspect ratio)
 * @param {Blob} pdfBlob - PDF file as Blob
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} maxHeight - Maximum height in pixels
 * @returns {Promise<string>} - Data URL of the rendered image
 */
export async function pdfBlobToImageSized(pdfBlob, maxWidth = 800, maxHeight = 600) {
  try {
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
    
    const arrayBuffer = await pdfBlob.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    const page = await pdf.getPage(1)
    
    // Get viewport to determine original dimensions
    const viewport = page.getViewport({ scale: 1 })
    const originalWidth = viewport.width
    const originalHeight = viewport.height
    
    // Calculate scale to fit within max dimensions while maintaining aspect ratio
    const scaleX = maxWidth / originalWidth
    const scaleY = maxHeight / originalHeight
    const scale = Math.min(scaleX, scaleY, 2) // Cap at 2x for quality
    
    // Get viewport with calculated scale
    const scaledViewport = page.getViewport({ scale })
    
    // Create canvas
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.height = scaledViewport.height
    canvas.width = scaledViewport.width
    
    // Render PDF page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport
    }
    
    await page.render(renderContext).promise
    
    // Convert canvas to data URL
    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Error converting PDF to image:', error)
    throw new Error(`Failed to convert PDF to image: ${error.message}`)
  }
}

