import { useRef, useEffect, useState, useCallback } from 'react'
import { loadFont } from '../utils/fontUtils'
import './TemplateCanvas.css'

function TemplateCanvas({ 
  templateImageUrl, 
  elements, 
  selectedElementId,
  onElementClick,
  onElementDrag,
  onElementDrop,
  onCanvasClick,
  scale = 1,
  templateWidth = 1200,
  templateHeight = 800
}) {
  const canvasRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragElement, setDragElement] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [fontLoaded, setFontLoaded] = useState(false)

  // Load template image
  useEffect(() => {
    if (!templateImageUrl) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      setImageLoaded(true)
      drawCanvas()
    }
    
    img.onerror = () => {
      console.error('Failed to load template image')
    }
    
    img.src = templateImageUrl
  }, [templateImageUrl])

  // Load font if template has one
  useEffect(() => {
    // Font loading will be handled by parent component
    setFontLoaded(true)
  }, [])

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageLoaded) return

    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      // Set canvas size
      const displayWidth = templateWidth * scale
      const displayHeight = templateHeight * scale
      
      const dpr = window.devicePixelRatio || 1
      canvas.width = displayWidth * dpr
      canvas.height = displayHeight * dpr
      canvas.style.width = displayWidth + 'px'
      canvas.style.height = displayHeight + 'px'
      ctx.scale(dpr * scale, dpr * scale)
      
      // Clear canvas
      ctx.clearRect(0, 0, templateWidth, templateHeight)
      
      // Draw template image
      ctx.drawImage(img, 0, 0, templateWidth, templateHeight)
      
      // Draw elements
      elements.forEach(element => {
        drawElement(ctx, element, element.id === selectedElementId)
      })
    }
    
    img.src = templateImageUrl
  }, [templateImageUrl, elements, selectedElementId, scale, templateWidth, templateHeight, imageLoaded])

  // Draw a single element
  const drawElement = (ctx, element, isSelected) => {
    if (element.type === 'text') {
      drawTextElement(ctx, element, isSelected)
    } else if (element.type === 'signature') {
      drawSignatureElement(ctx, element, isSelected)
    }
  }

  // Draw text element
  const drawTextElement = (ctx, element, isSelected) => {
    const { x, y, fontSize, fontFamily, fontWeight, color, field } = element
    
    // Set font
    ctx.font = `${fontWeight || 'normal'} ${fontSize}px ${fontFamily || 'Arial'}`
    ctx.fillStyle = color || '#000000'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Get sample text based on field
    const sampleText = getSampleText(field)
    
    // Draw text
    ctx.fillText(sampleText, x, y)
    
    // Draw bounding box if selected
    if (isSelected) {
      const metrics = ctx.measureText(sampleText)
      const textWidth = metrics.width
      const textHeight = fontSize
      
      ctx.strokeStyle = '#f0b400'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(
        x - textWidth / 2 - 5,
        y - textHeight / 2 - 5,
        textWidth + 10,
        textHeight + 10
      )
      ctx.setLineDash([])
      
      // Draw resize handles
      drawHandles(ctx, x - textWidth / 2 - 5, y - textHeight / 2 - 5, textWidth + 10, textHeight + 10)
    }
  }

  // Draw signature element
  const drawSignatureElement = (ctx, element, isSelected) => {
    const { x, y, signatureData, width = 200, height = 80 } = element
    
    if (signatureData) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, x - width / 2, y - height / 2, width, height)
        
        if (isSelected) {
          ctx.strokeStyle = '#f0b400'
          ctx.lineWidth = 2
          ctx.setLineDash([5, 5])
          ctx.strokeRect(x - width / 2 - 5, y - height / 2 - 5, width + 10, height + 10)
          ctx.setLineDash([])
          drawHandles(ctx, x - width / 2 - 5, y - height / 2 - 5, width + 10, height + 10)
        }
        
        drawCanvas()
      }
      img.src = signatureData
    } else {
      // Draw placeholder
      ctx.strokeStyle = '#cccccc'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.strokeRect(x - width / 2, y - height / 2, width, height)
      ctx.setLineDash([])
      ctx.fillStyle = '#cccccc'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('Signature', x, y)
    }
  }

  // Draw resize handles
  const drawHandles = (ctx, x, y, width, height) => {
    const handleSize = 8
    const handles = [
      { x: x, y: y }, // top-left
      { x: x + width, y: y }, // top-right
      { x: x, y: y + height }, // bottom-left
      { x: x + width, y: y + height }, // bottom-right
    ]
    
    ctx.fillStyle = '#f0b400'
    handles.forEach(handle => {
      ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize)
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 1
      ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize)
    })
  }

  // Get sample text for preview
  const getSampleText = (field) => {
    const samples = {
      studentName: 'John Doe',
      courseType: 'Bitcoin & Blockchain Fundamentals',
      cohort: 'Cohort 2025-01',
      certificateType: 'Certificate of Completion',
      issueDate: 'January 15, 2025',
      signerName: 'Lead Instructor',
      signerTitle: 'Course Director',
      custom: 'Sample Text'
    }
    return samples[field] || 'Sample Text'
  }

  // Handle mouse down
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale

    // Check if clicking on an element
    const clickedElement = elements.find(el => {
      if (el.type === 'text') {
        const ctx = canvas.getContext('2d')
        ctx.font = `${el.fontWeight || 'normal'} ${el.fontSize}px ${el.fontFamily || 'Arial'}`
        const metrics = ctx.measureText(getSampleText(el.field))
        const textWidth = metrics.width
        const textHeight = el.fontSize
        
        return (
          x >= el.x - textWidth / 2 - 5 &&
          x <= el.x + textWidth / 2 + 5 &&
          y >= el.y - textHeight / 2 - 5 &&
          y <= el.y + textHeight / 2 + 5
        )
      } else if (el.type === 'signature') {
        const width = el.width || 200
        const height = el.height || 80
        return (
          x >= el.x - width / 2 &&
          x <= el.x + width / 2 &&
          y >= el.y - height / 2 &&
          y <= el.y + height / 2
        )
      }
      return false
    })

    if (clickedElement) {
      setIsDragging(true)
      setDragElement(clickedElement)
      setDragOffset({
        x: x - clickedElement.x,
        y: y - clickedElement.y
      })
      if (onElementClick) {
        onElementClick(clickedElement.id)
      }
    } else {
      // Clicked on canvas
      if (onCanvasClick) {
        onCanvasClick(x, y)
      }
    }
  }

  // Handle mouse move
  const handleMouseMove = (e) => {
    if (!isDragging || !dragElement) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale

    const newX = x - dragOffset.x
    const newY = y - dragOffset.y

    if (onElementDrag) {
      onElementDrag(dragElement.id, newX, newY)
    }
  }

  // Handle mouse up
  const handleMouseUp = () => {
    if (isDragging && dragElement && onElementDrop) {
      onElementDrop(dragElement.id)
    }
    setIsDragging(false)
    setDragElement(null)
  }

  // Redraw when elements or selection changes
  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  return (
    <div className="template-canvas-container">
      <canvas
        ref={canvasRef}
        className="template-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'default' }}
      />
    </div>
  )
}

export default TemplateCanvas

