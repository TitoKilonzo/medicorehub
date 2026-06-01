# MediCore Hub
**Integrated Health Intelligence Platform for East Africa**

> Sky Blue + White — Progressive Web App — Turso (libSQL) Database

---

## Quick Start

```bash
cd medicorehub
python3 -m http.server 8080
# Open: http://localhost:8080/app/pages/login.html
```

Or with Node:
```bash
npx serve . -l 8080
```

No build tools. No bundler. Open `index.html` in any modern browser.

---

## Demo Credentials

> **Security note:** Credentials are NOT shown in the UI. Use these to sign in or test the auth flows.

| Field    | Value                        |
|----------|------------------------------|
| Email    | `demo@medicorehub.co.ke`     |
| Password | `Demo@2026`                  |

The demo account is seeded automatically on first page load. You can also register a new account via `/app/pages/register.html`.

---

## Project Structure

```
medicorehub/
├── index.html                    # Marketing landing page
├── favicon.svg                   # SVG favicon — sky blue ECG icon
├── manifest.json                 # PWA manifest
├── sw.js                         # Service worker (offline + caching)
├── README.md
│
├── app/
│   ├── css/
│   │   └── app.css               # Full design system
│   ├── js/
│   │   ├── app.js                # UI helpers, toast, PWA, mobile nav
│   │   └── db.js                 # Turso simulation layer (localStorage)
│   └── pages/
│       ├── login.html            # Sign in
│       ├── register.html         # 2-step account creation
│       ├── reset-password.html   # 4-state password recovery flow
│       ├── onboarding.html       # 5-step preference wizard
│       ├── dashboard.html        # Main app dashboard
│       ├── settings.html         # Profile, password, notifications, security
│       └── modules.html          # Section-based platform module reference
│
├── pages/                        # Marketing inner pages
│   ├── modules.html
│   ├── analytics.html
│   ├── interoperability.html
│   ├── security.html
│   └── contact.html
│
├── css/
│   └── main.css                  # Marketing site stylesheet
├── js/
│   └── main.js                   # Marketing site JS
└── icons/
    └── icon-{72,96,128,192,512}.svg  # PWA icons
```

---

## Design System

### Colour Palette

| Token          | Hex       | Usage                          |
|----------------|-----------|--------------------------------|
| `--sky-600`    | `#0284C7` | Primary brand, buttons, links  |
| `--sky-700`    | `#0369A1` | Hover state                    |
| `--sky-500`    | `#0EA5E9` | Accent, highlights             |
| `--white`      | `#FFFFFF` | Card backgrounds, panels       |
| `--gray-50`    | `#F9FAFB` | Page background                |
| `--gray-900`   | `#111827` | Primary text                   |
| `--success`    | `#10B981` | Success states                 |
| `--error`      | `#EF4444` | Error states                   |
| `--warning`    | `#F59E0B` | Warning states                 |

### Typography

| Font              | Weights        | Usage                    |
|-------------------|----------------|--------------------------|
| Plus Jakarta Sans | 400–800        | Headings, labels, buttons|
| Inter             | 400–600        | Body text, inputs        |

---

## Turso (libSQL) Database Setup

The app ships with a **localStorage-backed simulation** in `app/js/db.js`. Every method is a 1:1 swap for real `@libsql/client` calls — no code changes required beyond swapping the client.

### Step 1 — Install the Turso CLI

```bash
# macOS / Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Windows (PowerShell)
irm https://get.tur.so/install.ps1 | iex
```

Verify installation:
```bash
turso --version
```

### Step 2 — Authenticate

```bash
turso auth login
```

This opens a browser window. Complete the OAuth flow, then return to the terminal.

### Step 3 — Create your database

```bash
turso db create medicorehub
```

### Step 4 — Get your connection URL and auth token

```bash
# Print the database URL (copy this)
turso db show medicorehub --url

# Create a long-lived auth token (copy this)
turso db tokens create medicorehub
```

Save both values — you'll need them in Step 6.

### Step 5 — Run the schema

Open the Turso shell for your database:
```bash
turso db shell medicorehub
```

Then paste and run the SQL below:

```sql
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT DEFAULT 'clinician',
  facility      TEXT DEFAULT '',
  county        TEXT DEFAULT '',
  phone         TEXT DEFAULT '',
  password_hash TEXT NOT NULL,
  onboarded     INTEGER DEFAULT 0,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS password_resets (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  token      TEXT UNIQUE NOT NULL,
  used       INTEGER DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS onboarding_progress (
  user_id   TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  step      INTEGER DEFAULT 1,
  completed INTEGER DEFAULT 0,
  payload   TEXT DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS audit_log (
  id         TEXT PRIMARY KEY,
  user_id    TEXT,
  action     TEXT NOT NULL,
  resource   TEXT,
  ip_address TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

Type `.quit` to exit the shell when done.

### Step 6 — Install the libSQL client and connect

```bash
npm install @libsql/client
```

In `app/js/db.js`, replace the top of the file with:

```javascript
import { createClient } from '@libsql/client';

const client = createClient({
  url: 'libsql://medicorehub-<your-org>.turso.io',   // from Step 4
  authToken: '<your-auth-token>'                       // from Step 4
});
```

> **Security tip:** In production, load these from environment variables (`process.env.TURSO_URL`, `process.env.TURSO_TOKEN`) and never commit them to version control.

### Step 7 — Swap the simulation methods

Each method in `db.js` is already documented with the equivalent real `client.execute()` call. Example replacement for `authenticate()`:

```javascript
async authenticate(email, password) {
  const result = await client.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [email.toLowerCase()]
  });
  const user = result.rows[0];
  if (!user || user.password_hash !== hashPassword(password)) {
    throw new Error('Invalid email or password.');
  }
  return sanitize(user);
}
```

Replace `hashPassword()` with `bcrypt.compare()` or `argon2.verify()` in production.

### Turso Quick Reference

| Command | Description |
|---------|-------------|
| `turso db list` | List all your databases |
| `turso db show medicorehub` | Show DB info (URL, region, size) |
| `turso db shell medicorehub` | Open interactive SQL shell |
| `turso db tokens create medicorehub` | Create a new auth token |
| `turso db destroy medicorehub` | Delete the database |
| `turso db replicate medicorehub --location <region>` | Add a read replica |

Available regions: `ams` (Amsterdam), `nbo` (Nairobi), `sin` (Singapore), `iad` (N. Virginia), and [more](https://docs.turso.tech/reference/platform-rest-api/locations).

> **Tip for Kenya deployments:** Use `nbo` (Nairobi) as your primary region for the lowest latency from East African facilities.

---

## PWA Features

- **Manifest** — installable on Android, iOS (Safari "Add to Home Screen"), and desktop Chrome/Edge
- **Service Worker** — network-first fetch with offline fallback to cached pages
- **Offline indicator** — yellow bar appears when connectivity is lost
- **Install banner** — triggered by `beforeinstallprompt` event after 3 seconds
- **Push notifications** — registered in service worker, demo payload structure included
- **Background sync** — `sync` event handler stubbed for offline form submissions

---

## App Pages

| Page                     | Route                          | Description                                        |
|--------------------------|--------------------------------|----------------------------------------------------|
| Login                    | `/app/pages/login.html`        | Email + social SSO, back-to-home button            |
| Register                 | `/app/pages/register.html`     | 2-step: personal info → facility info              |
| Reset Password           | `/app/pages/reset-password.html` | 4-state: request → sent → set new → done         |
| Onboarding               | `/app/pages/onboarding.html`   | 5-step preference wizard with role, modules, alerts|
| Dashboard                | `/app/pages/dashboard.html`    | Stats, alerts, appointments, audit log             |
| Settings                 | `/app/pages/settings.html`     | Profile, password, notifications, security, danger |
| Platform Modules         | `/app/pages/modules.html`      | Section-based, sticky ToC, reading progress bar    |

---

## Responsive Breakpoints

| Breakpoint  | Behaviour                                                        |
|-------------|------------------------------------------------------------------|
| `> 1024px`  | Full layout — sidebar + content, 4-col stats grid               |
| `≤ 1024px`  | 2-col stats grid, 2-col grid-3                                   |
| `≤ 960px`   | Sidebar collapses to drawer, auth left panel hidden              |
| `≤ 768px`   | Single column grids, search bar shrinks, page padding reduces    |
| `≤ 480px`   | Mobile-first: search hidden, form grids stack, full-width CTAs   |
| `≤ 360px`   | Extra small phone optimisations                                  |
| Touch        | All interactive targets ≥ 44px per WCAG 2.5.5                   |

---

## Security Notes

- Passwords are hashed in the simulation layer using a deterministic function. **In production, use bcrypt or Argon2.**
- Session tokens are UUIDs stored in `sessionStorage` (cleared on browser close).
- The password reset simulation logs the token to `console.info` and `window._mch_reset_token` for testing only. In production, send via email (Resend/SendGrid).
- All form inputs are validated client-side. **Always validate server-side in production.**

---

## Deployment

### Vercel
```bash
vercel --prod
```

### Netlify
Drag and drop the `medicorehub/` folder to netlify.com/drop.

### Static hosting
Any static host works — the app has no server dependencies in simulation mode.

---

*MediCore Hub — Built for Kenya's health system. 2026*
