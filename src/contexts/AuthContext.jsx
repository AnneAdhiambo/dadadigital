import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if user is already logged in
    const savedAuth = localStorage.getItem('admin_authenticated')
    const authTimestamp = localStorage.getItem('admin_auth_timestamp')
    
    if (savedAuth === 'true' && authTimestamp) {
      // Check if session is still valid (24 hours)
      const now = Date.now()
      const timestamp = parseInt(authTimestamp, 10)
      const hoursSinceLogin = (now - timestamp) / (1000 * 60 * 60)
      
      if (hoursSinceLogin < 24) {
        return true
      } else {
        // Session expired
        localStorage.removeItem('admin_authenticated')
        localStorage.removeItem('admin_auth_timestamp')
        return false
      }
    }
    return false
  })

  const login = (username, password) => {
    // Default credentials (in production, this should be handled by a backend)
    const ADMIN_USERNAME = 'admin'
    const ADMIN_PASSWORD = 'bitcoindada2025'
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      localStorage.setItem('admin_authenticated', 'true')
      localStorage.setItem('admin_auth_timestamp', Date.now().toString())
      return { success: true }
    } else {
      return { success: false, error: 'Invalid username or password' }
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('admin_authenticated')
    localStorage.removeItem('admin_auth_timestamp')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

