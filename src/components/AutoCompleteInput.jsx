import { useState, useEffect, useRef } from 'react'
import './AutoCompleteInput.css'

function AutoCompleteInput({ 
  value, 
  onChange, 
  name = 'studentName',
  suggestions = [], 
  placeholder = '',
  label = '',
  required = false,
  onSelect = null,
  autoFillFields = null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (value && suggestions.length > 0) {
      const filtered = suggestions.filter(item =>
        item.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredSuggestions(filtered)
      setIsOpen(filtered.length > 0 && value.length > 0)
    } else {
      setFilteredSuggestions([])
      setIsOpen(false)
    }
  }, [value, suggestions])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    onChange(e)
    setHighlightedIndex(-1)
  }

  const handleSelect = (suggestion) => {
    const event = { target: { name: name, value: suggestion } }
    onChange(event)
    setIsOpen(false)
    
    if (onSelect) {
      onSelect(suggestion)
    }
  }

  const handleKeyDown = (e) => {
    if (!isOpen || filteredSuggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      handleSelect(filteredSuggestions[highlightedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="autocomplete-wrapper">
      {label && (
        <label htmlFor="autocomplete-input">
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      <div className="autocomplete-container">
        <input
          ref={inputRef}
          id="autocomplete-input"
          type="text"
          name={name}
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (filteredSuggestions.length > 0) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="autocomplete-input"
          autoComplete="off"
        />
        {isOpen && filteredSuggestions.length > 0 && (
          <div ref={dropdownRef} className="autocomplete-dropdown">
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`autocomplete-item ${
                  index === highlightedIndex ? 'highlighted' : ''
                }`}
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AutoCompleteInput

