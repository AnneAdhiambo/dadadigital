# Publishing Certificate Hashes to Nostr

This document outlines how to publish your generated certificate hashes to the Nostr network via API.

## What is Nostr?

Nostr (Notes and Other Stuff Transmitted by Relays) is a decentralized social protocol that allows users to publish and verify messages using cryptographic signatures. It's perfect for publishing certificate hashes because:

- **Decentralized**: No single point of failure
- **Immutable**: Once published, events are cryptographically signed and verifiable
- **Public**: Anyone can verify certificate hashes independently
- **Censorship-resistant**: No central authority can remove your published hashes

## Approaches to Publish to Nostr

### Option 1: Nostr HTTP Proxy API (Simplest)

The **Nostr HTTP Proxy API** (`https://nostrhttp.com`) allows you to publish events using standard HTTP requests without managing WebSocket connections.

#### How it Works:

1. **Create a Nostr Event** with your certificate hash
2. **Sign the event** using your private key
3. **POST to the API** endpoint

#### Example Implementation:

```javascript
/**
 * Publish certificate hash to Nostr via HTTP Proxy API
 * @param {string} certificateId - Certificate ID
 * @param {string} pdfHash - SHA-256 hash of the PDF
 * @param {string} privateKey - Nostr private key (hex format)
 * @param {string[]} relays - Array of relay URLs (optional)
 */
async function publishToNostrViaHTTP(certificateId, pdfHash, privateKey, relays = []) {
  // Default relays if none provided
  const defaultRelays = [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.snort.social'
  ];
  
  const finalRelays = relays.length > 0 ? relays : defaultRelays;
  
  // You'll need to create and sign the event
  // This requires a Nostr library (see Option 2)
  const event = {
    kind: 1, // Text note
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['certificate-id', certificateId],
      ['hash', pdfHash],
      ['type', 'certificate-verification']
    ],
    content: JSON.stringify({
      certificateId,
      pdfHash,
      timestamp: new Date().toISOString(),
      issuer: 'Bitcoin Dada Digital Systems'
    })
  };
  
  // Sign event (requires library - see Option 2)
  // Then POST to API
  const response = await fetch('https://nostrhttp.com/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...event,
      relays: finalRelays
    })
  });
  
  return await response.json();
}
```

### Option 2: Using nostr-tools Library (Recommended)

The `nostr-tools` npm package provides a complete JavaScript implementation for creating, signing, and publishing Nostr events.

#### Installation:

```bash
npm install nostr-tools
```

#### Implementation:

```javascript
import { 
  generatePrivateKey, 
  getPublicKey, 
  finalizeEvent, 
  Relay 
} from 'nostr-tools';

/**
 * Publish certificate hash to Nostr using nostr-tools
 * @param {string} certificateId - Certificate ID
 * @param {string} pdfHash - SHA-256 hash of the PDF
 * @param {string} privateKey - Nostr private key (hex format, or null to generate new)
 * @param {string[]} relays - Array of relay URLs
 */
async function publishCertificateHashToNostr(
  certificateId, 
  pdfHash, 
  privateKey = null,
  relays = ['wss://relay.damus.io', 'wss://nos.lol']
) {
  // Generate or use existing private key
  const privKey = privateKey || generatePrivateKey();
  const pubKey = getPublicKey(privKey);
  
  // Create event template
  const eventTemplate = {
    kind: 1, // Text note (kind 1)
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['certificate-id', certificateId],
      ['hash', pdfHash],
      ['type', 'certificate-verification'],
      ['issuer', 'Bitcoin Dada Digital Systems']
    ],
    content: JSON.stringify({
      certificateId,
      pdfHash,
      timestamp: new Date().toISOString(),
      issuer: 'Bitcoin Dada Digital Systems',
      verificationUrl: `https://your-domain.com/verify?hash=${pdfHash}`
    })
  };
  
  // Sign the event
  const signedEvent = finalizeEvent(eventTemplate, privKey);
  
  // Publish to multiple relays
  const publishPromises = relays.map(async (relayUrl) => {
    try {
      const relay = await Relay.connect(relayUrl);
      await relay.publish(signedEvent);
      await relay.close();
      return { relay: relayUrl, success: true };
    } catch (error) {
      console.error(`Failed to publish to ${relayUrl}:`, error);
      return { relay: relayUrl, success: false, error: error.message };
    }
  });
  
  const results = await Promise.allSettled(publishPromises);
  
  return {
    eventId: signedEvent.id,
    pubKey: pubKey,
    results: results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason })
  };
}
```

### Option 3: Using Nostr HTTP Proxy API with Pre-signed Events

If you want to use the HTTP Proxy API but need to sign events, you can use `nostr-tools` to create and sign events, then POST them to the HTTP API:

```javascript
import { finalizeEvent, getPublicKey } from 'nostr-tools';

async function publishViaHTTPProxy(certificateId, pdfHash, privateKey) {
  // Create and sign event using nostr-tools
  const eventTemplate = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['certificate-id', certificateId],
      ['hash', pdfHash]
    ],
    content: JSON.stringify({ certificateId, pdfHash })
  };
  
  const signedEvent = finalizeEvent(eventTemplate, privateKey);
  
  // Publish via HTTP Proxy
  const response = await fetch('https://nostrhttp.com/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...signedEvent,
      relays: ['wss://relay.damus.io', 'wss://nos.lol']
    })
  });
  
  return await response.json();
}
```

## Integration with Your Certificate System

### Step 1: Add nostr-tools to Your Project

```bash
npm install nostr-tools
```

### Step 2: Create a Nostr Utility Module

Create `src/utils/nostrUtils.js`:

```javascript
import { 
  generatePrivateKey, 
  getPublicKey, 
  finalizeEvent 
} from 'nostr-tools';

// Store private key in localStorage (or use environment variable for production)
const STORAGE_KEY = 'nostr_private_key';

/**
 * Get or generate Nostr private key
 */
export function getNostrPrivateKey() {
  let privKey = localStorage.getItem(STORAGE_KEY);
  if (!privKey) {
    privKey = generatePrivateKey();
    localStorage.setItem(STORAGE_KEY, privKey);
  }
  return privKey;
}

/**
 * Get Nostr public key
 */
export function getNostrPublicKey() {
  const privKey = getNostrPrivateKey();
  return getPublicKey(privKey);
}

/**
 * Publish certificate hash to Nostr
 * @param {Object} certificate - Certificate object with id and pdfHash
 * @param {string[]} relays - Array of relay URLs
 */
export async function publishCertificateHashToNostr(certificate, relays = null) {
  const defaultRelays = [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.snort.social'
  ];
  
  const finalRelays = relays || defaultRelays;
  const privKey = getNostrPrivateKey();
  
  if (!certificate.pdfHash) {
    throw new Error('Certificate PDF hash not found');
  }
  
  // Create event with certificate data
  const eventTemplate = {
    kind: 1, // Text note
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['certificate-id', certificate.id],
      ['hash', certificate.pdfHash],
      ['type', 'certificate-verification'],
      ['student', certificate.studentName],
      ['course', certificate.courseType],
      ['issuer', 'Bitcoin Dada Digital Systems']
    ],
    content: JSON.stringify({
      certificateId: certificate.id,
      studentName: certificate.studentName,
      courseType: certificate.courseType,
      pdfHash: certificate.pdfHash,
      issueDate: certificate.issueDate,
      timestamp: new Date().toISOString(),
      issuer: 'Bitcoin Dada Digital Systems',
      verificationUrl: `${window.location.origin}/verify?hash=${certificate.pdfHash}`
    })
  };
  
  // Sign the event
  const signedEvent = finalizeEvent(eventTemplate, privKey);
  
  // Publish to relays
  const publishPromises = finalRelays.map(async (relayUrl) => {
    try {
      const { Relay } = await import('nostr-tools');
      const relay = await Relay.connect(relayUrl);
      await relay.publish(signedEvent);
      await relay.close();
      return { relay: relayUrl, success: true };
    } catch (error) {
      console.error(`Failed to publish to ${relayUrl}:`, error);
      return { relay: relayUrl, success: false, error: error.message };
    }
  });
  
  const results = await Promise.allSettled(publishPromises);
  
  const successCount = results.filter(
    r => r.status === 'fulfilled' && r.value.success
  ).length;
  
  return {
    eventId: signedEvent.id,
    pubKey: getPublicKey(privKey),
    publishedTo: successCount,
    totalRelays: finalRelays.length,
    results: results.map(r => 
      r.status === 'fulfilled' ? r.value : { error: r.reason }
    )
  };
}
```

### Step 3: Integrate with Certificate Generation

Update `src/components/CertificatePreview.jsx` to publish to Nostr after generating the PDF:

```javascript
import { publishCertificateHashToNostr } from '../utils/nostrUtils';

// In downloadPDFFile function, after storing the hash:
if (pdfHash) {
  const updated = updateCertificatePDFHash(certificate.id, pdfHash);
  if (updated) {
    // Publish to Nostr
    try {
      const nostrResult = await publishCertificateHashToNostr(updated);
      console.log('Published to Nostr:', nostrResult);
      // Optionally show success message to user
    } catch (error) {
      console.error('Failed to publish to Nostr:', error);
      // Optionally show error message (non-blocking)
    }
  }
}
```

## Event Kinds for Certificates

Nostr supports different event "kinds" for different types of content:

- **Kind 1**: Text note (general purpose, good for certificate hashes)
- **Kind 30078**: Application-specific data (could be used for structured certificate data)
- **Kind 8**: Reaction (not applicable)

For certificate hashes, **Kind 1** (text note) is recommended as it's widely supported and searchable.

## Recommended Relays

Popular Nostr relays that support publishing:

- `wss://relay.damus.io` - Damus relay
- `wss://nos.lol` - Nos.today relay
- `wss://relay.snort.social` - Snort relay
- `wss://relay.nostr.band` - Nostr.band relay

## Security Considerations

1. **Private Key Storage**: 
   - In production, consider using environment variables or secure key management
   - For client-side apps, localStorage is acceptable but not ideal for high-security scenarios

2. **Key Management**:
   - Generate one key per organization/issuer
   - Store backup of private key securely
   - Consider using NIP-07 browser extension for key management

3. **Event Content**:
   - Certificate hashes are public on Nostr
   - Don't include sensitive personal information in event content
   - Use tags for metadata, JSON in content for structured data

## Verification

Once published, anyone can verify your certificate hashes by:

1. Querying Nostr relays for events with your public key
2. Filtering by certificate ID or hash tags
3. Verifying the event signature
4. Comparing the hash with the certificate PDF

## Example: Querying Published Hashes

```javascript
import { Relay, nip19 } from 'nostr-tools';

async function verifyCertificateOnNostr(certificateId, expectedHash) {
  const relay = await Relay.connect('wss://relay.damus.io');
  
  // Query for events with certificate-id tag
  const events = await relay.list([
    {
      kinds: [1],
      '#certificate-id': [certificateId]
    }
  ]);
  
  // Find matching hash
  const matchingEvent = events.find(event => {
    const hashTag = event.tags.find(tag => tag[0] === 'hash');
    return hashTag && hashTag[1] === expectedHash;
  });
  
  await relay.close();
  
  return {
    found: !!matchingEvent,
    event: matchingEvent,
    verified: matchingEvent ? true : false
  };
}
```

## Resources

- **Nostr Protocol Spec**: https://github.com/nostr-protocol/nips
- **nostr-tools Documentation**: https://github.com/nbd-wtf/nostr-tools
- **Nostr HTTP Proxy API**: https://nostrhttp.com
- **Nostr Relay List**: https://nostr.watch/relays

## Next Steps

1. Install `nostr-tools`: `npm install nostr-tools`
2. Create the `nostrUtils.js` module
3. Integrate publishing into your certificate generation flow
4. Test with a certificate
5. Consider adding a UI indicator showing when certificates are published to Nostr

