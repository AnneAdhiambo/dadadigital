import { 
  generateSecretKey, 
  getPublicKey, 
  finalizeEvent,
  Relay,
  nip19
} from 'nostr-tools';

// Storage key name for Nostr private key in localStorage
const STORAGE_KEY_NAME = 'nostr_private_key';

// Storage key for Nostr private key
const STORAGE_KEY = '';


// Nostr relays for publishing
const RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.primal.net',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://relay.snort.social'
];

/**
 * Get or generate Nostr private key
 * Stores the key in localStorage for persistence
 * Handles both hex strings and bech32 (nsec) encoded keys
 */
export function getNostrPrivateKey() {
  // Check new storage location first
  let privKey = localStorage.getItem(STORAGE_KEY_NAME);
  
  // If not found, check old storage location (for migration)
  const OLD_STORAGE_KEY = 'nsec19j6um6qx2qzpdnd9lqrkp4ktxq2wxg3c8sujyahl67pu62yzy4qs8aqrc9';
  if (!privKey) {
    privKey = localStorage.getItem(OLD_STORAGE_KEY);
    if (privKey) {
      // Migrate to new key name
      localStorage.setItem(STORAGE_KEY_NAME, privKey);
      localStorage.removeItem(OLD_STORAGE_KEY);
      console.log('Migrated key to new storage location');
    }
  }
  
  if (!privKey) {
    // Generate new key (returns Uint8Array)
    const newKey = generateSecretKey();
    // Convert to hex string for storage
    const hexKey = Array.from(newKey).map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(STORAGE_KEY_NAME, hexKey);
    console.log('Generated new Nostr private key');
    return newKey; // Return Uint8Array
  }
  
  // Check if it's a bech32 encoded key (nsec...)
  if (privKey.startsWith('nsec')) {
    try {
      // Decode bech32 to get Uint8Array
      const decoded = nip19.decode(privKey);
      if (decoded.type === 'nsec' && decoded.data instanceof Uint8Array) {
        // Convert to hex and store for future use
        const hexKey = Array.from(decoded.data).map(b => b.toString(16).padStart(2, '0')).join('');
        localStorage.setItem(STORAGE_KEY_NAME, hexKey);
        return decoded.data; // Return Uint8Array
      }
    } catch (error) {
      console.error('Error decoding bech32 key:', error);
      // If decode fails, generate new key
      const newKey = generateSecretKey();
      const hexKey = Array.from(newKey).map(b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(STORAGE_KEY_NAME, hexKey);
      return newKey;
    }
  }
  
  // If it's a hex string, convert to Uint8Array
  if (typeof privKey === 'string' && /^[0-9a-fA-F]{64}$/.test(privKey)) {
    // Hex string - convert to Uint8Array
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[i] = parseInt(privKey.substr(i * 2, 2), 16);
    }
    return bytes;
  }
  
  // If format is unknown, generate new key
  console.warn('Invalid key format, generating new key');
  const newKey = generateSecretKey();
  const hexKey = Array.from(newKey).map(b => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem(STORAGE_KEY_NAME, hexKey);
  return newKey;
}

/**
 * Get Nostr public key from stored private key
 */
export function getNostrPublicKey() {
  const privKey = getNostrPrivateKey();
  return getPublicKey(privKey);
}

/**
 * Get Nostr public key in bech32 format (npub...)
 */
export function getNostrPublicKeyBech32() {
  try {
    const pubKey = getNostrPublicKey();
    return nip19.npubEncode(pubKey);
  } catch (error) {
    console.warn('Could not encode public key to bech32:', error);
    return getNostrPublicKey();
  }
}

/**
 * Publish certificate to Nostr (Kind 1 - Text Note)
 * This will appear in any Nostr client (Damus, Amethyst, Snort, etc.)
 * @param {Object} certificate - Certificate object with all metadata
 * @param {Function} onProgress - Optional callback for progress updates
 * @returns {Promise<Object>} Result with eventId, pubKey, and publishing results
 */
export async function publishToNostr(certificate, onProgress = null) {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🚀 PUBLISHING CERTIFICATE TO NOSTR');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const privKey = getNostrPrivateKey();
  const pubKey = getNostrPublicKey();
  const pubKeyBech32 = nip19.npubEncode(pubKey);
  
  console.log('📋 Certificate Data:');
  console.log('   ID:', certificate.id);
  console.log('   Student:', certificate.studentName);
  console.log('   Course:', certificate.courseType);
  console.log('   PDF Hash:', certificate.pdfHash ? certificate.pdfHash.substring(0, 32) + '...' : 'MISSING');
  console.log('   Your Public Key (npub):', pubKeyBech32);
  console.log('');
  
  if (!certificate.pdfHash) {
    console.error('❌ ERROR: Certificate PDF hash not found!');
    throw new Error('Certificate PDF hash not found. Cannot publish to Nostr.');
  }
  
  if (!certificate.id) {
    console.error('❌ ERROR: Certificate ID not found!');
    throw new Error('Certificate ID not found. Cannot publish to Nostr.');
  }
  
  // Format issue date
  const issueDate = certificate.issueDate 
    ? new Date(certificate.issueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
  
  // Build the content as a readable text note
  const content = `🎓 Certificate of Completion

Issued to: ${certificate.studentName || 'N/A'}
Course: ${certificate.courseType || 'N/A'}
${certificate.cohort ? `Cohort: ${certificate.cohort}\n` : ''}Date: ${issueDate}
Certificate ID: ${certificate.id}

SHA256 Hash: ${certificate.pdfHash}

Verify: ${window.location.origin}/verify?hash=${certificate.pdfHash}

#certificate #bitcoindada #proofofexistence`;

  // Build the tags
  const tags = [
    ['certificate-id', certificate.id],
    ['hash', certificate.pdfHash],
    ['type', 'certificate-verification'],
    ['issuer', 'Bitcoin Dada Digital Systems'],
    ['t', 'certificate'],
    ['t', 'bitcoindada'],
    ['t', 'proofofexistence']
  ];
  
  // Add optional tags
  if (certificate.studentName) {
    tags.push(['student', certificate.studentName]);
  }
  if (certificate.courseType) {
    tags.push(['course', certificate.courseType]);
  }
  if (certificate.cohort) {
    tags.push(['cohort', certificate.cohort]);
  }
  
  // Create event template (Kind 1 = Text Note)
  const eventTemplate = {
    kind: 1, // Text note - works with all Nostr clients
    created_at: Math.floor(Date.now() / 1000),
    tags: tags,
    content: content
  };
  
  if (onProgress) {
    onProgress({
      step: 'signing',
      message: 'Signing event...',
      status: 'in_progress'
    });
  }
  
  console.log('🔐 Signing event...');
  console.log('   Kind:', eventTemplate.kind, '(Text Note)');
  console.log('   Relays:', RELAYS.length);
  
  if (onProgress) {
    onProgress({
      step: 'signing',
      message: 'Signing event...',
      status: 'in_progress'
    });
  }
  
  // Sign the event
  const signedEvent = finalizeEvent(eventTemplate, privKey);
  
  console.log('✅ Event signed successfully');
  console.log('   Event ID:', signedEvent.id);
  console.log('');
  
  if (onProgress) {
    onProgress({
      step: 'signing',
      message: 'Event signed successfully',
      status: 'completed',
      eventId: signedEvent.id
    });
    
    onProgress({
      step: 'publishing',
      message: `Publishing to ${RELAYS.length} Nostr relays...`,
      status: 'in_progress'
    });
  }
  
  // Publish to relays
  const publishPromises = RELAYS.map(async (relayUrl, index) => {
    let relay = null;
    try {
      // Extract full relay name for display
      const relayDomain = relayUrl.replace('wss://', '');
      const relayName = relayDomain.split('.')[0];
      const fullRelayName = relayDomain.split('/')[0]; // Get domain without path
      
      console.log(`   [${index + 1}/${RELAYS.length}] Connecting to ${fullRelayName}...`);
      
      if (onProgress) {
        onProgress({
          step: 'publishing',
          message: `[${index + 1}/${RELAYS.length}] Connecting to ${fullRelayName}...`,
          status: 'in_progress',
          currentRelay: relayUrl,
          relayName: fullRelayName,
          relayIndex: index
        });
      }
      
      relay = await Relay.connect(relayUrl);
      console.log(`   [${index + 1}/${RELAYS.length}] Connected to ${fullRelayName}`);
      
      // Wait for relay to be ready
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log(`   [${index + 1}/${RELAYS.length}] Publishing to ${fullRelayName}...`);
      
      if (onProgress) {
        onProgress({
          step: 'publishing',
          message: `[${index + 1}/${RELAYS.length}] Publishing to ${fullRelayName}...`,
          status: 'in_progress',
          currentRelay: relayUrl,
          relayName: fullRelayName,
          relayIndex: index
        });
      }
      
      // Publish and wait for confirmation
      await relay.publish(signedEvent);
      
      // Give relay time to process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`   [${index + 1}/${RELAYS.length}] ✓ Published to ${fullRelayName}`);
      
      if (onProgress) {
        onProgress({
          step: 'publishing',
          message: `[${index + 1}/${RELAYS.length}] ✓ Published to ${fullRelayName}`,
          status: 'completed',
          currentRelay: relayUrl,
          relayName: fullRelayName,
          relayIndex: index,
          success: true
        });
      }
      
      await relay.close();
      return { relay: relayUrl, success: true };
    } catch (error) {
      console.error(`   ✗ Failed to publish to ${relayUrl}:`, error.message || error);
      
      const relayDomain = relayUrl.replace('wss://', '');
      const fullRelayName = relayDomain.split('/')[0];
      
      console.log(`   [${index + 1}/${RELAYS.length}] ✗ Failed to publish to ${fullRelayName}: ${error.message || error}`);
      
      if (onProgress) {
        onProgress({
          step: 'publishing',
          message: `[${index + 1}/${RELAYS.length}] ✗ Failed to publish to ${fullRelayName}`,
          status: 'error',
          currentRelay: relayUrl,
          relayName: fullRelayName,
          relayIndex: index,
          error: error.message || String(error)
        });
      }
      
      if (relay) {
        try {
          await relay.close();
        } catch (closeError) {
          // Ignore close errors
        }
      }
      return { 
        relay: relayUrl, 
        success: false, 
        error: error.message || String(error) || 'Unknown error' 
      };
    }
  });
  
  const results = await Promise.allSettled(publishPromises);
  
  const successful = results
    .filter(r => r.status === 'fulfilled' && r.value.success)
    .map(r => r.value);
  
  const failed = results
    .filter(r => r.status === 'fulfilled' && !r.value.success)
    .map(r => r.value);
  
  const result = {
    eventId: signedEvent.id,
    pubKey: pubKey,
    pubKeyBech32: pubKeyBech32,
    publishedTo: successful.length,
    totalRelays: RELAYS.length,
    successful,
    failed,
    allSuccessful: successful.length === RELAYS.length
  };
  
  console.log(`\n🎉 Success! Published to ${successful.length}/${RELAYS.length} relays.`);
  
  if (successful.length > 0) {
    console.log('\n✅ Successful Relays:');
    successful.forEach((r, idx) => {
      console.log(`   ${idx + 1}. ${r.relay}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Relays:');
    failed.forEach((r, idx) => {
      console.log(`   ${idx + 1}. ${r.relay} - ${r.error || 'Unknown error'}`);
    });
  }
  
  console.log('\n📋 Event Details:');
  console.log('   Event ID:', signedEvent.id);
  console.log('   Public Key (npub):', pubKeyBech32);
  console.log('   Kind:', 1, '(Text Note)');
  
  console.log('\n📱 View your Certificate:');
  console.log('   You can view this certificate on any Nostr client:');
  console.log('   - Damus: https://damus.io');
  console.log('   - Amethyst: https://amethyst.social');
  console.log('   - Snort: https://snort.social');
  console.log('   - Search for your public key:', pubKeyBech32);
  console.log('   - Or search for event ID:', signedEvent.id);
  console.log('');
  
  if (onProgress) {
    onProgress({
      step: 'completed',
      message: `Published to ${successful.length}/${RELAYS.length} relays`,
      status: successful.length > 0 ? 'completed' : 'error',
      result: result
    });
  }
  
  // Store result in progress for UI access
  if (onProgress) {
    onProgress({
      step: 'final',
      message: `Published to ${successful.length}/${RELAYS.length} relays`,
      status: successful.length > 0 ? 'completed' : 'error',
      result: result
    });
  }
  
  return result;
}

/**
 * Check if a certificate hash has been published to Nostr
 * @param {Object} certificate - Certificate object
 * @returns {boolean} True if certificate has nostrEventId stored
 */
export function isCertificatePublishedToNostr(certificate) {
  return !!(certificate.nostrEventId || certificate.nostrPublishedAt);
}

/**
 * Store Nostr event information in certificate
 * @param {string} certificateId - Certificate ID
 * @param {string} eventId - Nostr event ID
 * @param {string} pubKey - Nostr public key
 */
export function storeNostrEventInfo(certificateId, eventId, pubKey) {
  try {
    const certificates = JSON.parse(localStorage.getItem('dadadigital_certificates') || '[]');
    const index = certificates.findIndex(cert => cert.id === certificateId);
    
    if (index !== -1) {
      certificates[index].nostrEventId = eventId;
      certificates[index].nostrPubKey = pubKey;
      certificates[index].nostrPublishedAt = new Date().toISOString();
      
      localStorage.setItem('dadadigital_certificates', JSON.stringify(certificates));
      console.log(`Nostr event info stored for certificate ${certificateId}`);
      return true;
    }
    
    console.warn(`Certificate ${certificateId} not found when storing Nostr event info`);
    return false;
  } catch (error) {
    console.error('Error storing Nostr event info:', error);
    return false;
  }
}
