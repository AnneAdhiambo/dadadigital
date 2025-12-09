import { useTheme } from '../contexts/ThemeContext'
import { Moon, Sun } from 'lucide-react'
import './ThemeToggle.css'

function ThemeToggle({ variant = 'floating' }) {
  const { theme, toggleTheme } = useTheme()

  if (variant === 'floating') {
    return (
      <button
        onClick={toggleTheme}
        className="theme-toggle-floating"
        aria-label="Toggle theme"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    )
  }

  // Inline variant for headers/navbars
  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-inline"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  )
}

export default ThemeToggle


