import './BitcoinDadaLogo.css'

function BitcoinDadaLogo({ size = 'medium' }) {
  const sizeClasses = {
    small: 'logo-small',
    medium: 'logo-medium',
    large: 'logo-large'
  }

  return (
    <div className={`bitcoin-dada-logo ${sizeClasses[size]}`}>
      <img 
        src="/logo.png" 
        alt="Bitcoin Dada Logo" 
        className="logo-image"
        onError={(e) => {
          // Fallback if image fails to load
          console.error('Logo image failed to load')
          e.target.style.display = 'none'
        }}
      />
    </div>
  )
}

export default BitcoinDadaLogo

