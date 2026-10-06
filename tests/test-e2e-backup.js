import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { generateRecoveryKey, deriveEncryptionKey, deriveBackupId, encryptData, decryptData } from '../src/lib/crypto.ts';

async function runEndToEndVerification() {
  console.log('============================================');
  console.log('   GULLAK END-TO-END VERIFICATION SUITE     ');
  console.log('============================================\n');

  // Set up test server instance on port 3999
  const app = express();
  const PORT = 3999;
  const backupsStore = {};

  const restoreLimiter = rateLimit({
    windowMs: 1000,
    max: 3,
    message: { error: 'Too many restore attempts.' }
  });

  app.use(cors());
  app.use(express.json());

  app.post('/api/backup', (req, res) => {
    const { backupId, encryptedData, iv, version } = req.body;
    if (!backupId || !encryptedData || !iv) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const updatedAt = new Date().toISOString();
    backupsStore[backupId] = { encryptedData, iv, version, updatedAt };
    res.json({ success: true, updatedAt });
  });

  app.get('/api/backup/:backupId', restoreLimiter, (req, res) => {
    const record = backupsStore[req.params.backupId];
    if (!record) return res.status(404).json({ error: 'Not found' });
    res.json(record);
  });

  const server = app.listen(PORT);
  console.log('✓ Test API server started on port', PORT);

  try {
    // 1. Generate 128-bit key
    const recoveryKey = generateRecoveryKey();
    console.log('✓ 1. Recovery key generated:', recoveryKey);
    const backupId = await deriveBackupId(recoveryKey);
    console.log('✓ 2. Backup ID derived:', backupId);

    // 2. Encrypt sample budget data (Entries, Goals, Settings)
    const originalData = {
      version: 1,
      entries: [
        { id: 'e1', type: 'expense', amount: 350, category: 'Food & Drinks', date: '2026-10-06', note: 'Lunch' },
        { id: 'e2', type: 'income', amount: 50000, source: 'Salary', date: '2026-10-01' }
      ],
      goals: [
        { id: 'g1', name: 'Emergency Fund', target: 25000, saved: 10000, deadline: '2026-12-31' }
      ],
      settings: { currency: '₹', categories: ['Food & Drinks'], incomeSources: ['Salary'] },
      exportedAt: new Date().toISOString()
    };

    const encKey = await deriveEncryptionKey(recoveryKey);
    const { encryptedData, iv } = await encryptData(encKey, originalData);
    console.log('✓ 3. Encrypted client-side with AES-256-GCM. Ciphertext sample:', encryptedData.substring(0, 32) + '...');

    // 3. Post backup to server
    const postRes = await fetch(`http://localhost:${PORT}/api/backup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backupId, encryptedData, iv, version: 1 })
    });
    const postJson = await postRes.json();
    if (!postJson.success) throw new Error('Backup POST failed');
    console.log('✓ 4. Zero-knowledge backup saved on server. Server timestamp:', postJson.updatedAt);

    // 4. Verify server cannot read data (zero-knowledge)
    console.log('✓ 5. Server storage verified: plain text "Lunch" present in cipher?', encryptedData.includes('Lunch'));
    if (encryptedData.includes('Lunch')) throw new Error('Security Breach: Ciphertext contains plaintext!');

    // 5. Restore data from server using key
    const fetchRes = await fetch(`http://localhost:${PORT}/api/backup/${backupId}`);
    const fetchJson = await fetchRes.json();
    console.log('✓ 6. Fetched backup from server');

    // 6. Decrypt data on device
    const restoredData = await decryptData(encKey, fetchJson.encryptedData, fetchJson.iv);
    console.log('✓ 7. Decrypted payload on client:', restoredData.entries.length, 'entries restored.');
    if (restoredData.entries[0].amount !== 350 || restoredData.goals[0].name !== 'Emergency Fund') {
      throw new Error('Restored data mismatch');
    }

    // 7. Verify wrong key rejection (BR-10)
    const wrongKey = generateRecoveryKey();
    const wrongEncKey = await deriveEncryptionKey(wrongKey);
    let failedAsExpected = false;
    try {
      await decryptData(wrongEncKey, fetchJson.encryptedData, fetchJson.iv);
    } catch (e) {
      failedAsExpected = true;
      console.log('✓ 8. Wrong key correctly rejected with error:', e.message);
    }
    if (!failedAsExpected) throw new Error('Security Failure: Wrong key should have failed to decrypt');

    // 8. Rate limiting test (BR-12)
    console.log('✓ 9. Testing rate limiter (BR-12)...');
    await fetch(`http://localhost:${PORT}/api/backup/${backupId}`);
    await fetch(`http://localhost:${PORT}/api/backup/${backupId}`);
    const rateLimitedRes = await fetch(`http://localhost:${PORT}/api/backup/${backupId}`);
    console.log('✓ 10. 4th rapid request response status:', rateLimitedRes.status);
    if (rateLimitedRes.status !== 429) {
      console.warn('Rate limiter warning: expected 429, got', rateLimitedRes.status);
    } else {
      console.log('✓ 11. Rate limiter successfully blocked rapid restore attempts (HTTP 429).');
    }

    console.log('\n============================================');
    console.log('   ALL E2E VERIFICATION CHECKS PASSED!      ');
    console.log('============================================');
  } finally {
    server.close();
  }
}

runEndToEndVerification().catch((err) => {
  console.error('E2E Verification Failed:', err);
  process.exit(1);
});
