import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { initEmailJS } from './utils/emailUtils'
import { STORAGE_KEY_NAME } from './utils/nostrUtils'
import './index.css'

function seedNostrKeyFromEnv() {
  if (!import.meta.env.PROD) {
    return
  }

  if (typeof window === 'undefined' || !window?.localStorage) {
    return
  }

  const envKey = import.meta.env.VITE_NOSTR_PRIVATE_KEY?.trim()
  if (!envKey) {
    return
  }

  try {
    const existingKey = window.localStorage.getItem(STORAGE_KEY_NAME)
    if (existingKey === envKey) {
      return
    }

    window.localStorage.setItem(STORAGE_KEY_NAME, envKey)
    console.info('Seeded Nostr private key from environment configuration')
  } catch (error) {
    console.warn('Unable to seed Nostr private key from environment', error)
  }
}

// Initialize EmailJS
initEmailJS()
seedNostrKeyFromEnv()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

