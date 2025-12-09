import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  Zap,
  Server,
  Network,
  Cloud,
  Cpu,
  HardDrive,
  ArrowRight,
  Circle,
  Search
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

const TechnologyArticle = () => {
  const { theme } = useTheme();

  return (
    <article className="blog-article">
      {/* Hero Section */}
      <header className="blog-hero">
        <div className="blog-hero-content">
          <div className="blog-badge">
            <Cpu size={16} />
            <span>Technology Deep Dive</span>
          </div>
          <h1 className="blog-title">Our Technology Stack: Building Trust Through Innovation</h1>
          <p className="blog-subtitle">
            Discover how Bitcoin Dada Digital Systems processes, stores, and secures your certificates using cutting-edge technology including PostgreSQL, Nostr protocol, and distributed relay networks.
          </p>
          <div className="blog-meta">
            <span className="blog-date">Published: January 2025</span>
            <span className="blog-read-time">3 min read</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="blog-content">
        {/* Introduction */}
        <section className="blog-section">
          <p className="blog-lead">
            At <strong>Bitcoin Dada Digital Systems</strong>, we've built a robust, secure, and scalable platform for issuing and verifying digital certificates. Our technology stack combines proven database systems, decentralized protocols, and cryptographic security to ensure your achievements are permanently recorded and instantly verifiable. This article provides a comprehensive overview of how we process data, store information, and leverage the Nostr protocol with multiple relay networks.
          </p>
        </section>

        {/* How We Process Things */}
        <section className="blog-section">
          <div className="blog-section-header">
            <Zap className="blog-section-icon" size={32} />
            <h2>How We Process Certificates</h2>
          </div>
          
          <p>
            Our certificate processing pipeline is designed for security, speed, and reliability. Here's how a certificate moves through our system:
          </p>

          <div className="blog-process-flow">
            <div className="process-step">
              <div className="process-number">1</div>
              <div className="process-content">
                <h3>Data Collection & Validation</h3>
                <p>
                  When an admin issues a certificate, we collect and validate all required information: student name, course type, cohort, issue date, and any additional metadata. All inputs are sanitized and validated before processing.
                </p>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">2</div>
              <div className="process-content">
                <h3>SHA-256 Hashing</h3>
                <p>
                  The certificate data is cryptographically hashed using SHA-256, creating a unique digital fingerprint. This hash serves as the immutable proof of the certificate's authenticity and cannot be forged or tampered with.
                </p>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">3</div>
              <div className="process-content">
                <h3>PDF Generation</h3>
                <p>
                  We generate a professional PDF certificate using our template system. The PDF includes all certificate information, a QR code for verification, and visual security elements. The PDF itself is also hashed for tamper detection.
                </p>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">4</div>
              <div className="process-content">
                <h3>Database Storage</h3>
                <p>
                  All certificate data, hashes, and metadata are stored in our <strong>PostgreSQL database</strong>, ensuring ACID compliance, data integrity, and reliable retrieval. PostgreSQL provides the robustness needed for critical certificate data.
                </p>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">5</div>
              <div className="process-content">
                <h3>Nostr Publishing</h3>
                <p>
                  Each certificate is published to the <strong>Nostr protocol</strong> across multiple relays, creating a decentralized, censorship-resistant record. This ensures your certificate exists beyond any single point of failure.
                </p>
              </div>
            </div>
          </div>

          <div className="blog-diagram">
            <div className="diagram-container">
              <div className="diagram-step">
                <div className="step-box input">
                  <FileText size={24} />
                  <div className="step-label">Certificate Data</div>
                  <div className="step-example">Input & Validation</div>
                </div>
                <div className="step-arrow">→</div>
                <div className="step-box process">
                  <Hash size={24} />
                  <div className="step-label">SHA-256 Hashing</div>
                  <div className="step-details">
                    <div>• Data Integrity</div>
                    <div>• Tamper Detection</div>
                  </div>
                </div>
                <div className="step-arrow">→</div>
                <div className="step-box process">
                  <Database size={24} />
                  <div className="step-label">PostgreSQL</div>
                  <div className="step-details">
                    <div>• ACID Compliance</div>
                    <div>• Reliable Storage</div>
                  </div>
                </div>
                <div className="step-arrow">→</div>
                <div className="step-box output">
                  <Network size={24} />
                  <div className="step-label">Nostr Relays</div>
                  <div className="step-example">Decentralized</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data Storage with PostgreSQL */}
        <section className="blog-section">
          <div className="blog-section-header">
            <Database className="blog-section-icon" size={32} />
            <h2>Data Storage: PostgreSQL Database</h2>
          </div>

          <p>
            We use <strong>PostgreSQL</strong> as our primary database system for storing all certificate data. PostgreSQL is an open-source, enterprise-grade relational database that provides:
          </p>

          <div className="blog-features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Shield size={32} />
              </div>
              <h3>ACID Compliance</h3>
              <p>
                Atomicity, Consistency, Isolation, and Durability ensure that certificate data is always stored correctly, even in the event of system failures.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <HardDrive size={32} />
              </div>
              <h3>Data Integrity</h3>
              <p>
                Foreign keys, constraints, and transactions guarantee that certificate relationships and data remain consistent and valid.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Zap size={32} />
              </div>
              <h3>Performance</h3>
              <p>
                PostgreSQL's advanced indexing and query optimization allow us to retrieve and verify certificates instantly, even with millions of records.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Lock size={32} />
              </div>
              <h3>Security</h3>
              <p>
                Built-in encryption, role-based access control, and audit logging protect certificate data from unauthorized access and modifications.
              </p>
            </div>
          </div>

          <div className="blog-info-box">
            <div className="info-box-header">
              <Database size={20} />
              <h3>Our Database Schema</h3>
            </div>
            <p>
              Our PostgreSQL database stores certificates with the following key fields:
            </p>
            <ul className="info-box-list">
              <li><strong>Certificate ID:</strong> Unique identifier (e.g., BD-2025-XYZ)</li>
              <li><strong>Student Information:</strong> Name, course, cohort, issue date</li>
              <li><strong>SHA-256 Hashes:</strong> Both data hash and PDF hash</li>
              <li><strong>Nostr Metadata:</strong> Event IDs, public keys, relay information</li>
              <li><strong>Timestamps:</strong> Created, updated, and published timestamps</li>
              <li><strong>Status:</strong> Issued, verified, revoked (if applicable)</li>
            </ul>
          </div>
        </section>

        {/* Nostr Protocol */}
        <section className="blog-section">
          <div className="blog-section-header">
            <Network className="blog-section-icon" size={32} />
            <h2>The Nostr Protocol: Decentralized Verification</h2>
          </div>

          <p>
            <strong>Nostr</strong> (Notes and Other Stuff Transmitted by Relays) is a decentralized protocol that enables censorship-resistant communication and data storage. We leverage Nostr to publish certificates, ensuring they exist on a distributed network that cannot be shut down or censored.
          </p>

          <div className="blog-info-box">
            <div className="info-box-header">
              <Globe size={20} />
              <h3>Why Nostr?</h3>
            </div>
            <ul className="info-box-list">
              <li><strong>Decentralization:</strong> No single point of failure or control</li>
              <li><strong>Censorship Resistance:</strong> Certificates cannot be removed by any single entity</li>
              <li><strong>Open Protocol:</strong> Anyone can run a relay or client</li>
              <li><strong>Cryptographic Signatures:</strong> All events are cryptographically signed</li>
              <li><strong>Global Accessibility:</strong> Certificates are accessible from anywhere in the world</li>
            </ul>
          </div>

          <h3>How Nostr Works in Our System</h3>
          <p>
            When a certificate is issued, we create a Nostr event (Kind 1 - Text Note) containing:
          </p>
          <ul className="blog-numbered-list">
            <li>Certificate metadata (student name, course, date, ID)</li>
            <li>The SHA-256 hash of the certificate PDF</li>
            <li>Verification URL for easy access</li>
            <li>Relevant tags for searchability (#certificate, #bitcoindada, #proofofexistence)</li>
          </ul>
          <p>
            This event is cryptographically signed with our private key and published to multiple relays, creating redundant copies across the network.
          </p>
        </section>

        {/* Relays We Use */}
        <section className="blog-section">
          <div className="blog-section-header">
            <Server className="blog-section-icon" size={32} />
            <h2>Nostr Relays We Use</h2>
          </div>

          <p>
            To ensure maximum redundancy and availability, we publish each certificate to <strong>multiple Nostr relays</strong>. This means your certificate exists in multiple locations, making it virtually impossible to lose or censor. Here are all the relays we currently use:
          </p>

          <div className="blog-features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Server size={32} />
              </div>
              <h3>Yakihonne Relays</h3>
              <p>
                <strong>wss://nostr-01.yakihonne.com</strong><br />
                <strong>wss://nostr-02.yakihonne.com</strong><br />
                Required for publishing to the Yakihonne platform. These are strfry-based relays providing high reliability.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Globe size={32} />
              </div>
              <h3>Damus Relay</h3>
              <p>
                <strong>wss://relay.damus.io</strong><br />
                One of the most popular Nostr relays, operated by the Damus team. High availability and global reach.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Cloud size={32} />
              </div>
              <h3>Primal Relay</h3>
              <p>
                <strong>wss://relay.primal.net</strong><br />
                A fast, reliable relay with excellent performance. Part of the Primal ecosystem.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Network size={32} />
              </div>
              <h3>Nos.lol</h3>
              <p>
                <strong>wss://nos.lol</strong><br />
                A community-run relay known for stability and open access policies.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Server size={32} />
              </div>
              <h3>Nostr.band</h3>
              <p>
                <strong>wss://relay.nostr.band</strong><br />
                A popular relay with search capabilities and good uptime. Great for discoverability.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Globe size={32} />
              </div>
              <h3>Snort Social</h3>
              <p>
                <strong>wss://relay.snort.social</strong><br />
                Operated by the Snort client team. Well-maintained and widely used in the Nostr ecosystem.
              </p>
            </div>
          </div>

          <div className="blog-warning-box">
            <CheckCircle size={20} />
            <div>
              <h3>Redundancy & Reliability</h3>
              <p>
                By publishing to <strong>7 different relays</strong>, we ensure that even if some relays go offline or become unavailable, your certificate remains accessible through other relays. This multi-relay approach provides exceptional durability and censorship resistance.
              </p>
            </div>
          </div>
        </section>

        {/* System Architecture */}
        <section className="blog-section">
          <div className="blog-section-header">
            <Cpu className="blog-section-icon" size={32} />
            <h2>System Architecture Overview</h2>
          </div>

          <p>
            Our system architecture is designed for scalability, security, and reliability:
          </p>

          <div className="blog-diagram">
            <div className="diagram-container">
              <div className="diagram-step" style={{ flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div className="step-box input">
                    <FileText size={24} />
                    <div className="step-label">Admin Interface</div>
                    <div className="step-example">Certificate Issuance</div>
                  </div>
                  <div className="step-arrow">→</div>
                  <div className="step-box process">
                    <Cpu size={24} />
                    <div className="step-label">Processing Engine</div>
                    <div className="step-details">
                      <div>• SHA-256 Hashing</div>
                      <div>• PDF Generation</div>
                    </div>
                  </div>
                  <div className="step-arrow">→</div>
                  <div className="step-box process">
                    <Database size={24} />
                    <div className="step-label">PostgreSQL</div>
                    <div className="step-details">
                      <div>• Data Storage</div>
                      <div>• Query Engine</div>
                    </div>
                  </div>
                </div>
                <div className="step-arrow" style={{ transform: 'rotate(90deg)' }}>↓</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div className="step-box output">
                    <Network size={24} />
                    <div className="step-label">Nostr Protocol</div>
                    <div className="step-example">7 Relays</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Conclusion */}
        <section className="blog-section blog-conclusion">
          <h2>Conclusion</h2>
          <p>
            Our technology stack combines the best of traditional database systems (PostgreSQL) with cutting-edge decentralized protocols (Nostr) to create a certificate system that is:
          </p>
          <ul className="blog-conclusion-list">
            <li><strong>Secure:</strong> SHA-256 hashing and cryptographic signatures</li>
            <li><strong>Reliable:</strong> PostgreSQL ACID compliance and data integrity</li>
            <li><strong>Decentralized:</strong> Multiple Nostr relays ensure redundancy</li>
            <li><strong>Censorship-Resistant:</strong> No single point of failure or control</li>
            <li><strong>Scalable:</strong> Built to handle millions of certificates</li>
            <li><strong>Transparent:</strong> Open protocols and verifiable data</li>
          </ul>
          <p>
            By leveraging PostgreSQL for reliable storage and Nostr for decentralized publishing, we've created a system that combines the best of both centralized and decentralized technologies. Your certificates are stored securely in our database while also existing on a global, distributed network that cannot be shut down.
          </p>
        </section>

        {/* CTA Section with Link to Relays Blog */}
        <section className="blog-cta">
          <div className="cta-content">
            <h2>Want to Learn More?</h2>
            <p>
              Now that you have understood our technology, <Link to="/blog/relays" style={{ color: 'var(--binance-yellow)', textDecoration: 'underline', fontWeight: 600 }}>let's see how relays work</Link>.
            </p>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Link to="/blog/relays" className="cta-button">
                Learn How Relays Work
                <ArrowRight size={18} />
              </Link>
              <Circle 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  right: '-2.5rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  animation: 'pulse 2s infinite',
                  color: 'var(--binance-yellow)'
                }} 
              />
            </div>
          </div>
        </section>
      </div>
    </article>
  );
};

const RelaysArticle = () => {
  const { theme } = useTheme();

  return (
    <article className="blog-article">
      {/* Hero Section */}
      <header className="blog-hero">
        <div className="blog-hero-content">
          <div className="blog-badge">
            <Network size={16} />
            <span>Nostr Deep Dive</span>
          </div>
          <h1 className="blog-title">How Nostr Relays Work: The Backbone of Decentralized Verification</h1>
          <p className="blog-subtitle">
            Understand how Nostr relays enable decentralized, censorship-resistant certificate storage and verification across a global network.
          </p>
          <div className="blog-meta">
            <span className="blog-date">Published: January 2025</span>
            <span className="blog-read-time">5 min read</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="blog-content">
        {/* Introduction */}
        <section className="blog-section">
          <p className="blog-lead">
            <strong>Nostr relays</strong> are the servers that store and forward messages in the Nostr protocol. Unlike traditional centralized servers, relays are independent, can be run by anyone, and work together to create a resilient, decentralized network. This article explains how relays function, why we use multiple relays, and how they ensure your certificates remain accessible forever.
          </p>
        </section>

        {/* What is a Relay */}
        <section className="blog-section">
          <div className="blog-section-header">
            <Server className="blog-section-icon" size={32} />
            <h2>What is a Nostr Relay?</h2>
          </div>
          
          <p>
            A <strong>Nostr relay</strong> is a simple server that accepts events (messages) from clients, stores them, and forwards them to other clients that request them. Think of it as a post office: you send a message (event) to the relay, and it holds onto it until someone asks for it.
          </p>

          <div className="blog-info-box">
            <div className="info-box-header">
              <Server size={20} />
              <h3>Key Characteristics of Relays</h3>
            </div>
            <ul className="info-box-list">
              <li><strong>Stateless:</strong> Relays don't maintain user sessions or connections</li>
              <li><strong>Event-Based:</strong> They store and serve discrete events, not continuous streams</li>
              <li><strong>Open Protocol:</strong> Anyone can run a relay using the open Nostr specification</li>
              <li><strong>Independent:</strong> Each relay operates independently without coordination</li>
              <li><strong>WebSocket-Based:</strong> Communication happens over WebSocket (WSS) connections</li>
            </ul>
          </div>
        </section>

        {/* How Relays Work */}
        <section className="blog-section">
          <div className="blog-section-header">
            <Zap className="blog-section-icon" size={32} />
            <h2>How Relays Process Events</h2>
          </div>
          
          <p>
            When we publish a certificate to Nostr, here's what happens behind the scenes:
          </p>

          <div className="blog-process-flow">
            <div className="process-step">
              <div className="process-number">1</div>
              <div className="process-content">
                <h3>Event Creation</h3>
                <p>
                  Our system creates a Nostr event containing the certificate data. This event includes the content (certificate information), tags (metadata), and a cryptographic signature proving authenticity.
                </p>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">2</div>
              <div className="process-content">
                <h3>Connection to Relays</h3>
                <p>
                  We establish WebSocket connections to all 7 relays simultaneously. Each connection is independent, so if one relay is down, others continue to work.
                </p>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">3</div>
              <div className="process-content">
                <h3>Event Publishing</h3>
                <p>
                  The signed event is sent to each relay. The relay validates the signature to ensure the event is authentic and hasn't been tampered with.
                </p>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">4</div>
              <div className="process-content">
                <h3>Storage</h3>
                <p>
                  Each relay stores the event in its database. Different relays use different storage backends (PostgreSQL, SQLite, etc.), but all follow the same protocol.
                </p>
              </div>
            </div>

            <div className="process-step">
              <div className="process-number">5</div>
              <div className="process-content">
                <h3>Distribution</h3>
                <p>
                  When someone wants to verify a certificate, they query any relay. The relay searches its database and returns matching events. Since we publish to multiple relays, the certificate is available from any of them.
                </p>
              </div>
            </div>
          </div>

          <div className="blog-diagram">
            <div className="diagram-container">
              <div className="diagram-step" style={{ flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div className="step-box input">
                    <FileText size={24} />
                    <div className="step-label">Our System</div>
                    <div className="step-example">Publishes Event</div>
                  </div>
                </div>
                <div className="step-arrow" style={{ transform: 'rotate(90deg)' }}>↓</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div className="step-box process" style={{ minWidth: '150px' }}>
                    <Server size={20} />
                    <div className="step-label">Relay 1</div>
                  </div>
                  <div className="step-box process" style={{ minWidth: '150px' }}>
                    <Server size={20} />
                    <div className="step-label">Relay 2</div>
                  </div>
                  <div className="step-box process" style={{ minWidth: '150px' }}>
                    <Server size={20} />
                    <div className="step-label">Relay 3</div>
                  </div>
                  <div className="step-box process" style={{ minWidth: '150px' }}>
                    <Server size={20} />
                    <div className="step-label">Relay 4</div>
                  </div>
                  <div className="step-box process" style={{ minWidth: '150px' }}>
                    <Server size={20} />
                    <div className="step-label">Relay 5</div>
                  </div>
                  <div className="step-box process" style={{ minWidth: '150px' }}>
                    <Server size={20} />
                    <div className="step-label">Relay 6</div>
                  </div>
                  <div className="step-box process" style={{ minWidth: '150px' }}>
                    <Server size={20} />
                    <div className="step-label">Relay 7</div>
                  </div>
                </div>
                <div className="step-arrow" style={{ transform: 'rotate(90deg)' }}>↓</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div className="step-box output">
                    <CheckCircle size={24} />
                    <div className="step-label">Global Network</div>
                    <div className="step-example">Redundant Storage</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Multiple Relays */}
        <section className="blog-section">
          <div className="blog-section-header">
            <Shield className="blog-section-icon" size={32} />
            <h2>Why We Use Multiple Relays</h2>
          </div>

          <p>
            We publish each certificate to <strong>7 different relays</strong> for several critical reasons:
          </p>

          <div className="blog-features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Shield size={32} />
              </div>
              <h3>Redundancy</h3>
              <p>
                If one relay goes offline or experiences issues, your certificate remains accessible through the other 6 relays. This ensures 99.9%+ availability.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Lock size={32} />
              </div>
              <h3>Censorship Resistance</h3>
              <p>
                No single entity can remove or block your certificate. Even if one relay operator decides to censor content, the certificate exists on other relays.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Globe size={32} />
              </div>
              <h3>Geographic Distribution</h3>
              <p>
                Our relays are distributed globally, ensuring fast access from anywhere in the world and protection against regional outages.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Network size={32} />
              </div>
              <h3>Network Resilience</h3>
              <p>
                The decentralized nature means the network can survive the failure of multiple relays without losing data or functionality.
              </p>
            </div>
          </div>
        </section>

        {/* Our Relays */}
        <section className="blog-section">
          <div className="blog-section-header">
            <Server className="blog-section-icon" size={32} />
            <h2>The Relays We Use</h2>
          </div>

          <p>
            Here's a detailed look at each relay in our network:
          </p>

          <div className="blog-example-box">
            <h3>Yakihonne Relays (Required)</h3>
            <div className="example-steps">
              <div className="example-step">
                <div className="example-step-number">1</div>
                <div className="example-step-content">
                  <strong>wss://nostr-01.yakihonne.com</strong>
                  <p>Yakihonne strfry relay-0 - Required for publishing to the Yakihonne platform. High-performance relay with excellent uptime.</p>
                </div>
              </div>
              <div className="example-step">
                <div className="example-step-number">2</div>
                <div className="example-step-content">
                  <strong>wss://nostr-02.yakihonne.com</strong>
                  <p>Yakihonne strfry relay-1 - Secondary Yakihonne relay providing redundancy for the platform.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="blog-example-box">
            <h3>Community Relays</h3>
            <div className="example-steps">
              <div className="example-step">
                <div className="example-step-number">3</div>
                <div className="example-step-content">
                  <strong>wss://relay.damus.io</strong>
                  <p>Operated by the Damus team, one of the most popular Nostr clients. High availability and global reach.</p>
                </div>
              </div>
              <div className="example-step">
                <div className="example-step-number">4</div>
                <div className="example-step-content">
                  <strong>wss://relay.primal.net</strong>
                  <p>Part of the Primal ecosystem, known for fast performance and reliability.</p>
                </div>
              </div>
              <div className="example-step">
                <div className="example-step-number">5</div>
                <div className="example-step-content">
                  <strong>wss://nos.lol</strong>
                  <p>Community-run relay with open access policies and good stability.</p>
                </div>
              </div>
              <div className="example-step">
                <div className="example-step-number">6</div>
                <div className="example-step-content">
                  <strong>wss://relay.nostr.band</strong>
                  <p>Popular relay with search capabilities, great for discoverability and verification.</p>
                </div>
              </div>
              <div className="example-step">
                <div className="example-step-number">7</div>
                <div className="example-step-content">
                  <strong>wss://relay.snort.social</strong>
                  <p>Operated by the Snort client team, well-maintained and widely used in the Nostr ecosystem.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Querying Relays */}
        <section className="blog-section">
          <div className="blog-section-header">
            <Search className="blog-section-icon" size={32} />
            <h2>How Verification Works</h2>
          </div>

          <p>
            When someone wants to verify a certificate, they can query any of our relays:
          </p>

          <ol className="blog-numbered-list">
            <li>
              <strong>Query Any Relay:</strong> The verifier connects to any Nostr relay (it doesn't have to be one we published to, as relays share data).
            </li>
            <li>
              <strong>Search by Hash or ID:</strong> They search for events containing the certificate hash or ID.
            </li>
            <li>
              <strong>Receive Events:</strong> The relay returns matching events from its database.
            </li>
            <li>
              <strong>Verify Signature:</strong> The verifier checks the cryptographic signature to ensure the event is authentic.
            </li>
            <li>
              <strong>Compare Hashes:</strong> They compare the hash in the Nostr event with the certificate they're verifying.
            </li>
          </ol>

          <div className="blog-warning-box">
            <CheckCircle size={20} />
            <div>
              <h3>No Single Point of Failure</h3>
              <p>
                Because we publish to 7 relays, and because anyone can run a relay, your certificate is virtually impossible to lose. Even if all 7 of our relays went offline, other relays in the network would have copies, and new relays could be started to serve the data.
              </p>
            </div>
          </div>
        </section>

        {/* Conclusion */}
        <section className="blog-section blog-conclusion">
          <h2>Conclusion</h2>
          <p>
            Nostr relays are the backbone of our decentralized certificate system. By publishing to multiple relays, we ensure that:
          </p>
          <ul className="blog-conclusion-list">
            <li>Your certificates are stored redundantly across 7+ locations</li>
            <li>No single point of failure can compromise your certificate</li>
            <li>Censorship is impossible—no one can remove your certificate</li>
            <li>Global accessibility—certificates are available from anywhere</li>
            <li>Future-proof—the network grows stronger as more relays join</li>
          </ul>
          <p>
            The combination of PostgreSQL for reliable primary storage and Nostr relays for decentralized redundancy creates a certificate system that is both robust and censorship-resistant. Your achievements are not just stored—they're permanently recorded on a global, distributed network that belongs to everyone and no one.
          </p>
        </section>

        {/* CTA Section */}
        <section className="blog-cta">
          <div className="cta-content">
            <h2>Ready to Verify a Certificate?</h2>
            <p>Experience our technology in action by verifying a certificate on our platform.</p>
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
  // Get article from URL path using React Router
  const location = useLocation();
  const path = location.pathname;
  let article = 'security'; // default
  if (path.includes('/technology')) {
    article = 'technology';
  } else if (path.includes('/relays')) {
    article = 'relays';
  } else if (path.includes('/security')) {
    article = 'security';
  }

  // Scroll to top when article changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  const renderArticle = () => {
    switch (article) {
      case 'technology':
        return <TechnologyArticle />;
      case 'relays':
        return <RelaysArticle />;
      case 'security':
      default:
        return <SHA256Article />;
    }
  };

  return (
    <div className="blog-page">
      <Navbar />
      {renderArticle()}
      <ThemeToggle variant="floating" />
    </div>
  );
}

export default Blog;


