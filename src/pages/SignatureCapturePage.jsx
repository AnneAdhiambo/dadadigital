import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SignatureCapture from '../components/SignatureCapture'
import { getSignatureRequestById, saveSignature, updateSignatureRequest } from '../utils/signatureUtils'
import './SignatureCapturePage.css'

function SignatureCapturePage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [signerName, setSignerName] = useState('')
  const [signatureData, setSignatureData] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    if (requestId) {
      const signatureRequest = getSignatureRequestById(requestId)
      if (!signatureRequest) {
        setError('Signature request not found or invalid.')
        return
      }

      if (signatureRequest.status === 'completed') {
        setIsCompleted(true)
        setError('This signature request has already been completed.')
        return
      }

      setRequest(signatureRequest)
      if (signatureRequest.signerName) {
        setSignerName(signatureRequest.signerName)
      }
    }
  }, [requestId])

  const handleSignatureChange = (data) => {
    setSignatureData(data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!signerName.trim()) {
      setError('Please enter your name')
      return
    }

    if (!signatureData) {
      setError('Please provide your signature')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Get user info
      const ipAddress = null // Would need backend to get real IP
      const userAgent = navigator.userAgent

      // Save signature
      const signature = saveSignature({
        requestId: requestId,
        signerName: signerName.trim(),
        signatureData: signatureData,
        ipAddress: ipAddress,
        userAgent: userAgent
      })

      setIsCompleted(true)
    } catch (err) {
      console.error('Error saving signature:', err)
      setError('Failed to save signature. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCompleted) {
    return (
      <div className="signature-capture-page">
        <div className="signature-page-container">
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h1>Signature Submitted Successfully!</h1>
            <p>Thank you for signing. Your signature has been received and saved.</p>
            <button 
              onClick={() => navigate('/')}
              className="btn-primary"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!request && !error) {
    return (
      <div className="signature-capture-page">
        <div className="signature-page-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="signature-capture-page">
      <div className="signature-page-container">
        <div className="signature-page-header">
          <h1>Sign Document</h1>
          {request && (
            <p className="signature-page-subtitle">
              {request.notes || 'Please enter your name and provide your signature below.'}
            </p>
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="signature-form">
          <div className="form-group">
            <label htmlFor="signerName" className="form-label">
              Your Name <span className="required">*</span>
            </label>
            <input
              id="signerName"
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              className="form-input"
              placeholder="Enter your full name"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Your Signature <span className="required">*</span>
            </label>
            <SignatureCapture
              onSignatureChange={handleSignatureChange}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !signerName.trim() || !signatureData}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Signature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SignatureCapturePage

