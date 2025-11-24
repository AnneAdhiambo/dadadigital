import './Settings.css'

function Settings() {
  return (
    <div className="settings">
      <div className="settings-header">
        <h1>Settings</h1>
        <p className="subtitle">System configuration and preferences</p>
      </div>

      <div className="settings-content">
        <div className="settings-card">
          <h2>System Information</h2>
          <div className="info-section">
            <div className="info-row">
              <span className="info-label">Version:</span>
              <span className="info-value">1.0.0</span>
            </div>
            <div className="info-row">
              <span className="info-label">Storage:</span>
              <span className="info-value">LocalStorage (Browser)</span>
            </div>
            <div className="info-row">
              <span className="info-label">Signature Algorithm:</span>
              <span className="info-value">SHA-256</span>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h2>About</h2>
          <div className="about-section">
            <p>
              This Digital Certificate Signature System provides tamper-proof 
              certificate generation and verification for Bitcoin Dada & Dada Devs.
            </p>
            <p>
              Each certificate is secured with a unique digital signature (SHA-256 hash) 
              that can be verified at any time to ensure authenticity.
            </p>
          </div>
        </div>

        <div className="settings-card">
          <h2>Data Management</h2>
          <div className="data-section">
            <p className="warning-text">
              ⚠️ Currently using browser localStorage. For production use, 
              certificates should be stored in a secure database.
            </p>
            <button 
              className="btn-danger"
              onClick={() => {
                if (confirm('Are you sure you want to clear all certificates? This cannot be undone.')) {
                  localStorage.removeItem('dadadigital_certificates')
                  alert('All certificates have been cleared.')
                  window.location.reload()
                }
              }}
            >
              Clear All Certificates
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings

