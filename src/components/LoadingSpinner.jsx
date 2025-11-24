import './LoadingSpinner.css'

function LoadingSpinner({ size = 'medium', color = 'orange' }) {
  return (
    <div className={`loading-spinner ${size} ${color}`}>
      <div className="spinner-ring"></div>
    </div>
  )
}

export default LoadingSpinner
