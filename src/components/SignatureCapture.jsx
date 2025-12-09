import { useRef, useEffect, useState } from 'react'
import './SignatureCapture.css'

function SignatureCapture({ onSignatureChange, initialSignature = null }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    
    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    // Always use black pen on transparent background
    const penColor = '#000000'

    // Clear canvas (transparent background)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set drawing style - always black
    ctx.strokeStyle = penColor
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Load initial signature if provided
    if (initialSignature) {
      const img = new Image()
      img.onload = () => {
        // Clear canvas (transparent)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        setHasSignature(true)
      }
      img.src = initialSignature
    }
  }, [initialSignature])

  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    
    // Always use black pen
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    const coords = getCoordinates(e)
    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
  }

  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    
    // Always use black pen
    ctx.strokeStyle = '#000000'
    
    const coords = getCoordinates(e)
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()
    
    if (!hasSignature) {
      setHasSignature(true)
    }
    
    // Notify parent of signature change
    if (onSignatureChange) {
      const signatureData = canvas.toDataURL('image/png')
      onSignatureChange(signatureData)
    }
  }

  const stopDrawing = (e) => {
    if (isDrawing) {
      setIsDrawing(false)
      if (onSignatureChange) {
        const canvas = canvasRef.current
        const signatureData = canvas.toDataURL('image/png')
        onSignatureChange(signatureData)
      }
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    
    // Clear canvas (transparent background)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Reset stroke style to black
    ctx.strokeStyle = '#000000'
    
    setHasSignature(false)
    if (onSignatureChange) {
      onSignatureChange(null)
    }
  }

  return (
    <div className="signature-capture-container">
      <div className="signature-canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="signature-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {hasSignature && (
          <button
            type="button"
            className="signature-clear-btn"
            onClick={clearSignature}
            title="Clear signature"
          >
            ×
          </button>
        )}
      </div>
      <div className="signature-actions">
        <button
          type="button"
          className="signature-reset-btn"
          onClick={clearSignature}
          disabled={!hasSignature}
        >
          <span>↺</span>
          <span>Clear</span>
        </button>
        <div className="signature-hint">
          {hasSignature ? 'Signature captured' : 'Sign above'}
        </div>
      </div>
    </div>
  )
}

export default SignatureCapture

