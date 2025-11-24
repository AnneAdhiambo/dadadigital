import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  FileBadge, 
  Layers, 
  CheckCircle, 
  Menu, 
  X, 
  Search, 
  ArrowRight, 
  Lock, 
  Database,
  UploadCloud
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import LoadingSpinner from '../components/LoadingSpinner';
import { verifyCertificate, getStoredCertificates, hashPDF, verifyPDFHashByHash } from '../utils/certificateUtils';
import { populateTemplate } from '../utils/templateUtils';
import './LandingPage.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`landing-navbar ${isScrolled ? 'scrolled' : ''}`}
    >
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <img 
            src={theme === 'dark' ? '/logo-dark.png' : '/logo.png'} 
            alt="Bitcoin Dada Logo" 
            className="nav-logo-image"
          />
        </Link>

        <div className="nav-desktop">
          {['Home', 'Technology', 'Verify', 'Support'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`} 
              className="nav-link"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="nav-actions">
          <ThemeToggle variant="inline" />
          <Link to="/admin/login" className="nav-admin-btn">Admin Login</Link>
        </div>

        <button 
          className="nav-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="nav-mobile-menu">
          {['Home', 'Technology', 'Verify', 'Support'].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`}
              className="nav-mobile-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item}
            </a>
          ))}
          <div className="nav-mobile-divider"></div>
          <Link to="/admin/login" className="nav-mobile-admin-btn">Admin Login</Link>
        </div>
      )}
    </nav>
  );
};

const Hero = () => {
  const { theme } = useTheme();
  
  return (
    <section className="landing-hero">
      <div className="hero-background">
        <svg className="hero-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 50 Q 25 20, 50 50 T 100 50" stroke="#F7931A" strokeWidth="0.2" fill="none" />
          <path d="M0 60 Q 25 30, 50 60 T 100 60" stroke="#F7931A" strokeWidth="0.2" fill="none" />
          <path d="M0 70 Q 25 40, 50 70 T 100 70" stroke="#F7931A" strokeWidth="0.2" fill="none" />
          <path d="M0 40 Q 25 10, 50 40 T 100 40" stroke="#F7931A" strokeWidth="0.2" fill="none" />
        </svg>
      </div>

      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-left">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              <span className="badge-text">Live on Mainnet</span>
            </div>
            
            <h1 className="hero-title">
              Trust, but <br />
              <span className="hero-title-accent">Verify.</span>
            </h1>
            
            <p className="hero-description">
              Issue, verify, and manage blockchain-anchored digital certificates. 
              Immutable proof of achievement for the Bitcoin Dada community.
            </p>

            <div className="hero-cta">
              <a href="#verify" className="hero-btn-primary">
                Verify Certificate <ArrowRight size={20} />
              </a>
              <Link to="/admin/login" className="hero-btn-secondary">
                Admin Login
              </Link>
            </div>
            
            <div className="hero-trust">
              <div className="trust-avatars">
                <div className="trust-avatar"></div>
                <div className="trust-avatar"></div>
                <div className="trust-avatar"></div>
              </div>
              <p>Trusted by 500+ graduates</p>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-glow"></div>
            
            <div className="hero-cert-card">
              <div className="cert-header">
                <div>
                  <div className="cert-logo-row">
                    <img 
                      src={theme === 'dark' ? '/logo-dark.png' : '/logo.png'} 
                      alt="Bitcoin Dada" 
                      className="cert-logo-image"
                    />
                    <span className="cert-logo-text">Bitcoin Dada</span>
                  </div>
                  <div className="cert-type">Certificate of Completion</div>
                </div>
                <div className="cert-icon-wrapper">
                  <ShieldCheck size={32} className="cert-icon" />
                </div>
              </div>

              <div className="cert-body">
                <h3 className="cert-name">Jane Doe</h3>
                <div className="cert-divider"></div>
                <p className="cert-description">
                  Has successfully completed the fundamental course in
                  <br /><strong>Bitcoin & Blockchain Technology</strong>
                </p>
              </div>

              <div className="cert-footer">
                <div className="cert-date">
                  <div className="cert-date-label">Date</div>
                  <div className="cert-date-value">Oct 24, 2025</div>
                </div>
                
                <div className="cert-verified">
                  <CheckCircle size={12} /> Verified on Chain
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Features = () => {
  const features = [
    {
      icon: <Lock size={32} />,
      title: "Secure Verification",
      desc: "Certificates are cryptographically hashed and anchored to the Bitcoin blockchain. Tamper-proof and immutable by design."
    },
    {
      icon: <FileBadge size={32} />,
      title: "Professional Templates",
      desc: "Choose from our library of sleek, branded designs that reflect the professionalism of the Bitcoin Dada ecosystem."
    },
    {
      icon: <Layers size={32} />,
      title: "Batch Processing",
      desc: "Issue hundreds of certificates in minutes via CSV upload. Streamlined operations for large cohorts and events."
    }
  ];

  return (
    <section className="landing-features">
      <div className="features-container">
        <div className="features-header">
          <h2 className="features-title">The New Standard of Trust</h2>
          <p className="features-subtitle">
            We have moved beyond unverifiable PDFs. Our system ensures that every achievement is respected and secured by cryptography.
          </p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-card-glow"></div>
              
              <div className="feature-icon-wrapper">
                {f.icon}
              </div>
              
              <h3 className="feature-card-title">
                {f.title}
              </h3>
              
              <p className="feature-card-desc">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Workflow = () => {
  return (
    <section className="landing-workflow">
      <div className="workflow-container">
        <div className="workflow-content">
          <div className="workflow-left">
            <h3 className="workflow-label">How it Works</h3>
            <h2 className="workflow-title">The Issuance Lifecycle</h2>
            <p className="workflow-description">
              A seamless process from administrative entry to blockchain anchoring, ensuring permanence and accessibility.
            </p>
          </div>
          
          <div className="workflow-steps">
            {[
              { num: "01", title: "Define & Upload", text: "Admins select a template and upload recipient details securely." },
              { num: "02", title: "Anchor to Chain", text: "System generates a hash and records it on the public ledger." },
              { num: "03", title: "Instant Delivery", text: "Recipients receive an email with a secure link to their credential." },
              { num: "04", title: "Universal Verify", text: "Anyone can validate the authenticity instantly globally." },
            ].map((step, idx) => (
              <div key={idx} className="workflow-step">
                <div className="step-number">{step.num}</div>
                <h4 className="step-title">{step.title}</h4>
                <p className="step-text">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const VerifySection = () => {
  const [activeTab, setActiveTab] = useState('id');
  const [fileName, setFileName] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      handleFileUpload(file);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsVerifying(true);
    setVerificationResult(null);

    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const query = searchQuery.trim().toLowerCase();
      const allCerts = getStoredCertificates();
      const certificate = allCerts.find(c => c.id.toLowerCase() === query);

      if (certificate) {
        const result = verifyCertificate(certificate);
        setVerificationResult({ type: 'id', ...result });
      } else {
        setVerificationResult({
          isValid: false,
          reason: 'Certificate ID not found'
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({ isValid: false, reason: 'An error occurred' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      if (file.type === 'application/pdf') {
        const hash = await hashPDF(file);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const result = verifyPDFHashByHash(hash);
        setVerificationResult({ type: 'file', ...result });
      } else {
        setVerificationResult({ isValid: false, reason: 'Unsupported file type. Please upload a PDF.' });
      }
    } catch (error) {
      console.error('File verification error:', error);
      setVerificationResult({ isValid: false, reason: 'Error processing file' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);
      handleFileUpload(file);
    }
  };

  const downloadCertificate = async (cert) => {
    try {
      const templateId = cert.templateId || 'minimalist';
      const pdfBlob = await populateTemplate(null, cert, templateId);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificate-${cert.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download certificate');
    }
  };

  const resetVerification = () => {
    setVerificationResult(null);
    setSearchQuery('');
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section id="verify" className="landing-verify">
      <div className="verify-bitcoin-left">
        <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
          width="200px" height="200px" viewBox="100 100 400 400" xmlSpace="preserve">
          <filter id="dropshadow-left" height="130%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="5"/>
            <feOffset dx="0" dy="0" result="offsetblur"/>
            <feFlood floodColor="red"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>          
          <path className="bitcoin-path" style={{filter: 'url(#dropshadow-left)'}} fill="#000000" d="M446.089,261.45c6.135-41.001-25.084-63.033-67.769-77.735l13.844-55.532l-33.801-8.424l-13.48,54.068
            c-8.896-2.217-18.015-4.304-27.091-6.371l13.568-54.429l-33.776-8.424l-13.861,55.521c-7.354-1.676-14.575-3.328-21.587-5.073
            l0.034-0.171l-46.617-11.64l-8.993,36.102c0,0,25.08,5.746,24.549,6.105c13.689,3.42,16.159,12.478,15.75,19.658L208.93,357.23
            c-1.675,4.158-5.925,10.401-15.494,8.031c0.338,0.485-24.579-6.134-24.579-6.134l-9.631,40.468l36.843,9.188
            c8.178,2.051,16.209,4.19,24.098,6.217l-13.978,56.17l33.764,8.424l13.852-55.571c9.235,2.499,18.186,4.813,26.948,6.995
            l-13.802,55.309l33.801,8.424l13.994-56.061c57.648,10.902,100.998,6.502,119.237-45.627c14.705-41.979-0.731-66.193-31.06-81.984
            C425.008,305.984,441.655,291.455,446.089,261.45z M368.859,369.754c-10.455,41.983-81.128,19.285-104.052,13.589l18.562-74.404
            C306.28,314.65,379.774,325.975,368.859,369.754z M379.302,260.846c-9.527,38.187-68.358,18.781-87.442,14.023l16.828-67.489
            C327.767,212.14,389.234,221.02,379.302,260.846z"/>
        </svg>
      </div>
      <div className="verify-bitcoin-right">
        <svg version="1.1" id="Layer_2" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
          width="200px" height="200px" viewBox="100 100 400 400" xmlSpace="preserve">
          <filter id="dropshadow-right" height="130%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="5"/>
            <feOffset dx="0" dy="0" result="offsetblur"/>
            <feFlood floodColor="red"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>          
          <path className="bitcoin-path" style={{filter: 'url(#dropshadow-right)'}} fill="#000000" d="M446.089,261.45c6.135-41.001-25.084-63.033-67.769-77.735l13.844-55.532l-33.801-8.424l-13.48,54.068
            c-8.896-2.217-18.015-4.304-27.091-6.371l13.568-54.429l-33.776-8.424l-13.861,55.521c-7.354-1.676-14.575-3.328-21.587-5.073
            l0.034-0.171l-46.617-11.64l-8.993,36.102c0,0,25.08,5.746,24.549,6.105c13.689,3.42,16.159,12.478,15.75,19.658L208.93,357.23
            c-1.675,4.158-5.925,10.401-15.494,8.031c0.338,0.485-24.579-6.134-24.579-6.134l-9.631,40.468l36.843,9.188
            c8.178,2.051,16.209,4.19,24.098,6.217l-13.978,56.17l33.764,8.424l13.852-55.571c9.235,2.499,18.186,4.813,26.948,6.995
            l-13.802,55.309l33.801,8.424l13.994-56.061c57.648,10.902,100.998,6.502,119.237-45.627c14.705-41.979-0.731-66.193-31.06-81.984
            C425.008,305.984,441.655,291.455,446.089,261.45z M368.859,369.754c-10.455,41.983-81.128,19.285-104.052,13.589l18.562-74.404
            C306.28,314.65,379.774,325.975,368.859,369.754z M379.302,260.846c-9.527,38.187-68.358,18.781-87.442,14.023l16.828-67.489
            C327.767,212.14,389.234,221.02,379.302,260.846z"/>
        </svg>
      </div>

      <div className="verify-container">
        <div className="verify-badge">
          <Search size={16} />
          <span>Verification Portal</span>
        </div>
        
        <h2 className="verify-title">
          Verify a Credential
        </h2>
        
        <p className="verify-subtitle">
          Ensure the document you hold is authentic. Check its status against the blockchain ledger.
        </p>

        <div className="verify-tabs">
          <button
            onClick={() => {
              setActiveTab('id');
              resetVerification();
            }}
            className={`verify-tab ${activeTab === 'id' ? 'active' : ''}`}
            disabled={isVerifying}
          >
            Verify by ID
          </button>
          <button
            onClick={() => {
              setActiveTab('upload');
              resetVerification();
            }}
            className={`verify-tab ${activeTab === 'upload' ? 'active' : ''}`}
            disabled={isVerifying}
          >
            Upload PDF
          </button>
        </div>

        <div className="verify-card">
          {!verificationResult ? (
            activeTab === 'id' ? (
              <form onSubmit={handleSearch} className="verify-input-group">
                <div className="verify-input-wrapper">
                  <ShieldCheck className="verify-input-icon" size={20} />
                  <input 
                    type="text" 
                    placeholder="Enter Certificate ID (e.g. BD-2025-XYZ)" 
                    className="verify-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isVerifying}
                  />
                </div>
                <button 
                  type="submit"
                  className="verify-btn"
                  disabled={isVerifying || !searchQuery.trim()}
                >
                  {isVerifying ? (
                    <LoadingSpinner size="small" color="white" />
                  ) : (
                    'Verify ID'
                  )}
                </button>
              </form>
            ) : (
              <div className="verify-input-group">
                <div className="verify-upload-wrapper">
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="verify-file-input"
                    ref={fileInputRef}
                    disabled={isVerifying}
                  />
                  <div 
                    className={`verify-upload-area ${dragActive ? 'active' : ''} ${isVerifying ? 'processing' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !isVerifying && fileInputRef.current?.click()}
                  >
                    {isVerifying ? (
                      <div className="verify-upload-loading">
                        <LoadingSpinner size="medium" color="orange" />
                        <span className="verify-upload-text">Processing document...</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="verify-upload-icon" size={20} />
                        <span className={`verify-upload-text ${fileName ? 'has-file' : ''}`}>
                          {fileName || "Click to select or drag PDF here"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="verify-result-container">
              <div className={`verification-result ${verificationResult.isValid ? 'valid' : 'invalid'}`}>
                <div className="result-header">
                  <div className="result-icon-wrapper">
                    {verificationResult.isValid ? (
                      <CheckCircle size={32} className="result-icon" />
                    ) : (
                      <X size={32} className="result-icon" />
                    )}
                  </div>
                  <div className="result-text">
                    <h3>{verificationResult.isValid ? 'Valid Certificate' : 'Invalid Certificate'}</h3>
                    <p>{verificationResult.reason}</p>
                  </div>
                </div>

                {verificationResult.isValid && verificationResult.certificate && (
                  <div className="result-details">
                    <div className="cert-details-card">
                      <div className="cert-info">
                        <div className="detail-row">
                          <span className="detail-label">Certificate Type:</span>
                          <span className="detail-value">{verificationResult.certificate.certificateType || 'Certificate of Completion'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Student Name:</span>
                          <span className="detail-value">{verificationResult.certificate.studentName}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Course:</span>
                          <span className="detail-value">{verificationResult.certificate.courseType}</span>
                        </div>
                        {verificationResult.certificate.cohort && (
                          <div className="detail-row">
                            <span className="detail-label">Cohort:</span>
                            <span className="detail-value">{verificationResult.certificate.cohort}</span>
                          </div>
                        )}
                        <div className="detail-row">
                          <span className="detail-label">Issue Date:</span>
                          <span className="detail-value">{new Date(verificationResult.certificate.issueDate).toLocaleDateString()}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Certificate ID:</span>
                          <span className="detail-value cert-id">{verificationResult.certificate.id}</span>
                        </div>
                      </div>
                      {verificationResult.type === 'id' && (
                        <button 
                          onClick={() => downloadCertificate(verificationResult.certificate)}
                          className="btn-download-cert"
                        >
                          Download Certificate
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                onClick={resetVerification}
                className="btn-verify-another"
              >
                Verify Another Certificate
              </button>
            </div>
          )}
        </div>
        
        <p className="verify-footer-text">
          Protected by SHA-256 Encryption. <Link to="/blog/security" className="verify-link">Learn about our security</Link>
        </p>
      </div>
    </section>
  );
};

const Footer = () => {
  const { theme } = useTheme();
  
  return (
    <footer className="landing-footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo-row">
              <img 
                src={theme === 'dark' ? '/logo-dark.png' : '/logo.png'} 
                alt="Bitcoin Dada" 
                className="footer-logo-image"
              />
              <span className="footer-logo-text">Bitcoin Dada</span>
            </div>
            <p className="footer-description">
              Empowering Women in Blockchain through verifiable education. Building a future where achievements are owned, not just rented.
            </p>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-heading">Platform</h4>
            <ul className="footer-links">
              <li><a href="#verify" className="footer-link">Verify Certificate</a></li>
              <li><Link to="/admin/login" className="footer-link">Admin Login</Link></li>
              <li><a href="#" className="footer-link">Partner API</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-heading">Support</h4>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">Help Center</a></li>
              <li><a href="#" className="footer-link">Contact Us</a></li>
              <li><a href="#" className="footer-link">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-copyright">
            &copy; 2025 Bitcoin Dada Digital Systems. All rights reserved.
          </div>
          <div className="footer-social">
            <div className="footer-social-icon"></div>
            <div className="footer-social-icon"></div>
            <div className="footer-social-icon"></div>
          </div>
        </div>
      </div>
    </footer>
  );
};

function LandingPage() {
  useEffect(() => {
    // Handle hash navigation with smooth scroll
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#verify') {
        const element = document.getElementById('verify');
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      }
    };

    // Check on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="landing-page">
      <Navbar />
      <main>
        <Hero />
        
        <div className="landing-trust-bar">
          <div className="trust-bar-container">
            <img src="https://btcdada.com/wp-content/uploads/2023/12/1.png" alt="Blockchain.com" className="trust-logo" />
            <img src="https://btcdada.com/wp-content/uploads/2023/12/2.png" alt="Binance Academy" className="trust-logo" />
            <img src="https://btcdada.com/wp-content/uploads/2023/12/3.png" alt="Ethereum Foundation" className="trust-logo" />
            <img src="https://btcdada.com/wp-content/uploads/2025/02/Trezor.png" alt="Trezor" className="trust-logo" />
            <img src="https://btcdada.com/wp-content/uploads/2025/02/Bitnob.png" alt="Bitnob" className="trust-logo" />
          </div>
        </div>

        <Features />
        <Workflow />
        <VerifySection />
      </main>
      <Footer />
      <ThemeToggle variant="floating" />
    </div>
  );
}

export default LandingPage;
