/**
 * Utility functions for managing signatures
 * Stores signatures in localStorage
 */

const STORAGE_KEY = 'dadadigital_signatures'
const SIGNATURE_REQUESTS_KEY = 'dadadigital_signature_requests'
const NOTIFICATIONS_KEY = 'dadadigital_notifications'

/**
 * Generate a unique signature request ID
 */
export function generateSignatureRequestId() {
  const timestamp = Date.now()
  const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase()
  return `SIG-${timestamp}-${randomHex}`
}

/**
 * Generate a unique signature ID
 */
export function generateSignatureId() {
  const timestamp = Date.now()
  const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase()
  return `SIG-${randomHex}`
}

/**
 * Create a signature request (link that can be sent to signers)
 */
export function createSignatureRequest(data) {
  const requestId = generateSignatureRequestId()
  const request = {
    id: requestId,
    signerName: data.signerName || '',
    signerEmail: data.signerEmail || '',
    requestedBy: data.requestedBy || 'Admin',
    requestedAt: new Date().toISOString(),
    status: 'pending', // pending, completed, expired
    expiresAt: data.expiresAt || null,
    notes: data.notes || '',
    link: `${window.location.origin}/sign/${requestId}`,
    completedAt: null
  }

  const requests = getSignatureRequests()
  requests.push(request)
  localStorage.setItem(SIGNATURE_REQUESTS_KEY, JSON.stringify(requests))
  
  return request
}

/**
 * Get all signature requests
 */
export function getSignatureRequests() {
  const stored = localStorage.getItem(SIGNATURE_REQUESTS_KEY)
  return stored ? JSON.parse(stored) : []
}

/**
 * Get signature request by ID
 */
export function getSignatureRequestById(requestId) {
  const requests = getSignatureRequests()
  return requests.find(req => req.id === requestId)
}

/**
 * Update signature request status
 */
export function updateSignatureRequest(requestId, updates) {
  const requests = getSignatureRequests()
  const index = requests.findIndex(req => req.id === requestId)
  
  if (index !== -1) {
    requests[index] = { ...requests[index], ...updates }
    localStorage.setItem(SIGNATURE_REQUESTS_KEY, JSON.stringify(requests))
    return requests[index]
  }
  return null
}

/**
 * Save a signature
 */
export function saveSignature(signatureData) {
  const signatureId = generateSignatureId()
  const signature = {
    id: signatureId,
    requestId: signatureData.requestId || null,
    signerName: signatureData.signerName,
    signatureData: signatureData.signatureData, // Base64 image data
    signedAt: new Date().toISOString(),
    ipAddress: signatureData.ipAddress || null,
    userAgent: signatureData.userAgent || null,
    status: 'active'
  }

  const signatures = getStoredSignatures()
  signatures.push(signature)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(signatures))

  // Update request status if it exists
  if (signatureData.requestId) {
    updateSignatureRequest(signatureData.requestId, {
      status: 'completed',
      completedAt: new Date().toISOString()
    })
    
    // Create notification for admin
    createNotification({
      type: 'signature_completed',
      title: 'New Signature Received',
      message: `${signatureData.signerName} has signed the document`,
      signatureId: signatureId,
      requestId: signatureData.requestId,
      timestamp: new Date().toISOString()
    })
  }

  return signature
}

/**
 * Get all stored signatures
 */
export function getStoredSignatures() {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

/**
 * Get signature by ID
 */
export function getSignatureById(signatureId) {
  const signatures = getStoredSignatures()
  return signatures.find(sig => sig.id === signatureId)
}

/**
 * Get signatures by request ID
 */
export function getSignaturesByRequestId(requestId) {
  const signatures = getStoredSignatures()
  return signatures.filter(sig => sig.requestId === requestId)
}

/**
 * Delete a signature
 */
export function deleteSignature(signatureId) {
  const signatures = getStoredSignatures()
  const filtered = signatures.filter(sig => sig.id !== signatureId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

/**
 * Create a notification
 */
export function createNotification(notification) {
  const notifications = getNotifications()
  const newNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...notification,
    read: false
  }
  notifications.unshift(newNotification) // Add to beginning
  // Keep only last 100 notifications
  const limited = notifications.slice(0, 100)
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(limited))
  return newNotification
}

/**
 * Get all notifications
 */
export function getNotifications() {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY)
  return stored ? JSON.parse(stored) : []
}

/**
 * Get unread notifications count
 */
export function getUnreadNotificationsCount() {
  const notifications = getNotifications()
  return notifications.filter(n => !n.read).length
}

/**
 * Mark notification as read
 */
export function markNotificationAsRead(notificationId) {
  const notifications = getNotifications()
  const index = notifications.findIndex(n => n.id === notificationId)
  if (index !== -1) {
    notifications[index].read = true
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
    return true
  }
  return false
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsAsRead() {
  const notifications = getNotifications()
  notifications.forEach(n => n.read = true)
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
  return true
}

/**
 * Delete a notification
 */
export function deleteNotification(notificationId) {
  const notifications = getNotifications()
  const filtered = notifications.filter(n => n.id !== notificationId)
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered))
  return true
}

/**
 * Delete a signature request
 */
export function deleteSignatureRequest(requestId) {
  const requests = getSignatureRequests()
  const filtered = requests.filter(req => req.id !== requestId)
  localStorage.setItem(SIGNATURE_REQUESTS_KEY, JSON.stringify(filtered))
  return true
}

