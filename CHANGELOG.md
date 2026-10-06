# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-06

### Added
- **Zero-Knowledge Backup & Restore**:
  - Client-side 128-bit entropy recovery key generation with a 12-word mnemonic sequence.
  - Native Web Crypto API integration using AES-256-GCM authenticated encryption.
  - PBKDF2 key derivation (SHA-256, 100,000 iterations, custom application salt).
  - One-way SHA-256 backup identifier derivation so the server never learns user keys.
  - Rate-limited restore endpoint (10 requests per 15 minutes per IP) to prevent brute force attacks.
  - End-to-end cryptographic verification test suites (`npm run test` and `npm run test:e2e`).
- **Core Budgeting & Expense Tracking**:
  - Rapid expense entry modal (< 5 seconds logging workflow).
  - Category selection with default and customizable options.
  - Date picker with default to today.
  - Transaction history view with search, category filtering, inline editing, and deletion with safety confirmations.
- **Multiple Income Streams**:
  - Support for multiple income sources (Salary, Freelance, Investments, Business, etc.).
  - Custom income stream creator with autocomplete support.
- **Savings Goals**:
  - Goal creation with target amount and optional deadline.
  - Interactive "Add Money" deposit modal to record savings toward specific goals.
  - Real-time progress bars with percentage tracking and goal completion milestones.
- **Progressive Web App (PWA) & Offline Capabilities**:
  - Service worker caching (`sw.js`) for full offline availability.
  - Web App Manifest (`manifest.json`) for standalone mobile and desktop home screen installation.
  - In-app install banner prompt and onboarding recovery key ceremony.
  - Immediate restore flow directly accessible from the onboarding screen.
- **User Settings & Customization**:
  - Configurable currency symbols (₹, $, €, £, ¥, etc.).
  - Custom categories and income streams management.
  - Manual 1-tap backup trigger and real-time backup status indicator.
