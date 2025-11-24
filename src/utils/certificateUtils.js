import CryptoJS from 'crypto-js'

/**
 * Generate a unique certificate ID
 * Format: DD-YYYY-XXXXXX (e.g., DD-2025-8F32C1)
 */
export function generateCertificateId() {
  const year = new Date().getFullYear()
  const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase()
  return `DD-${year}-${randomHex}`
}

/**
 * Create a digital signature (SHA-256 hash) of certificate data
 */
export function createDigitalSignature(certificateData) {
  const dataString = JSON.stringify({
    id: certificateData.id,
    studentName: certificateData.studentName,
    cohort: certificateData.cohort,
    courseType: certificateData.courseType,
    certificateType: certificateData.certificateType || 'Certificate of Completion',
    issueDate: certificateData.issueDate,
  })
  
  return CryptoJS.SHA256(dataString).toString()
}

/**
 * Store certificate in localStorage (in production, use a database)
 */
export function saveCertificate(certificate) {
  const certificates = getStoredCertificates()
  certificates.push(certificate)
  localStorage.setItem('dadadigital_certificates', JSON.stringify(certificates))
  return certificate
}

/**
 * Get all stored certificates
 */
export function getStoredCertificates() {
  const stored = localStorage.getItem('dadadigital_certificates')
  return stored ? JSON.parse(stored) : []
}

/**
 * Find certificate by ID
 */
export function getCertificateById(certificateId) {
  const certificates = getStoredCertificates()
  return certificates.find(cert => cert.id === certificateId)
}

/**
 * Revoke a certificate
 * Sets status to 'revoked' and updates storage
 */
export function revokeCertificate(certificateId) {
  const certificates = getStoredCertificates()
  const index = certificates.findIndex(cert => cert.id === certificateId)
  
  if (index !== -1) {
    certificates[index].status = 'revoked'
    certificates[index].revokedAt = new Date().toISOString()
    localStorage.setItem('dadadigital_certificates', JSON.stringify(certificates))
    console.log(`Certificate ${certificateId} has been revoked`)
    return true
  }
  return false
}

/**
 * Verify certificate authenticity
 */
export function verifyCertificate(certificate) {
  if (!certificate) {
    return {
      isValid: false,
      reason: 'Certificate not found'
    }
  }

  // Check if revoked
  if (certificate.status === 'revoked') {
    return {
      isValid: false,
      isRevoked: true,
      certificate: certificate,
      reason: 'This certificate has been revoked and is no longer valid.'
    }
  }

  // Recalculate signature from stored data
  const expectedSignature = createDigitalSignature(certificate)
  
  // Compare with stored signature
  const isSignatureValid = certificate.signature === expectedSignature
  
  return {
    isValid: isSignatureValid,
    expectedSignature,
    actualSignature: certificate.signature,
    certificate: certificate,
    reason: isSignatureValid 
      ? 'Certificate is authentic' 
      : 'Certificate data has been tampered with'
  }
}

/**
 * Calculate SHA-256 hash of a PDF file (ArrayBuffer, Blob, or File)
 * Returns a Promise that resolves to the hash string
 * 
 * IMPORTANT: This function ensures consistent hashing by:
 * 1. Converting all inputs to ArrayBuffer
 * 2. Hashing the exact binary data
 * 3. Using SHA-256 for deterministic results
 */
export async function hashPDF(pdfData) {
  // Convert to ArrayBuffer - ensure we're hashing raw bytes
  let arrayBuffer
  if (pdfData instanceof File || pdfData instanceof Blob) {
    arrayBuffer = await pdfData.arrayBuffer()
  } else if (pdfData instanceof ArrayBuffer) {
    arrayBuffer = pdfData
  } else {
    throw new Error(`Invalid PDF data type. Expected Blob, File, or ArrayBuffer. Got: ${typeof pdfData}`)
  }

  // Log for debugging
  console.log(`[hashPDF] Input type: ${pdfData.constructor.name}`)
  console.log(`[hashPDF] ArrayBuffer size: ${arrayBuffer.byteLength} bytes`)

  // Use Web Crypto API for hashing - this is deterministic
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  console.log(`[hashPDF] Hash calculated: ${hashHex}`)
  console.log(`[hashPDF] Hash length: ${hashHex.length} characters`)
  
  return hashHex
}

/**
 * Update certificate with PDF hash
 * This stores the hash of the original PDF for tamper detection
 */
export function updateCertificatePDFHash(certificateId, pdfHash) {
  if (!certificateId || !pdfHash) {
    console.error('updateCertificatePDFHash: Missing certificateId or pdfHash')
    return null
  }

  const certificates = getStoredCertificates()
  const index = certificates.findIndex(cert => cert.id === certificateId)
  
  if (index !== -1) {
    certificates[index].pdfHash = pdfHash
    certificates[index].pdfHashStoredAt = new Date().toISOString()
    localStorage.setItem('dadadigital_certificates', JSON.stringify(certificates))
    console.log(`PDF hash stored for certificate ${certificateId}:`, pdfHash.substring(0, 16) + '...')
    return certificates[index]
  }
  
  console.warn(`Certificate ${certificateId} not found when trying to store PDF hash`)
  return null
}

/**
 * Get PDF hash for a certificate
 */
export function getCertificatePDFHash(certificateId) {
  const certificate = getCertificateById(certificateId)
  return certificate?.pdfHash || null
}

/**
 * Find certificate by PDF hash
 */
export function getCertificateByPDFHash(pdfHash) {
  const certificates = getStoredCertificates()
  return certificates.find(cert => cert.pdfHash === pdfHash)
}

/**
 * Verify PDF hash by searching all certificates
 */
export function verifyPDFHashByHash(uploadedPDFHash) {
  console.log('=== VERIFICATION DEBUG ===')
  console.log('Searching for hash:', uploadedPDFHash)
  console.log('Hash length:', uploadedPDFHash.length)
  
  const certificates = getStoredCertificates()
  console.log(`Searching through ${certificates.length} certificates`)
  
  // Log all stored hashes for debugging with exact comparison
  let foundMatch = false
  certificates.forEach((cert, idx) => {
    if (cert.pdfHash) {
      const matches = cert.pdfHash === uploadedPDFHash
      console.log(`Certificate ${idx + 1}: ${cert.id} (${cert.studentName})`)
      console.log(`  Stored hash: ${cert.pdfHash}`)
      console.log(`  Uploaded hash: ${uploadedPDFHash}`)
      console.log(`  Match: ${matches ? '✓ YES' : '✗ NO'}`)
      if (matches) {
        foundMatch = true
      }
    } else {
      console.log(`Certificate ${idx + 1}: ${cert.id} - NO PDF HASH STORED`)
    }
  })
  
  const certificate = getCertificateByPDFHash(uploadedPDFHash)
  
  if (!certificate) {
    console.log('=== NO MATCH FOUND ===')
    return {
      isValid: false,
      certificate: null,
      expectedHash: null,
      actualHash: uploadedPDFHash,
      reason: 'PDF hash not found in our records. This PDF may not be an original certificate or may have been modified.'
    }
  }

  // Check if revoked
  if (certificate.status === 'revoked') {
    console.log('=== CERTIFICATE REVOKED ===')
    return {
      isValid: false,
      isRevoked: true,
      certificate: certificate,
      expectedHash: certificate.pdfHash,
      actualHash: uploadedPDFHash,
      reason: 'This certificate has been revoked and is no longer valid.'
    }
  }

  const isHashValid = certificate.pdfHash === uploadedPDFHash
  console.log(`=== VERIFICATION RESULT ===`)
  console.log(`Hash match: ${isHashValid}`)
  console.log(`Expected (full): ${certificate.pdfHash}`)
  console.log(`Actual (full): ${uploadedPDFHash}`)
  console.log(`Strings equal: ${certificate.pdfHash === uploadedPDFHash}`)
  console.log(`=== END DEBUG ===`)
  
  return {
    isValid: isHashValid,
    certificate: certificate,
    expectedHash: certificate.pdfHash,
    actualHash: uploadedPDFHash,
    reason: isHashValid 
      ? 'PDF is authentic and has not been tampered with' 
      : 'PDF hash mismatch - the file has been modified or is not the original'
  }
}

/**
 * Verify PDF hash against stored certificate (legacy function - kept for backward compatibility)
 */
export function verifyPDFHash(certificateId, uploadedPDFHash) {
  const certificate = getCertificateById(certificateId)
  
  if (!certificate) {
    return {
      isValid: false,
      reason: 'Certificate not found'
    }
  }

  if (!certificate.pdfHash) {
    return {
      isValid: false,
      reason: 'No PDF hash stored for this certificate. PDF may have been generated before hash verification was implemented.'
    }
  }

  const isHashValid = certificate.pdfHash === uploadedPDFHash
  
  return {
    isValid: isHashValid,
    certificate: certificate,
    expectedHash: certificate.pdfHash,
    actualHash: uploadedPDFHash,
    reason: isHashValid 
      ? 'PDF is authentic and has not been tampered with' 
      : 'PDF hash mismatch - the file has been modified or is not the original'
  }
}

