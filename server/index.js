import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Backup storage file path
const DATA_DIR = path.join(__dirname, 'data');
const BACKUPS_FILE = path.join(DATA_DIR, 'backups.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache + persistent JSON file store
let backupsStore = {};
if (fs.existsSync(BACKUPS_FILE)) {
  try {
    const raw = fs.readFileSync(BACKUPS_FILE, 'utf-8');
    backupsStore = JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse backups file, starting fresh', err);
    backupsStore = {};
  }
}

function persistStore() {
  try {
    fs.writeFileSync(BACKUPS_FILE, JSON.stringify(backupsStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write backups file', err);
  }
}

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rate limiter for restore operations to prevent brute-forcing backup IDs (BR-12)
const restoreRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 restore attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many restore attempts. Please wait 15 minutes before trying again.'
  }
});

// POST /api/backup - Store encrypted backup (BR-07, BR-08)
app.post('/api/backup', (req, res) => {
  const { backupId, encryptedData, iv, version } = req.body;

  if (!backupId || typeof backupId !== 'string' || backupId.trim().length === 0) {
    return res.status(400).json({ error: 'Valid backupId is required.' });
  }

  if (!encryptedData || typeof encryptedData !== 'string') {
    return res.status(400).json({ error: 'encryptedData payload is required.' });
  }

  if (!iv || typeof iv !== 'string') {
    return res.status(400).json({ error: 'Initialization vector (iv) is required.' });
  }

  const timestamp = new Date().toISOString();

  // Zero-Knowledge: Server stores only the cipher blob and cannot inspect plaintext
  backupsStore[backupId] = {
    encryptedData,
    iv,
    version: version || 1,
    updatedAt: timestamp
  };

  persistStore();

  return res.json({
    success: true,
    updatedAt: timestamp
  });
});

// GET /api/backup/:backupId - Restore encrypted backup (Rate-limited, BR-10, BR-12)
app.get('/api/backup/:backupId', restoreRateLimiter, (req, res) => {
  const { backupId } = req.params;

  if (!backupId) {
    return res.status(400).json({ error: 'backupId is required.' });
  }

  const record = backupsStore[backupId];
  if (!record) {
    return res.status(404).json({ error: 'Backup not found for this recovery key.' });
  }

  return res.json({
    encryptedData: record.encryptedData,
    iv: record.iv,
    version: record.version,
    updatedAt: record.updatedAt
  });
});

// Serve frontend static build in production if available
const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Gullak Backup Server listening on port ${PORT}`);
});
