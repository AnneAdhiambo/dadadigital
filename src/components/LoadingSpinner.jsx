import { useState, useEffect } from 'react'
import './LoadingSpinner.css'

function LoadingSpinner({ show, message = 'Loading...', delay = 1000 }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setVisible(true)
      }, delay)
      return () => clearTimeout(timer)
    } else {
      setVisible(false)
    }
  }, [show, delay])

  if (!show || !visible) {
    return null
  }

  return (
    <div className="loading-spinner-overlay">
      <div className="loading-spinner-container">
        <div className="spinner-ring">
          <div className="spinner-ring-inner"></div>
        </div>
        <div className="spinner-ring spinner-ring-2">
          <div className="spinner-ring-inner"></div>
        </div>
        <div className="spinner-ring spinner-ring-3">
          <div className="spinner-ring-inner"></div>
        </div>
        <p className="spinner-message">{message}</p>
      </div>
    </div>
  )
}

export default LoadingSpinner
