import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { getUnreadNotificationsCount } from '../utils/signatureUtils'
import ThemeToggle from './ThemeToggle'
import './Layout.css'

function Layout({ children }) {
  const location = useLocation()
  const { theme } = useTheme()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Check for unread notifications
    const count = getUnreadNotificationsCount()
    setUnreadCount(count)

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      const newCount = getUnreadNotificationsCount()
      setUnreadCount(newCount)
    }, 30000)

    return () => clearInterval(interval)
  }, [location.pathname])

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <img 
              src={theme === 'dark' ? '/logo-dark.png' : '/logo.png'} 
              alt="Bitcoin Dada Logo" 
              className="sidebar-logo"
              onError={(e) => {
                // Fallback if image fails to load
                e.target.style.display = 'none'
              }}
            />
          </div>
          <h2>Bitcoin Dada</h2>
          <p className="subtitle">Certificate System</p>
        </div>
        <nav className="sidebar-nav">
          <Link 
            to="/admin" 
            className={`nav-item ${isActive('/admin') ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/admin/issue" 
            className={`nav-item ${isActive('/admin/issue') ? 'active' : ''}`}
          >
            Issue Certificate
          </Link>
          <Link 
            to="/admin/batch" 
            className={`nav-item ${isActive('/admin/batch') ? 'active' : ''}`}
          >
            Batch Processing
          </Link>
          <Link 
            to="/admin/templates" 
            className={`nav-item ${isActive('/admin/templates') ? 'active' : ''}`}
          >
            Template Manager
          </Link>
          <Link 
            to="/admin/signatures" 
            className={`nav-item ${isActive('/admin/signatures') ? 'active' : ''}`}
          >
            Signatures
            {unreadCount > 0 && (
              <span className="nav-badge">{unreadCount}</span>
            )}
          </Link>
          <Link 
            to="/verify" 
            className={`nav-item ${isActive('/verify') || isActive('/verify/') ? 'active' : ''}`}
          >
            Verify
          </Link>
          <Link 
            to="/admin/settings" 
            className={`nav-item ${isActive('/admin/settings') ? 'active' : ''}`}
          >
            Settings
          </Link>
        </nav>
        <div className="sidebar-footer">
          <ThemeToggle variant="inline" />
          <p className="footer-text">Powered by Bitcoin Dada × Dada Devs</p>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

export default Layout

