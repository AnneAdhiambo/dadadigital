import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Lock, 
  Shield, 
  Key, 
  CheckCircle, 
  AlertTriangle,
  Hash,
  FileText,
  Database,
  Globe,
  Zap
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import './Blog.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`blog-navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="blog-nav-container">
        <Link to="/" className="blog-nav-logo">
          <img 
            src={theme === 'dark' ? '/logo-dark.png' : '/logo.png'} 
            alt="Bitcoin Dada Logo" 
            className="blog-nav-logo-image"
          />
        </Link>
        <Link to="/" className="blog-back-link">
          <ArrowLeft size={18} />
          Back to Home
        </Link>
      </div>
    </nav>
  );
};

const SHA256Article = () => {
  const { theme } = useTheme();

  return (
    <article className="blog-article">
      {/* Hero Section */}
      <header className="blog-hero">
        <div className="blog-hero-content">
          <div className="blog-badge">
            <Shield size={16} />
            <span>Security Deep Dive</span>
          </div>
          <h1 className="blog-title">Understanding SHA-256: The Cryptographic Foundation of Our Certificate System</h1>
          <p className="blog-subtitle">
            Learn how SHA-256 encryption protects your digital certificates and why it's the gold standard for blockchain security.
          </p>
          <div className="blog-meta">
            <span className="blog-date">Published: January 2025</span>
            <span className="blog-read-time">8 min read</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="blog-content">
        {/* Introduction */}
        <section className="blog-section">
          <p className="blog-lead">
            At Bitcoin Dada Digital Systems, we take security seriously. Every certificate issued through our platform is protected by <strong>SHA-256 encryption</strong>, the same cryptographic hash function that secures the Bitcoin blockchain. This article explains what SHA-256 is, how it works, and why we chose it as the foundation for our certificate verification system.
          </p>
        </section>

        {/* What is SHA-256 */}
        <section className="blog-section">
          <div className="blog-section-header">
            <Hash className="blog-section-icon" size={32} />
            <h2>What is SHA-256?</h2>
          </div>
          <p>
            <strong>SHA-256</strong> (Secure Hash Algorithm 256-bit) is a cryptographic hash function that takes an input of any size and produces a fixed-size 256-bit (32-byte) output, known as a hash or digest. It's part of the SHA-2 family of hash functions designed by the National Security Agency (NSA) and published by the National Institute of Standards and Technology (NIST) in 2001.
          </p>
          
          <div className="blog-info-box">
            <div className="info-box-header">
              <Key size={20} />
              <h3>Key Characteristics</h3>
            </div>
            <ul className="info-box-list">
              <li><strong>Deterministic:</strong> The same input always produces the same hash</li>
              <li><strong>One-way function:</strong> You cannot reverse the hash to get the original input</li>
              <li><strong>Avalanche effect:</strong> A tiny change in input produces a completely different hash</li>
              <li><strong>Fixed output size:</strong> Always produces a 256-bit (64 hexadecimal characters) output</li>
              <li><strong>Collision-resistant:</strong> Extremely difficult to find two different inputs with the same hash</li>
            </ul>
          </div>
        </section>

        {/* How SHA-256 Works */}
        <section className="blog-section">
          <div className="blog-section-header">
            <Zap className="blog-section-icon" size={32} />
            <h2>How SHA-256 Works</h2>
          </div>
          
          <p>
            SHA-256 processes data through a series of mathematical operations. Here's a simplified breakdown of the process:
          </p>

          <div className="blog-diagram">
            <div className="diagram-container">
              <div className="diagram-step">
                <div className="step-box input">
                  <FileText size={24} />
                  <div className="step-label">Input Data</div>
                  <div className="step-example">Certificate Data</div>
                </div>
                <div className="step-arrow">→</div>
                <div className="step-box process">
                  <Hash size={24} />
                  <div className="step-label">SHA-256 Processing</div>
                  <div className="step-details">
                    <div>• Padding</div>
                    <div>• Message Blocks</div>
                    <div>• Compression Function</div>
                    <div>• 64 Rounds</div>
                  </div>
                </div>
                <div className="step-arrow">→</div>
                <div className="step-box output">
                  <Database size={24} />
                  <div className="step-label">256-bit Hash</div>
                  <div className="step-example hash-example">
                    a3f5d8e2b1c9...
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h3>The Process in Detail</h3>
          <ol className="blog-numbered-list">
            <li>
              <strong>Padding:</strong> The input is padded to ensure it's a multiple of 512 bits. This includes adding a '1' bit, zeros, and the original message length.
            </li>
            <li>
              <strong>Message Blocks:</strong> The padded message is divided into 512-bit blocks.
            </li>
            <li>
              <strong>Initial Hash Values:</strong> SHA-256 starts with eight 32-bit constants derived from the fractional parts of square roots of the first 8 primes.
            </li>
            <li>
              <strong>Compression Function:</strong> Each block goes through 64 rounds of compression using bitwise operations (AND, OR, XOR, NOT), modular addition, and rotation.
            </li>
            <li>
              <strong>Final Hash:</strong> After processing all blocks, the final hash values are concatenated to produce the 256-bit output.
            </li>
          </ol>
        </section>

        {/* Why SHA-256 for Certificates */}
        <section className="blog-section">
          <div className="blog-section-header">
            <Shield className="blog-section-icon" size={32} />
            <h2>Why We Chose SHA-256 for Our Certificate System</h2>
          </div>

          <p>
            When designing our certificate verification system, we evaluated multiple cryptographic options. SHA-256 emerged as the clear choice for several critical reasons:
          </p>

          <div className="blog-features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Lock size={32} />
              </div>
              <h3>Proven Security</h3>
              <p>
                SHA-256 has been battle-tested for over two decades. It's the same algorithm securing Bitcoin, the world's most valuable cryptocurrency, with over $1 trillion in value protected.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Globe size={32} />
              </div>
              <h3>Industry Standard</h3>
              <p>
                SHA-256 is widely adopted across industries—from SSL/TLS certificates to blockchain networks. This ensures compatibility and trust from users and institutions.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Zap size={32} />
              </div>
              <h3>Computational Efficiency</h3>
              <p>
                SHA-256 is fast to compute, allowing instant verification of certificates without performance bottlenecks, even when processing thousands of certificates.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <CheckCircle size={32} />
              </div>
              <h3>Tamper Detection</h3>
              <p>
                The avalanche effect means any modification to certificate data—even changing a single character—produces a completely different hash, making tampering immediately detectable.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Database size={32} />
              </div>
              <h3>Deterministic Verification</h3>
              <p>
                The same certificate data always produces the same hash, enabling anyone to verify authenticity by recalculating and comparing hashes.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Shield size={32} />
              </div>
              <h3>Future-Proof</h3>
              <p>
                While quantum computing poses theoretical threats to some algorithms, SHA-256 remains secure against current and foreseeable threats, with quantum-resistant alternatives already in development.
              </p>
            </div>
          </div>
        </section>

        {/* How We Use SHA-256 */}
        <section className="blog-section">
          <div className="blog-section-header">
            <FileText className="blog-section-icon" size={32} />
            <h2>How We Implement SHA-256 in Our System</h2>
          </div>

          <p>
            Our certificate system uses SHA-256 in two critical ways to ensure maximum security:
          </p>

          <div className="blog-process-flow">
            <div className="process-step">
              <div className="process-number">1</div>
              <div className="process-content">
                <h3>Certificate Data Hashing</h3>
                <p>
                  When a certificate is issued, we create a digital signature by hashing all certificate data (student name, course, date, ID, etc.) using SHA-256. This hash is stored with the certificate.
                </p>
                <div className="code-example">
                  <div className="code-label">Certificate Data:</div>
                  <code>
                    {`{
  "id": "BD-2025-XYZ",
  "studentName": "Jane Doe",
  "courseType": "Bitcoin & Blockchain",
  "issueDate": "2025-01-15"
}`}
                  </code>
                  <div className="code-label">SHA-256 Hash:</div>
                  <code className="hash-code">a3f5d8e2b1c9f4a7e6d2c8b5a1f3e9d7c4b2a8f6e3d1c9b7a5f4e2d8c6b4a1f9</code>
                </div>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">2</div>
              <div className="process-content">
                <h3>PDF Document Hashing</h3>
                <p>
                  When a PDF certificate is generated, we calculate the SHA-256 hash of the entire PDF file. This hash is stored and can be used to verify the PDF hasn't been modified.
                </p>
                <div className="code-example">
                  <div className="code-label">PDF File Hash Verification:</div>
                  <code className="hash-code">
                    Upload PDF → Calculate SHA-256 → Compare with stored hash → Verify authenticity
                  </code>
                </div>
              </div>
            </div>
          </div>

          <div className="blog-warning-box">
            <AlertTriangle size={20} />
            <div>
              <h3>Tamper Detection in Action</h3>
              <p>
                If someone modifies a certificate PDF (even by changing a single pixel), the SHA-256 hash will be completely different. Our system detects this immediately during verification, marking the certificate as invalid or tampered.
              </p>
            </div>
          </div>
        </section>

        {/* Security Guarantees */}
        <section className="blog-section">
          <div className="blog-section-header">
            <Shield className="blog-section-icon" size={32} />
            <h2>Security Guarantees</h2>
          </div>

          <p>
            SHA-256 provides several critical security guarantees for our certificate system:
          </p>

          <div className="blog-security-list">
            <div className="security-item">
              <CheckCircle className="security-icon" size={24} />
              <div>
                <h3>Integrity Verification</h3>
                <p>Any modification to certificate data is immediately detectable through hash comparison.</p>
              </div>
            </div>
            <div className="security-item">
              <CheckCircle className="security-icon" size={24} />
              <div>
                <h3>Non-repudiation</h3>
                <p>The hash serves as cryptographic proof that the certificate data hasn't changed since issuance.</p>
              </div>
            </div>
            <div className="security-item">
              <CheckCircle className="security-icon" size={24} />
              <div>
                <h3>Collision Resistance</h3>
                <p>The probability of two different certificates producing the same hash is astronomically low (2²⁵⁶ possible hashes).</p>
              </div>
            </div>
            <div className="security-item">
              <CheckCircle className="security-icon" size={24} />
              <div>
                <h3>One-Way Function</h3>
                <p>Even if someone obtains a hash, they cannot reverse it to create or modify certificate data.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Real-World Example */}
        <section className="blog-section">
          <div className="blog-section-header">
            <FileText className="blog-section-icon" size={32} />
            <h2>Real-World Example: Certificate Verification</h2>
          </div>

          <p>
            Here's how SHA-256 protects a certificate in our system:
          </p>

          <div className="blog-example-box">
            <h3>Scenario: Verifying Certificate BD-2025-ABC123</h3>
            <div className="example-steps">
              <div className="example-step">
                <div className="example-step-number">1</div>
                <div className="example-step-content">
                  <strong>Certificate Issued:</strong>
                  <p>System creates hash of certificate data: <code>7f3a9b2e...</code></p>
                </div>
              </div>
              <div className="example-step">
                <div className="example-step-number">2</div>
                <div className="example-step-content">
                  <strong>Hash Stored:</strong>
                  <p>Hash is stored securely with certificate metadata.</p>
                </div>
              </div>
              <div className="example-step">
                <div className="example-step-number">3</div>
                <div className="example-step-content">
                  <strong>Verification Request:</strong>
                  <p>User submits certificate ID or uploads PDF for verification.</p>
                </div>
              </div>
              <div className="example-step">
                <div className="example-step-number">4</div>
                <div className="example-step-content">
                  <strong>Hash Recalculation:</strong>
                  <p>System recalculates hash from stored certificate data or uploaded PDF.</p>
                </div>
              </div>
              <div className="example-step">
                <div className="example-step-number">5</div>
                <div className="example-step-content">
                  <strong>Comparison:</strong>
                  <p>If hashes match → Certificate is <strong className="valid">VALID</strong></p>
                  <p>If hashes differ → Certificate is <strong className="invalid">INVALID or TAMPERED</strong></p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Conclusion */}
        <section className="blog-section blog-conclusion">
          <h2>Conclusion</h2>
          <p>
            SHA-256 is more than just a cryptographic algorithm—it's the foundation of trust in our digital certificate system. By leveraging the same security technology that protects Bitcoin and secures internet communications worldwide, we ensure that every certificate issued through Bitcoin Dada Digital Systems is:
          </p>
          <ul className="blog-conclusion-list">
            <li>Cryptographically secure and tamper-proof</li>
            <li>Instantly verifiable by anyone, anywhere</li>
            <li>Protected by industry-standard encryption</li>
            <li>Future-proof against emerging threats</li>
          </ul>
          <p>
            When you verify a certificate on our platform, you're not just checking a database—you're performing a cryptographic verification that proves the certificate's authenticity beyond any doubt. This is the power of SHA-256, and this is why we chose it as the cornerstone of our security architecture.
          </p>
        </section>

        {/* CTA Section */}
        <section className="blog-cta">
          <div className="cta-content">
            <h2>Ready to Verify a Certificate?</h2>
            <p>Experience SHA-256 security in action by verifying a certificate on our platform.</p>
            <Link to="/#verify" className="cta-button">
              Verify Certificate Now
              <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
};

function Blog() {
  return (
    <div className="blog-page">
      <Navbar />
      <SHA256Article />
      <ThemeToggle variant="floating" />
    </div>
  );
}

export default Blog;

