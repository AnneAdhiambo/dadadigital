import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { Moon, Sun, LayoutDashboard, FileBadge, Layers, ShieldCheck, Settings, LogOut } from 'lucide-react'
import './Layout.css'

function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/issue', label: 'Issue Certificate', icon: FileBadge },
    { to: '/admin/batch', label: 'Batch Processing', icon: Layers },
    { to: '/verify', label: 'Public Verification', icon: ShieldCheck },
    { to: '/admin/settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <img 
              src={theme === 'dark' ? '/logo-dark.png' : '/logo.png'} 
              alt="Bitcoin Dada Logo" 
              className="sidebar-logo"
            />
          </div>
          <h2>Bitcoin <span className="logo-accent">Dada</span></h2>
          <p className="subtitle">Certificate System</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            const isItemActive = item.to === '/verify' 
              ? (isActive('/verify') || location.pathname.startsWith('/verify/'))
              : isActive(item.to)
            
            return (
              <Link 
                key={item.to}
                to={item.to} 
                className={`nav-item ${isItemActive ? 'active' : ''}`}
              >
                <Icon size={18} className="nav-icon" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <button 
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button 
            onClick={handleLogout}
            className="logout-button"
            aria-label="Logout"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
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

