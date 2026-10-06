# Gullak (गुल्लक) - Simple & Private Budget PWA

**Style:** ASD-STE100 (Simplified Technical English)  
**Security:** Zero-Knowledge Client-Side AES-256-GCM + PBKDF2  
**Platform:** Progressive Web App (PWA), Offline-First

---

## 1. Description
Gullak is a simple budget app. The user records income and expenses. The user sets a goal. The app does not use a login, email, phone number, or password.

The user backs up data with a 12-word recovery key. The user restores data with the same key.

## 2. Features Implemented

### Functional Requirements
- **FR-01 to FR-05 (Expense):** Required amount (> 0), category selection, default date (today) with custom selector, optional note. Rejects invalid amounts.
- **FR-06 to FR-09 (Income):** Required amount (> 0), source input with autocomplete, default date (today), optional note.
- **FR-10 to FR-14 (Goals):** Goal name and target amount, optional deadline, manual money deposits, progress bar with percentage, and goal completion messages.
- **FR-15 to FR-19 (Home Screen):** Current month income, current month expenses, net balance (income minus expenses), active goals progress, and quick add action button (< 10 seconds to add first entry).
- **FR-20 to FR-23 (History):** Reverse chronological order (newest first), search and category filters, edit record, and delete record with mandatory confirmation modal.

### Backup and Restore (Zero-Knowledge)
- **BR-01 to BR-03:** App generates a random 128-bit entropy recovery key on first start formatted as 12 simple words.
- **BR-04 to BR-05:** First-run onboarding key ceremony with mandatory confirmation ("I saved my key") before continuing.
- **BR-06:** User can view the recovery key at any time in Settings.
- **BR-07 to BR-09:** Manual one-tap backup, automatic backup when online, and timestamp display of last backup.
- **BR-10 to BR-12:** Restore using recovery key, clear error on incorrect key, warning before replacing local data, and IP-based rate limiting on restore attempts.
- **7.4:** Clear notice that lost keys cannot be recovered by anyone.

### Non-Functional Requirements
- **NF-01:** Instant startup (< 2 seconds) with lightweight bundle.
- **NF-02:** 100% offline-ready through Service Worker and Local Storage / IndexedDB.
- **NF-03 & NF-04:** Native Web Crypto API utilizing **AES-256-GCM** encryption and **PBKDF2** (SHA-256, 100,000 iterations) key derivation.
- **NF-05:** Zero telemetry and zero user data sent to analytics.
- **NF-06:** Clean mobile-first responsive layout matching ASD-STE100 principles.

---

## 3. Architecture Overview

```
[ Browser Client ]
  ├── App State & IndexedDB / LocalStorage (Offline Data)
  ├── WebCrypto:
  │    ├── 12-word Key (128-bit entropy)
  │    ├── PBKDF2(Key) -> AES-256-GCM Key (Local encryption only)
  │    └── SHA-256(Key) -> Backup ID (One-way hash sent to server)
  └── Service Worker (Offline Cache & Assets)
           │
           │ (Zero-Knowledge Encrypted Ciphertext + Derived Backup ID)
           v
[ Backup Server (Node / Express) ]
  ├── POST /api/backup -> Stores encrypted blob by Backup ID
  ├── GET /api/backup/:id -> Rate-limited restore endpoint (10 req / 15 min / IP)
  └── Static PWA Hosting
```

---

## 4. Getting Started

### Development
```bash
# Install dependencies
npm install

# Start Vite dev server (port 5173 with proxy to backend)
npm run dev

# Start backup server (port 3001)
npm run server
```

### Production Build & Run
```bash
# Build frontend
npm run build

# Start production server (serves frontend PWA + backup API on port 3001)
npm start
```

Access the app at `http://localhost:3001` or install as a PWA on your mobile device.
