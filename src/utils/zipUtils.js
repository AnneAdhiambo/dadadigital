/**
 * ZIP Utility for creating ZIP files from certificate PDFs
 * 
 * Uses JSZip library to create ZIP archives
 */

/**
 * Create a ZIP file from multiple PDF blobs
 * @param {Array<Object>} certificates - Array of objects with { id, pdfBlob, studentName }
 * @param {Function} onProgress - Optional progress callback (current, total)
 * @returns {Promise<Blob>} ZIP file as Blob
 */
export async function createZipFromCertificates(certificates, onProgress = null) {
  try {
    // Dynamically import JSZip
    const JSZip = (await import('jszip')).default
    
    const zip = new JSZip()
    const total = certificates.length

    for (let i = 0; i < certificates.length; i++) {
      const cert = certificates[i]
      
      if (!cert.pdfBlob) {
        console.warn(`Certificate ${cert.id} has no PDF blob, skipping`)
        continue
      }

      // Generate filename
      const studentName = cert.studentName || 'Unknown'
      const sanitizedName = studentName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      const filename = `Certificate_${sanitizedName}_${cert.id}.pdf`

      // Add PDF to ZIP
      zip.file(filename, cert.pdfBlob)

      // Report progress
      if (onProgress) {
        onProgress(i + 1, total)
      }
    }

    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })

    return zipBlob
  } catch (error) {
    console.error('Error creating ZIP file:', error)
    throw new Error(`Failed to create ZIP file: ${error.message}`)
  }
}

/**
 * Download a ZIP file
 * @param {Blob} zipBlob - ZIP file as Blob
 * @param {string} filename - Filename for download (default: certificates.zip)
 */
export function downloadZip(zipBlob, filename = 'certificates.zip') {
  try {
    const url = URL.createObjectURL(zipBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading ZIP file:', error)
    throw new Error(`Failed to download ZIP file: ${error.message}`)
  }
}

/**
 * Create and download ZIP file from certificates
 * @param {Array<Object>} certificates - Array of certificate objects with PDF blobs
 * @param {string} filename - Optional filename for ZIP
 * @param {Function} onProgress - Optional progress callback
 */
export async function createAndDownloadZip(certificates, filename = null, onProgress = null) {
  try {
    if (!certificates || certificates.length === 0) {
      throw new Error('No certificates provided')
    }

    const zipBlob = await createZipFromCertificates(certificates, onProgress)
    const zipFilename = filename || `certificates_${new Date().toISOString().split('T')[0]}.zip`
    downloadZip(zipBlob, zipFilename)
    
    return zipBlob
  } catch (error) {
    console.error('Error creating and downloading ZIP:', error)
    throw error
  }
}

