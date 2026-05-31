/**
 * MediCore Hub — Turso (libSQL) Database Layer
 * Simulates real Turso/libSQL operations with localStorage persistence.
 *
 * PRODUCTION SWAP:
 *   npm install @libsql/client
 *   import { createClient } from '@libsql/client';
 *   const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
 *   Then replace each method body with: await client.execute({ sql, args })
 *
 * Turso CLI setup:
 *   turso db create medicorehub
 *   turso db shell medicorehub < schema.sql
 *   turso db tokens create medicorehub
 */

const TURSO_CONFIG = {
  url: 'libsql://medicorehub-yourorg.turso.io',
  authToken: 'your-turso-auth-token'
};

/* ─────────────────────────────────────────────────────────────────────────────
   Schema (paste into Turso dashboard or run via turso db shell)
   ───────────────────────────────────────────────────────────────────────────── */
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  role        TEXT DEFAULT 'clinician',
  facility    TEXT DEFAULT '',
  county      TEXT DEFAULT '',
  phone       TEXT DEFAULT '',
  avatar_url  TEXT,
  password_hash TEXT NOT NULL,
  preferences TEXT DEFAULT '{}',
  onboarded   INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
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
`;

/* ─────────────────────────────────────────────────────────────────────────────
   Simulated Turso Client (localStorage-backed)
   ───────────────────────────────────────────────────────────────────────────── */
class TursoClient {
  constructor() {
    this._store = this._load();
    this._init();
  }

  _load() {
    try { return JSON.parse(localStorage.getItem('mch_db') || '{}'); }
    catch { return {}; }
  }

  _save() { localStorage.setItem('mch_db', JSON.stringify(this._store)); }

  _init() {
    ['users','sessions','password_resets','onboarding','audit_log']
      .forEach(t => { if (!this._store[t]) this._store[t] = []; });
    this._save();
  }

  _uuid() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
  }

  _hash(str) {
    // bcrypt substitute for simulation only — use bcrypt in production
    let h = 5381n;
    const buf = new TextEncoder().encode(str + 'mch_salt_2026');
    buf.forEach(b => { h = (h * 33n ^ BigInt(b)) & 0xFFFFFFFFFFFFFFFFn; });
    return 'sim$' + h.toString(36);
  }

  /* ── USERS ─────────────────────────────────────────────────────────────── */
  async createUser({ name, email, password, role = 'clinician', facility = '', county = '', phone = '' }) {
    if (this._store.users.find(u => u.email.toLowerCase() === email.toLowerCase()))
      throw new Error('An account with this email already exists.');

    const user = {
      id: this._uuid(), name, email: email.toLowerCase(), role,
      facility, county, phone, avatar_url: null,
      password_hash: this._hash(password),
      preferences: '{}', onboarded: 0,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    };
    this._store.users.push(user);
    this._save();
    await this._log(user.id, 'USER_REGISTERED', 'users');
    return this._safe(user);
  }

  async authenticate(email, password) {
    const user = this._store.users.find(u => u.email === email.toLowerCase());
    if (!user || user.password_hash !== this._hash(password))
      throw new Error('Invalid email or password. Please try again.');
    await this._log(user.id, 'LOGIN', 'sessions');
    return this._safe(user);
  }

  async getUser(id) {
    const u = this._store.users.find(u => u.id === id);
    return u ? this._safe(u) : null;
  }

  async updateProfile(id, { name, phone, facility, county, role }) {
    const idx = this._store.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found.');
    Object.assign(this._store.users[idx], { name, phone, facility, county, role,
      updated_at: new Date().toISOString() });
    this._save();
    await this._log(id, 'PROFILE_UPDATED', 'users');
    return this._safe(this._store.users[idx]);
  }

  async changePassword(id, current, next) {
    const user = this._store.users.find(u => u.id === id);
    if (!user) throw new Error('User not found.');
    if (user.password_hash !== this._hash(current))
      throw new Error('Current password is incorrect.');
    if (next.length < 8)
      throw new Error('New password must be at least 8 characters.');
    user.password_hash = this._hash(next);
    user.updated_at = new Date().toISOString();
    this._save();
    await this._log(id, 'PASSWORD_CHANGED', 'users');
    return true;
  }

  _safe(u) {
    const { password_hash, ...rest } = u;
    return rest;
  }

  /* ── SESSIONS ──────────────────────────────────────────────────────────── */
  async createSession(userId) {
    const token = this._uuid() + this._uuid().replace(/-/g, '');
    const expires = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
    const sess = { id: this._uuid(), user_id: userId, token, expires_at: expires,
                   created_at: new Date().toISOString() };
    this._store.sessions.push(sess);
    this._save();
    return sess;
  }

  async validateSession(token) {
    const sess = this._store.sessions.find(s => s.token === token);
    if (!sess || new Date(sess.expires_at) < new Date()) {
      if (sess) this._store.sessions = this._store.sessions.filter(s => s.token !== token);
      this._save();
      return null;
    }
    return this.getUser(sess.user_id);
  }

  async destroySession(token) {
    this._store.sessions = this._store.sessions.filter(s => s.token !== token);
    this._save();
  }

  /* ── PASSWORD RESET ────────────────────────────────────────────────────── */
  async requestReset(email) {
    if (!this._store.users.find(u => u.email === email.toLowerCase()))
      throw new Error('No account found with that email address.');
    const token = this._uuid();
    const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    this._store.password_resets.push({
      id: this._uuid(), email: email.toLowerCase(), token,
      used: 0, expires_at: expires, created_at: new Date().toISOString()
    });
    this._save();
    // Simulate email — in production use Resend/SendGrid
    console.log(`[Turso Sim] Reset link → /app/pages/reset-password.html?token=${token}`);
    return token;
  }

  async applyReset(token, newPassword) {
    const r = this._store.password_resets.find(r => r.token === token && !r.used);
    if (!r) throw new Error('Reset link is invalid or has already been used.');
    if (new Date(r.expires_at) < new Date()) throw new Error('Reset link has expired. Please request a new one.');
    if (newPassword.length < 8) throw new Error('Password must be at least 8 characters.');
    const user = this._store.users.find(u => u.email === r.email);
    if (!user) throw new Error('Account not found.');
    user.password_hash = this._hash(newPassword);
    user.updated_at = new Date().toISOString();
    r.used = 1;
    this._save();
    await this._log(user.id, 'PASSWORD_RESET', 'users');
    return true;
  }

  /* ── ONBOARDING ────────────────────────────────────────────────────────── */
  async saveOnboardingStep(userId, step, data) {
    const idx = this._store.onboarding.findIndex(o => o.user_id === userId);
    const existing = idx !== -1 ? JSON.parse(this._store.onboarding[idx].payload || '{}') : {};
    const merged = { ...existing, ...data };
    if (idx === -1) {
      this._store.onboarding.push({ user_id: userId, step, completed: 0, payload: JSON.stringify(merged) });
    } else {
      this._store.onboarding[idx] = { ...this._store.onboarding[idx], step, payload: JSON.stringify(merged) };
    }
    this._save();
    return true;
  }

  async finishOnboarding(userId) {
    const idx = this._store.onboarding.findIndex(o => o.user_id === userId);
    if (idx !== -1) this._store.onboarding[idx].completed = 1;
    const uIdx = this._store.users.findIndex(u => u.id === userId);
    if (uIdx !== -1) this._store.users[uIdx].onboarded = 1;
    this._save();
    await this._log(userId, 'ONBOARDING_COMPLETED', 'onboarding');
  }

  async getOnboarding(userId) {
    const r = this._store.onboarding.find(o => o.user_id === userId);
    if (!r) return { step: 1, completed: 0, payload: {} };
    return { step: r.step, completed: r.completed, payload: JSON.parse(r.payload || '{}') };
  }

  /* ── AUDIT ─────────────────────────────────────────────────────────────── */
  async _log(userId, action, resource) {
    this._store.audit_log.push({
      id: this._uuid(), user_id: userId, action, resource,
      ip_address: '127.0.0.1', created_at: new Date().toISOString()
    });
    this._save();
  }

  async getAuditLog(userId, limit = 30) {
    return this._store.audit_log
      .filter(l => l.user_id === userId)
      .slice(-limit).reverse();
  }

  /* ── CLIENT-SIDE AUTH STATE ────────────────────────────────────────────── */
  saveAuth(token, user) {
    sessionStorage.setItem('mch_tok', token);
    sessionStorage.setItem('mch_usr', JSON.stringify(user));
  }

  getAuth() {
    const token = sessionStorage.getItem('mch_tok');
    const raw   = sessionStorage.getItem('mch_usr');
    if (!token || !raw) return null;
    return { token, user: JSON.parse(raw) };
  }

  clearAuth() {
    sessionStorage.removeItem('mch_tok');
    sessionStorage.removeItem('mch_usr');
  }

  requireAuth(redirectTo = '/app/pages/login.html') {
    const auth = this.getAuth();
    if (!auth) { window.location.href = redirectTo; return null; }
    return auth;
  }
}

const db = new TursoClient();
window.db = db;
