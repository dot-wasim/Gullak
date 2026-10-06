# Contributing to Gullak (गुल्लक)

Thank you for your interest in contributing to **Gullak**! We welcome contributions that maintain our core values: **uncompromising privacy**, **offline-first reliability**, and **clean, intuitive design**.

---

## Guiding Principles

1. **Zero-Knowledge Privacy:** Never introduce code that leaks plaintext financial records, user credentials, telemetry, or external analytics.
2. **Offline-First:** All core features must work without an active internet connection. Cloud synchronization is strictly an optional encrypted backup.
3. **ASD-STE100 Technical Clarity:** Keep user interface copy and notifications clear, unambiguous, and simple to understand.
4. **Lightweight & Fast:** Maintain fast load times (< 2 seconds) and avoid heavy external dependencies.

---

## Development Setup

### Prerequisites
- **Node.js**: v20 or higher (v22+ recommended)
- **npm**: v10+

### Steps

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/dot-wasim/Gullak.git
   cd Gullak
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   The Vite frontend will be available at `http://localhost:5173`.

4. **Start the local backup server:**
   ```bash
   npm run server
   ```
   The backend API will run on `http://localhost:3001`. Vite automatically proxies `/api` requests to port 3001 during local development.

---

## Running Verification & Tests

Always verify your changes before submitting a pull request:

```bash
# 1. Verify TypeScript types and build assets
npm run build

# 2. Run Cryptographic unit test suite
npm run test

# 3. Run End-to-End backup & restore integration verification
npm run test:e2e
```

All tests must pass without warnings or errors.

---

## Code Style & Conventions

- **TypeScript:** Use strict types. Avoid `any` types. Define clear interfaces in [`src/types/index.ts`](src/types/index.ts).
- **Styling:** Use **Tailwind CSS v4** utility classes. Favor mobile-first responsive breakpoints (`sm:`, `md:`, `lg:`).
- **Icons:** Use icons from `lucide-react`. Maintain consistent stroke widths and visual hierarchy.
- **State Management:** Keep persistent state in `AppContext` and ensure mutations save synchronously via [`src/lib/storage.ts`](src/lib/storage.ts).
- **Cryptography:** Cryptographic routines live strictly in [`src/lib/crypto.ts`](src/lib/crypto.ts) using the native Web Crypto API (`window.crypto.subtle`). Do not add external third-party crypto libraries unless thoroughly reviewed for browser compatibility.

---

## Submitting Pull Requests

1. **Create a descriptive feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Commit your changes:**
   Write clear, concise commit messages following the Conventional Commits format:
   ```bash
   git commit -m "feat: add export to CSV functionality"
   # or
   git commit -m "fix: resolve date parsing issue on Safari"
   ```

3. **Push to your fork and submit a PR:**
   - Push to `origin feature/your-feature-name`.
   - Open a Pull Request targeting the `main` branch.
   - Fill out the PR template with a summary of changes, motivation, and verification steps.

---

## Community & Conduct

Please be respectful, kind, and collaborative in all discussions and code reviews. We value constructive feedback and inclusive participation from developers of all backgrounds.
