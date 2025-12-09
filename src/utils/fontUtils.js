/**
 * Font loading and management utilities
 * Handles loading TTF fonts from assets and registering them with the browser
 */

const fontCache = new Map()
const loadedFonts = new Set()

/**
 * Parse font name from template filename
 * Format: {FontName}_{TemplateName}.png
 * Example: "Amsterdam Four_ttf 400_Minimalist Certificate.png" -> "Amsterdam Four_ttf 400"
 */
export function parseFontFromFilename(filename) {
  if (!filename) return null
  
  // Remove extension
  const nameWithoutExt = filename.replace(/\.(png|jpg|jpeg|svg|pdf)$/i, '')
  
  // Find the last underscore before the template name
  // Pattern: FontName_TemplateName or FontName_ttf 400_TemplateName
  const parts = nameWithoutExt.split('_')
  
  if (parts.length < 2) return null
  
  // For "Amsterdam Four_ttf 400_Minimalist Certificate"
  // We want "Amsterdam Four_ttf 400"
  // Check if second part is "ttf" or contains numbers (like "ttf 400")
  if (parts.length >= 3 && (parts[1].includes('ttf') || /^\d+/.test(parts[1]))) {
    return `${parts[0]}_${parts[1]}`
  }
  
  // For "BrightWall_Achievement", font is just "BrightWall"
  // But we need to check if there's a corresponding TTF file
  return parts[0]
}

/**
 * Get font filename from font name
 * Maps font names to their TTF filenames
 */
export function getFontFilename(fontName) {
  if (!fontName) return null
  
  // Web fonts don't have TTF files - they're loaded via CSS
  const webFonts = ['Montserrat', 'Poppins', 'Open Sans']
  if (webFonts.includes(fontName)) {
    return null // Web fonts are loaded via Google Fonts
  }
  
  // Map known font names to filenames
  const fontMap = {
    'Amsterdam Four_ttf 400': 'Amsterdam Four_ttf 400.ttf',
    'Amsterdam Four': 'Amsterdam Four_ttf 400.ttf',
    'BrightWall': 'Brightwall Personal Use Only.ttf',
    'Brightwall Personal Use Only': 'Brightwall Personal Use Only.ttf'
  }
  
  // Check direct mapping
  if (fontMap[fontName]) {
    return fontMap[fontName]
  }
  
  // Try to construct filename
  return `${fontName}.ttf`
}

/**
 * Load a font from assets and register it with the browser
 * @param {string} fontName - Name of the font (e.g., "Amsterdam Four_ttf 400")
 * @returns {Promise<FontFace>} - The loaded FontFace object
 */
export async function loadFont(fontName) {
  if (!fontName) {
    throw new Error('Font name is required')
  }
  
  // Check if already loaded
  if (loadedFonts.has(fontName)) {
    return fontCache.get(fontName)
  }
  
  // Check cache
  if (fontCache.has(fontName)) {
    loadedFonts.add(fontName)
    return fontCache.get(fontName)
  }
  
  try {
    const fontFilename = getFontFilename(fontName)
    if (!fontFilename) {
      throw new Error(`Could not determine filename for font: ${fontName}`)
    }
    
    // Load font from assets
    // In Vite, we need to import or use the public path
    // For fonts in src/assets, we can use a dynamic import or fetch
    const fontPath = `/src/assets/fonts/${fontFilename}`
    
    // Try multiple paths
    const pathsToTry = [
      `/src/assets/fonts/${fontFilename}`,
      `./assets/fonts/${fontFilename}`,
      `../assets/fonts/${fontFilename}`,
      `/fonts/${fontFilename}`,
      fontFilename
    ]
    
    let fontData = null
    let fontUrl = null
    
    for (const path of pathsToTry) {
      try {
        const response = await fetch(path)
        if (response.ok) {
          fontData = await response.arrayBuffer()
          fontUrl = path
          break
        }
      } catch (e) {
        // Try next path
        continue
      }
    }
    
    if (!fontData) {
      // Try importing as a module (Vite handles this)
      try {
        // Vite will handle the asset import
        // @vite-ignore - Dynamic font loading is intentional
        const fontModule = await import(/* @vite-ignore */ `../assets/fonts/${fontFilename}?url`)
        if (fontModule && fontModule.default) {
          fontUrl = fontModule.default
          const response = await fetch(fontUrl)
          if (response.ok) {
            fontData = await response.arrayBuffer()
          }
        }
      } catch (e) {
        console.warn(`Could not load font ${fontName} via import, trying direct path`, e)
        // Last resort: try direct path
        try {
          const directPath = `/src/assets/fonts/${fontFilename}`
          const response = await fetch(directPath)
          if (response.ok) {
            fontData = await response.arrayBuffer()
          } else {
            throw new Error(`Font file not found: ${fontFilename}`)
          }
        } catch (e2) {
          console.warn(`Could not load font ${fontName} from any path`, e2)
          throw new Error(`Font file not found: ${fontFilename}`)
        }
      }
    }
    
    // Create FontFace
    const fontFace = new FontFace(fontName, fontData)
    
    // Load the font
    await fontFace.load()
    
    // Register with document
    document.fonts.add(fontFace)
    
    // Cache it
    fontCache.set(fontName, fontFace)
    loadedFonts.add(fontName)
    
    console.log(`Successfully loaded font: ${fontName}`)
    return fontFace
  } catch (error) {
    console.error(`Error loading font ${fontName}:`, error)
    throw error
  }
}

/**
 * Preload multiple fonts
 * @param {string[]} fontNames - Array of font names to load
 */
export async function preloadFonts(fontNames) {
  const promises = fontNames.map(fontName => 
    loadFont(fontName).catch(err => {
      console.warn(`Failed to preload font ${fontName}:`, err)
      return null
    })
  )
  
  await Promise.all(promises)
}

/**
 * Check if a font is loaded
 * @param {string} fontName - Name of the font
 * @returns {boolean}
 */
export function isFontLoaded(fontName) {
  return loadedFonts.has(fontName)
}

/**
 * Get all loaded fonts
 * @returns {string[]}
 */
export function getLoadedFonts() {
  return Array.from(loadedFonts)
}

/**
 * Clear font cache (useful for testing or memory management)
 */
export function clearFontCache() {
  fontCache.clear()
  loadedFonts.clear()
}

