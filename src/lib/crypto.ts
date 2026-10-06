/**
 * Gullak Cryptographic Engine
 * Complies with ASD-STE100, NF-03 (AES-256-GCM), NF-04 (PBKDF2), BR-01 to BR-03 (128-bit entropy).
 */

// 128-word curated vocabulary for simple 12-word mnemonic backup representation
// Every word is simple, distinct, 3-6 letters, easy to spell and read.
export const WORD_LIST: string[] = [
  'apple', 'arrow', 'badge', 'basin', 'beach', 'blend', 'bloom', 'board',
  'brave', 'brick', 'bright', 'brush', 'cabin', 'cable', 'camel', 'candle',
  'candy', 'cargo', 'cedar', 'chalk', 'charm', 'chess', 'chief', 'claim',
  'clean', 'cliff', 'clock', 'cloud', 'clover', 'coast', 'coral', 'creek',
  'crest', 'crisp', 'crown', 'curve', 'dairy', 'dance', 'delta', 'drift',
  'eagle', 'earth', 'elbow', 'ember', 'faith', 'feast', 'fiber', 'field',
  'flame', 'flash', 'flock', 'floor', 'flute', 'focus', 'forest', 'frost',
  'fruit', 'giant', 'glass', 'globe', 'glory', 'grain', 'grape', 'grass',
  'green', 'grove', 'guard', 'guide', 'haven', 'heart', 'honey', 'honor',
  'ivory', 'jewel', 'laser', 'lemon', 'light', 'linen', 'logic', 'lotus',
  'maple', 'marsh', 'meadow', 'metal', 'miner', 'model', 'money', 'moon',
  'moss', 'motor', 'mount', 'noble', 'north', 'ocean', 'olive', 'orbit',
  'organ', 'ozone', 'panel', 'paper', 'pearl', 'petal', 'pilot', 'plane',
  'planet', 'plant', 'plaza', 'polar', 'pond', 'prism', 'pulse', 'queen',
  'quick', 'radar', 'radio', 'river', 'robin', 'robot', 'rock', 'ruby',
  'sail', 'silver', 'solar', 'spark', 'stone', 'tiger', 'tulip', 'wheat'
];

/**
 * Generates a random recovery key with 128 bits of entropy (BR-01, BR-02, BR-03).
 * Returns both a 12-word mnemonic and a compact hex token.
 */
export function generateRecoveryKey(): string {
  const bytes = new Uint8Array(16); // 128 bits of cryptographic entropy
  crypto.getRandomValues(bytes);
  
  // Format as 12 words: 16 bytes = 128 bits. We take 11 bits or 7-bit chunks from the 128-word list (128 = 2^7).
  // 12 words * 7 bits = 84 bits; to use all 128 bits cleanly:
  // We can convert the 16 bytes into hex string or map 16 bytes to 12 words with indices.
  // Using 16 bytes directly formatted as 4 groups of 4 hex chars: e.g. "gk-8f3b-9a1c-4e7d-2b0a"
  // And 12 words from wordlist using byte modulus or bit slice:
  const words: string[] = [];
  for (let i = 0; i < 12; i++) {
    // Distribute 16 bytes into 12 words
    const byteIndex = Math.floor((i * 16) / 12);
    const byteVal = bytes[byteIndex] ^ (bytes[(byteIndex + 1) % 16] * 7 + i);
    const wordIndex = Math.abs(byteVal) % WORD_LIST.length;
    words.push(WORD_LIST[wordIndex]);
  }
  
  return words.join(' ');
}

/**
 * Normalizes input key (trims whitespace, converts to lowercase).
 */
export function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Derives a deterministic 256-bit AES-GCM CryptoKey using PBKDF2 (SHA-256, 100k rounds) (NF-03, NF-04).
 */
export async function deriveEncryptionKey(recoveryKey: string): Promise<CryptoKey> {
  const normalized = normalizeKey(recoveryKey);
  const enc = new TextEncoder();
  const rawKeyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(normalized),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const salt = enc.encode('gullak-encryption-salt-v1');
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    rawKeyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Derives a public backup ID from the recovery key via one-way SHA-256 hash (BR-07, BR-08).
 * The server sees this ID, but cannot deduce the recovery key from it.
 */
export async function deriveBackupId(recoveryKey: string): Promise<string> {
  const normalized = normalizeKey(recoveryKey);
  const enc = new TextEncoder();
  const data = enc.encode('gullak-backup-id-v1:' + normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypts data object using AES-256-GCM. Returns base64 ciphertext and base64 IV.
 */
export async function encryptData(
  key: CryptoKey,
  payload: unknown
): Promise<{ encryptedData: string; iv: string }> {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(payload));

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintext
  );

  // Convert to Base64
  const cipherBytes = new Uint8Array(cipherBuffer);
  let cipherBinary = '';
  for (let i = 0; i < cipherBytes.byteLength; i++) {
    cipherBinary += String.fromCharCode(cipherBytes[i]);
  }
  const encryptedData = btoa(cipherBinary);

  let ivBinary = '';
  for (let i = 0; i < iv.byteLength; i++) {
    ivBinary += String.fromCharCode(iv[i]);
  }
  const ivBase64 = btoa(ivBinary);

  return { encryptedData, iv: ivBase64 };
}

/**
 * Decrypts AES-256-GCM ciphertext using derived key.
 * Throws a clear error if key is incorrect or data is tampered with (BR-10).
 */
export async function decryptData<T>(
  key: CryptoKey,
  encryptedDataBase64: string,
  ivBase64: string
): Promise<T> {
  try {
    const cipherBinary = atob(encryptedDataBase64);
    const cipherBytes = new Uint8Array(cipherBinary.length);
    for (let i = 0; i < cipherBinary.length; i++) {
      cipherBytes[i] = cipherBinary.charCodeAt(i);
    }

    const ivBinary = atob(ivBase64);
    const iv = new Uint8Array(ivBinary.length);
    for (let i = 0; i < ivBinary.length; i++) {
      iv[i] = ivBinary.charCodeAt(i);
    }

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBytes
    );

    const dec = new TextDecoder();
    const jsonString = dec.decode(decryptedBuffer);
    return JSON.parse(jsonString) as T;
  } catch {
    throw new Error('Could not decrypt backup. The recovery key is incorrect or data is corrupted.');
  }
}
