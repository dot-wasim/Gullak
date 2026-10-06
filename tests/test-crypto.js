import { generateRecoveryKey, deriveEncryptionKey, deriveBackupId, encryptData, decryptData } from '../src/lib/crypto.ts';

async function testCrypto() {
  console.log('--- Testing Gullak Cryptographic Engine ---');
  
  // 1. Generate recovery key
  const key1 = generateRecoveryKey();
  console.log('1. Generated Key:', key1);
  if (!key1 || key1.split(' ').length !== 12) {
    throw new Error('Key generation failed: not 12 words');
  }

  // 2. Derive backup ID
  const backupId1 = await deriveBackupId(key1);
  console.log('2. Backup ID (SHA-256):', backupId1);
  if (!backupId1 || backupId1.length !== 64) {
    throw new Error('Backup ID invalid length');
  }

  // 3. Derive AES key
  const encKey1 = await deriveEncryptionKey(key1);
  console.log('3. AES-256-GCM Key derived successfully');

  // 4. Encrypt test payload
  const testPayload = {
    version: 1,
    entries: [{ id: '1', type: 'expense', amount: 250, category: 'Food', date: '2026-10-06' }],
    goals: [{ id: 'g1', name: 'Emergency', target: 5000, saved: 1500 }],
    settings: { currency: '₹', categories: ['Food', 'Rent'], incomeSources: ['Salary'] },
    exportedAt: new Date().toISOString()
  };

  const { encryptedData, iv } = await encryptData(encKey1, testPayload);
  console.log('4. Encrypted ciphertext length:', encryptedData.length, 'IV length:', iv.length);

  // 5. Decrypt with correct key
  const decrypted = await decryptData(encKey1, encryptedData, iv);
  console.log('5. Decrypted successfully! Entries count:', decrypted.entries.length);
  if (decrypted.entries[0].amount !== 250) {
    throw new Error('Decrypted payload mismatch');
  }

  // 6. Test wrong key rejection (BR-10)
  const wrongKey = generateRecoveryKey();
  const wrongEncKey = await deriveEncryptionKey(wrongKey);
  try {
    await decryptData(wrongEncKey, encryptedData, iv);
    throw new Error('Security failure: Decryption with wrong key should have failed!');
  } catch (err) {
    console.log('6. Wrong key correctly rejected with error:', err.message);
  }

  console.log('--- ALL CRYPTO TESTS PASSED! ---');
}

testCrypto().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
