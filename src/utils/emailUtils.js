/**
 * Email utilities for sending certificates via EmailJS
 * 
 * This module handles sending certificate PDFs via email using EmailJS service.
 */

import emailjs from '@emailjs/browser'
import { populateTemplate } from './templateUtils'

/**
 * Initialize EmailJS with public key
 * Call this once when the app loads
 */
export function initEmailJS() {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
  if (publicKey) {
    emailjs.init(publicKey)
  } else {
    console.warn('EmailJS Public Key not found. Email functionality will be disabled.')
  }
}

/**
 * Check if EmailJS is configured
 * @returns {boolean} True if EmailJS is properly configured
 */
export function isEmailJSConfigured() {
  return !!(
    import.meta.env.VITE_EMAILJS_SERVICE_ID &&
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID &&
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY
  )
}

/**
 * Convert PDF Blob to base64 string
 * @param {Blob} pdfBlob - PDF file as Blob
 * @returns {Promise<string>} Base64 encoded PDF
 */
async function pdfBlobToBase64(pdfBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      // Remove data:application/pdf;base64, prefix if present
      const base64 = reader.result.split(',')[1] || reader.result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(pdfBlob)
  })
}

/**
 * Format date for email display
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted date string
 */
function formatDateForEmail(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Build verification URL for certificate
 * @param {string} certificateId - Certificate ID
 * @returns {string} Full verification URL
 */
function buildVerificationUrl(certificateId) {
  const origin = window.location.origin
  return `${origin}/verify/${certificateId}`
}

/**
 * Send certificate via email using EmailJS
 * @param {Object} certificate - Certificate object
 * @param {string} recipientEmail - Recipient email address
 * @param {string} templateId - PDF template ID (default: 'minimalist')
 * @returns {Promise<Object>} Result object with success status and response/error
 */
export async function sendCertificateEmail(certificate, recipientEmail, templateId = 'minimalist') {
  // Check if EmailJS is configured
  if (!isEmailJSConfigured()) {
    return {
      success: false,
      error: 'EmailJS is not configured. Please set up environment variables.'
    }
  }

  // Validate email - check if empty or whitespace
  const trimmedEmail = recipientEmail ? recipientEmail.trim() : ''
  
  // Debug logging
  console.log('sendCertificateEmail called with:', {
    recipientEmail: recipientEmail,
    trimmedEmail: trimmedEmail,
    recipientEmailType: typeof recipientEmail,
    recipientEmailLength: recipientEmail ? recipientEmail.length : 0
  })
  
  if (!trimmedEmail) {
    return {
      success: false,
      error: 'The recipient\'s address is empty. Please enter a valid email address.'
    }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmedEmail)) {
    return {
      success: false,
      error: 'Invalid email address format.'
    }
  }

  try {
    // Generate PDF certificate
    const pdfBlob = await populateTemplate(null, certificate, templateId)
    
    // Convert PDF to base64
    const base64Pdf = await pdfBlobToBase64(pdfBlob)
    
    // Format issue date
    const issueDate = formatDateForEmail(certificate.issueDate)
    
    // Build verification URL
    const verificationUrl = buildVerificationUrl(certificate.id)
    
    // Prepare template parameters
    // IMPORTANT: In EmailJS dashboard, the "To Email" field must be set to: {{to_email}}
    // EmailJS requires the recipient email in 'to_email' parameter
    // Some EmailJS services also need 'to_name' or 'reply_to'
    // We include multiple variations to support different EmailJS service configurations
    const templateParams = {
      to_email: trimmedEmail,        // Primary: Most common parameter name
      email: trimmedEmail,           // Alternative: Some services use 'email'
      user_email: trimmedEmail,      // Alternative: Some services use 'user_email'
      to_name: certificate.studentName || 'Student',
      reply_to: trimmedEmail,        // Some services need this
      student_name: certificate.studentName,
      course_type: certificate.courseType,
      cohort: certificate.cohort || 'N/A',
      certificate_id: certificate.id,
      issue_date: issueDate,
      verification_url: verificationUrl
    }
    
    // Log for debugging - show actual email for troubleshooting
    console.log('📧 EmailJS Template Parameters:', {
      to_email: trimmedEmail,
      to_name: templateParams.to_name,
      student_name: templateParams.student_name,
      course_type: templateParams.course_type,
      certificate_id: templateParams.certificate_id,
      all_params: templateParams
    })

    // Note: EmailJS attachment support varies by service provider
    // Some providers support attachments via base64, others require URLs
    // For now, we'll send without attachment and mention it in the email
    // The user can download the PDF from the dashboard
    
    // Send email via EmailJS
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
    const emailjsTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    
    if (!serviceId || !emailjsTemplateId || !publicKey) {
      return {
        success: false,
        error: 'EmailJS is not fully configured. Please check your environment variables.'
      }
    }
    
    console.log('📤 Sending email via EmailJS:', {
      serviceId,
      emailjsTemplateId,
      recipient: trimmedEmail,
      publicKey: publicKey ? `${publicKey.substring(0, 10)}...` : 'missing',
      templateParams: {
        ...templateParams,
        to_email: trimmedEmail // Ensure it's included
      }
    })
    
    // Double-check that to_email is set
    if (!templateParams.to_email || !templateParams.to_email.trim()) {
      console.error('❌ ERROR: to_email is empty before sending!', {
        templateParams,
        trimmedEmail
      })
      return {
        success: false,
        error: 'Email address is empty. Please check the email input field.'
      }
    }
    
    const response = await emailjs.send(
      serviceId,
      emailjsTemplateId,
      templateParams,
      publicKey
    )
    
    console.log('Email sent successfully:', response)
    return {
      success: true,
      response,
      message: 'Certificate email sent successfully!'
    }
  } catch (error) {
    console.error('Failed to send email:', error)
    console.error('Error details:', {
      text: error.text,
      message: error.message,
      status: error.status,
      response: error.response
    })
    
    // Provide user-friendly error messages
    let errorMessage = 'Failed to send email. '
    
    // Check for specific EmailJS error messages
    if (error.text) {
      // EmailJS returns error.text with the actual error message
      const errorText = error.text.toLowerCase()
      
      // Check for common EmailJS errors
      if (errorText.includes('recipient') && errorText.includes('empty')) {
        errorMessage += 'The recipient email address is empty. '
        errorMessage += 'Please ensure: 1) You entered a valid email address, and 2) In your EmailJS template settings, the "To Email" field is configured to use {{to_email}}'
      } else {
        errorMessage += error.text
      }
    } else if (error.message) {
      errorMessage += error.message
    } else if (error.status) {
      errorMessage += `Error code: ${error.status}. `
      if (error.status === 400) {
        errorMessage += 'Invalid request. Please check your EmailJS template configuration. Make sure the "To Email" field uses {{to_email}}.'
      } else if (error.status === 401) {
        errorMessage += 'Unauthorized. Please check your EmailJS Public Key.'
      } else if (error.status === 404) {
        errorMessage += 'Service or Template not found. Please check your EmailJS Service ID and Template ID.'
      }
    } else {
      errorMessage += 'Please check your EmailJS configuration and try again.'
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error
    }
  }
}

/**
 * Send certificate email with PDF attachment (if supported by EmailJS service)
 * Note: This requires EmailJS service that supports attachments
 * @param {Object} certificate - Certificate object
 * @param {string} recipientEmail - Recipient email address
 * @param {string} templateId - PDF template ID
 * @returns {Promise<Object>} Result object
 */
export async function sendCertificateEmailWithAttachment(certificate, recipientEmail, templateId = 'minimalist') {
  if (!isEmailJSConfigured()) {
    return {
      success: false,
      error: 'EmailJS is not configured. Please set up environment variables.'
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(recipientEmail)) {
    return {
      success: false,
      error: 'Invalid email address format.'
    }
  }

  try {
    // Generate PDF certificate
    const pdfBlob = await populateTemplate(null, certificate, templateId)
    
    // Convert PDF to base64
    const base64Pdf = await pdfBlobToBase64(pdfBlob)
    
    // Format issue date
    const issueDate = formatDateForEmail(certificate.issueDate)
    
    // Build verification URL
    const verificationUrl = buildVerificationUrl(certificate.id)
    
    // Prepare template parameters with attachment
    const templateParams = {
      to_email: recipientEmail,
      student_name: certificate.studentName,
      course_type: certificate.courseType,
      cohort: certificate.cohort || 'N/A',
      certificate_id: certificate.id,
      issue_date: issueDate,
      verification_url: verificationUrl,
      attachment: base64Pdf,
      attachment_name: `Certificate_${certificate.id}.pdf`
    }

    // Send email via EmailJS
    const response = await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      templateParams,
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    )
    
    console.log('Email with attachment sent successfully:', response)
    return {
      success: true,
      response,
      message: 'Certificate email with PDF attachment sent successfully!'
    }
  } catch (error) {
    console.error('Failed to send email with attachment:', error)
    
    let errorMessage = 'Failed to send email with attachment. '
    if (error.text) {
      errorMessage += error.text
    } else if (error.message) {
      errorMessage += error.message
    } else {
      errorMessage += 'Your EmailJS service may not support attachments. Try without attachment.'
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error
    }
  }
}

