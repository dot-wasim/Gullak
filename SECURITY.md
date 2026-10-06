# Security Policy & Cryptographic Model

## Supported Versions

Only the latest release of Gullak receives active security patches and updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Zero-Knowledge Architecture

Gullak is built around a **strict zero-knowledge security model**. User financial records (income, expenses, goals, savings amounts) are never sent to any server in plaintext. 

### Core Cryptographic Principles

1. **Client-Side Key Generation (128-bit Entropy):**
   - On initial launch, the browser generates 16 bytes (128 bits) of cryptographically secure random values via `crypto.getRandomValues()`.
   - The entropy is mapped into a human-readable 12-word recovery mnemonic chosen from a curated list of unambiguous words.

2. **Key Derivation (PBKDF2):**
   - The 12-word recovery phrase is normalized and passed to `crypto.subtle.importKey()`.
   - A 256-bit AES-GCM encryption key is derived using **PBKDF2** with **100,000 iterations**, **SHA-256**, and a deterministic application salt (`gullak-encryption-salt-v1`).
   - The derived encryption key exists strictly in client browser memory and is never transmitted over the network or saved to remote databases.

3. **Authenticated Encryption (AES-256-GCM):**
   - All state payloads (budget entries, goals, user settings) are serialized to JSON and encrypted using **AES-256-GCM** with a fresh, randomly generated 12-byte (96-bit) Initialization Vector (IV) per backup.
   - The resulting ciphertext and authentication tag protect confidentiality and guarantee tamper-evidence.

4. **One-Way Backup Identifier (SHA-256):**
   - To associate backups with a user without revealing their recovery key, Gullak computes a one-way cryptographic hash:
     $$\text{Backup ID} = \text{SHA-256}(\text{"gullak-backup-id-v1:"} \parallel \text{Recovery Key})$$
   - The backup server stores cipher blobs indexed by this 64-character hex ID.
   - The server **cannot** reverse this hash or derive the encryption key from it.

5. **Rate-Limiting & Anti-Brute-Force:**
   - The backup restore endpoint (`GET /api/backup/:backupId`) is protected with IP-based rate limiting (10 requests per 15-minute window).
   - Any restore attempt using an incorrect recovery phrase fails client-side AES-GCM authentication and is rejected without compromising data.

---

## Threat Model & Boundary

### What Gullak Protects Against
- **Compromised Server or Database:** If the backup server or database is breached, the attacker only acquires opaque AES-256-GCM ciphertexts and SHA-256 hashes. Without the client's 12-word recovery phrase, plaintext financial records cannot be deciphered.
- **Network Eavesdropping / Man-in-the-Middle:** Even if transport encryption (HTTPS) were terminated or inspected, the payload body is already encrypted with AES-256-GCM prior to transmission.
- **Provider Telemetry & Surveillance:** No third-party analytics, tracking scripts, ad pixels, or behavioral monitoring tools exist in the codebase.
- **Data Tampering:** The AES-GCM authentication tag ensures that any modification to the stored ciphertext causes decryption to fail outright.

### What is Out of Scope
- **Compromised Local Device / Browser:** If the user's physical device has malware, keyloggers, malicious browser extensions with broad DOM access, or an unpatched operating system, local memory or storage could be inspected.
- **Lost Recovery Key:** Because Gullak maintains zero-knowledge credentials, there is **no "Forgot Password" or recovery reset mechanism**. If a user loses their 12-word recovery phrase and clears local storage, their data cannot be restored by anyone.

---

## Reporting a Security Vulnerability

If you discover a security vulnerability or cryptographic flaw in Gullak:

1. **Do not disclose the vulnerability publicly** in GitHub issues, forums, or social media.
2. Please open a [GitHub Security Advisory](https://github.com/dot-wasim/Gullak/security/advisories) or contact the project maintainer directly via GitHub.
3. Include:
   - Detailed description of the vulnerability.
   - Steps to reproduce or proof-of-concept (PoC).
   - Potential impact on users or zero-knowledge guarantees.
4. You will receive an acknowledgment within **48 hours**, followed by remediation updates and coordinated disclosure.
