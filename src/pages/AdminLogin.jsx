import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Lock, User, ArrowRight, Shield } from 'lucide-react'
import './AdminLogin.css'

function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/admin', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = login(username, password)
      
      if (result.success) {
        navigate('/admin', { replace: true })
      } else {
        setError(result.error || 'Invalid credentials')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="login-container">
        <div className="login-header">
          <Link to="/" className="login-logo">
            <img 
              src={theme === 'dark' ? '/logo-dark.png' : '/logo.png'} 
              alt="Bitcoin Dada Logo" 
              className="login-logo-image"
            />
          </Link>
          <div className="login-title-section">
            <Shield className="login-icon" size={48} />
            <h1 className="login-title">Admin Portal</h1>
            <p className="login-subtitle">Sign in to access the certificate management system</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username" className="form-label">
              <User size={18} />
              Username
            </label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <Lock size={18} />
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? (
              'Signing in...'
            ) : (
              <>
                Sign In
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <Link to="/" className="login-back-link">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin


