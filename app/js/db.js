/**
 * MediCore Hub — Turso (libSQL) Database Layer
 * Production-ready database access using @libsql/client in the browser.
 * If no valid Turso URL/auth token is set, the file falls back to the built-in localStorage simulation.
 *
 * Loaded as a regular script (NOT type="module") so that window.db is
 * available synchronously to all subsequent inline <script> blocks.
 * The Turso client is imported dynamically at runtime.
 */

const TURSO_CONFIG = {
  url: 'libsql://medicorehub-titokilonzo.aws-ap-northeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODAzMDU2OTQsImlkIjoiMDE5ZTgyNjktMTIwMS03Zjc1LWI2ZjMtOWE2ODViNmFkYjFiIiwicmlkIjoiNDFjNzc0YWEtZTM5Zi00NmM2LWE0OTEtZDYxZmY3YTM0YTk1In0.Duyj9osYecIUugCWW2HDs8-FgqJzRYk2gGQD4SFpWALfg3RsBlJQBDYhvO9Mhcr6ULiybFuTt83P2Vn0T-aCBw'
};

const USE_REMOTE = Boolean(
  TURSO_CONFIG.url && TURSO_CONFIG.authToken && !TURSO_CONFIG.authToken.startsWith('your-')
);

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

class TursoClient {
  constructor() {
    this._store = this._load();
    this._init();
    this._useRemote = USE_REMOTE;
    this._client = null;
    this._ready = this._useRemote ? this._initRemote() : Promise.resolve();
  }

  async _initRemote() {
    try {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@libsql/client@0.17.3/lib-esm/web.js');
      this._client = createClient({
        url: TURSO_CONFIG.url,
        authToken: TURSO_CONFIG.authToken
      });
      await this._execute(SCHEMA_SQL);
    } catch (error) {
      console.warn('Unable to initialize remote database. Falling back to localStorage.', error);
      this._useRemote = false;
      this._client = null;
    }
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
    let h = 5381n;
    const buf = new TextEncoder().encode(str + 'mch_salt_2026');
    buf.forEach(b => { h = (h * 33n ^ BigInt(b)) & 0xFFFFFFFFFFFFFFFFn; });
    return 'sim$' + h.toString(36);
  }

  async _execute(sql, args = []) {
    if (!this._client && this._ready) {
      await this._ready;
    }
    if (!this._client) throw new Error('Remote Turso client not initialized.');
    return await this._client.execute({ sql, args });
  }

  async _getRow(sql, args = []) {
    const result = await this._execute(sql, args);
    return result?.rows?.[0] ?? null;
  }

  async _getRows(sql, args = []) {
    const result = await this._execute(sql, args);
    return result?.rows ?? [];
  }

  async _run(sql, args = []) {
    await this._execute(sql, args);
  }

  _safe(u) {
    const { password_hash, ...rest } = u;
    return rest;
  }

  async _findUserByEmail(email) {
    const normalized = email.toLowerCase();
    if (this._useRemote) {
      await this._ready;
      const user = await this._getRow('SELECT * FROM users WHERE email = ? LIMIT 1', [normalized]);
      return user ? this._safe(user) : null;
    }
    const u = this._store.users.find(u => u.email.toLowerCase() === normalized);
    return u ? this._safe(u) : null;
  }

  // Public alias so callers don't need the underscore
  async findUserByEmail(email) {
    return this._findUserByEmail(email);
  }

  async createUser({ name, email, password, role = 'clinician', facility = '', county = '', phone = '' }) {
    email = email.toLowerCase();
    if (this._useRemote) {
      const existing = await this._getRow('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
      if (existing) throw new Error('An account with this email already exists.');

      const id = this._uuid();
      const now = new Date().toISOString();
      const password_hash = this._hash(password);
      await this._run(`INSERT INTO users (id, email, name, role, facility, county, phone, avatar_url, password_hash, preferences, onboarded, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, email, name, role, facility, county, phone, null, password_hash, '{}', 0, now, now]);

      await this._log(id, 'USER_REGISTERED', 'users');
      return this._safe({ id, email, name, role, facility, county, phone, avatar_url: null, preferences: '{}', onboarded: 0, created_at: now, updated_at: now });
    }

    if (this._store.users.find(u => u.email.toLowerCase() === email))
      throw new Error('An account with this email already exists.');

    const user = {
      id: this._uuid(), name, email, role,
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
    email = email.toLowerCase();
    if (this._useRemote) {
      const user = await this._getRow('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
      if (!user || user.password_hash !== this._hash(password))
        throw new Error('Invalid email or password. Please try again.');

      await this._log(user.id, 'LOGIN', 'sessions');
      return this._safe(user);
    }

    const user = this._store.users.find(u => u.email === email);
    if (!user || user.password_hash !== this._hash(password))
      throw new Error('Invalid email or password. Please try again.');
    await this._log(user.id, 'LOGIN', 'sessions');
    return this._safe(user);
  }

  async getUser(id) {
    if (this._useRemote) {
      const user = await this._getRow('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
      return user ? this._safe(user) : null;
    }
    const u = this._store.users.find(u => u.id === id);
    return u ? this._safe(u) : null;
  }

  async updateProfile(id, { name, phone, facility, county, role }) {
    if (this._useRemote) {
      const existing = await this._getRow('SELECT id FROM users WHERE id = ? LIMIT 1', [id]);
      if (!existing) throw new Error('User not found.');
      const updated_at = new Date().toISOString();
      await this._run('UPDATE users SET name = ?, phone = ?, facility = ?, county = ?, role = ?, updated_at = ? WHERE id = ?', [name, phone, facility, county, role, updated_at, id]);
      return this._safe(await this.getUser(id));
    }
    const idx = this._store.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found.');
    Object.assign(this._store.users[idx], { name, phone, facility, county, role, updated_at: new Date().toISOString() });
    this._save();
    await this._log(id, 'PROFILE_UPDATED', 'users');
    return this._safe(this._store.users[idx]);
  }

  async changePassword(id, current, next) {
    if (this._useRemote) {
      const user = await this._getRow('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
      if (!user) throw new Error('User not found.');
      if (user.password_hash !== this._hash(current))
        throw new Error('Current password is incorrect.');
      if (next.length < 8)
        throw new Error('New password must be at least 8 characters.');
      const password_hash = this._hash(next);
      const updated_at = new Date().toISOString();
      await this._run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [password_hash, updated_at, id]);
      await this._log(id, 'PASSWORD_CHANGED', 'users');
      return true;
    }
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

  async createSession(userId) {
    if (this._useRemote) {
      const token = this._uuid() + this._uuid().replace(/-/g, '');
      const expires = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
      const id = this._uuid();
      const created_at = new Date().toISOString();
      await this._run('INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)', [id, userId, token, expires, created_at]);
      return { id, user_id: userId, token, expires_at: expires, created_at };
    }
    const token = this._uuid() + this._uuid().replace(/-/g, '');
    const expires = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
    const sess = { id: this._uuid(), user_id: userId, token, expires_at: expires, created_at: new Date().toISOString() };
    this._store.sessions.push(sess);
    this._save();
    return sess;
  }

  async validateSession(token) {
    if (this._useRemote) {
      const sess = await this._getRow('SELECT * FROM sessions WHERE token = ? LIMIT 1', [token]);
      if (!sess) return null;
      if (new Date(sess.expires_at) < new Date()) {
        await this.destroySession(token);
        return null;
      }
      return this.getUser(sess.user_id);
    }
    const sess = this._store.sessions.find(s => s.token === token);
    if (!sess || new Date(sess.expires_at) < new Date()) {
      if (sess) this._store.sessions = this._store.sessions.filter(s => s.token !== token);
      this._save();
      return null;
    }
    return this.getUser(sess.user_id);
  }

  async destroySession(token) {
    if (this._useRemote) {
      await this._run('DELETE FROM sessions WHERE token = ?', [token]);
      return;
    }
    this._store.sessions = this._store.sessions.filter(s => s.token !== token);
    this._save();
  }

  async requestReset(email) {
    email = email.toLowerCase();
    if (this._useRemote) {
      const user = await this._getRow('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
      if (!user) throw new Error('No account found with that email address.');
      const token = this._uuid();
      const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      await this._run('INSERT INTO password_resets (id, email, token, used, expires_at, created_at) VALUES (?, ?, ?, 0, ?, ?)', [this._uuid(), email, token, expires, new Date().toISOString()]);
      console.log(`[Turso] Reset link → /app/pages/reset-password.html?token=${token}`);
      return token;
    }
    if (!this._store.users.find(u => u.email.toLowerCase() === email))
      throw new Error('No account found with that email address.');
    const token = this._uuid();
    const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    this._store.password_resets.push({ id: this._uuid(), email, token, used: 0, expires_at: expires, created_at: new Date().toISOString() });
    this._save();
    console.log(`[Turso Sim] Reset link → /app/pages/reset-password.html?token=${token}`);
    return token;
  }

  async applyReset(token, newPassword) {
    if (this._useRemote) {
      const reset = await this._getRow('SELECT * FROM password_resets WHERE token = ? LIMIT 1', [token]);
      if (!reset || reset.used) throw new Error('Reset link is invalid or has already been used.');
      if (new Date(reset.expires_at) < new Date()) throw new Error('Reset link has expired. Please request a new one.');
      if (newPassword.length < 8) throw new Error('Password must be at least 8 characters.');
      const user = await this._getRow('SELECT * FROM users WHERE email = ? LIMIT 1', [reset.email]);
      if (!user) throw new Error('Account not found.');
      const password_hash = this._hash(newPassword);
      await this._run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [password_hash, new Date().toISOString(), user.id]);
      await this._run('UPDATE password_resets SET used = 1 WHERE token = ?', [token]);
      await this._log(user.id, 'PASSWORD_RESET', 'users');
      return true;
    }
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

  async saveOnboardingStep(userId, step, data) {
    if (this._useRemote) {
      const existing = await this._getRow('SELECT payload FROM onboarding_progress WHERE user_id = ? LIMIT 1', [userId]);
      const current = existing ? JSON.parse(existing.payload || '{}') : {};
      const payload = JSON.stringify({ ...current, ...data });
      await this._run('INSERT INTO onboarding_progress (user_id, step, completed, payload) VALUES (?, ?, 0, ?) ON CONFLICT(user_id) DO UPDATE SET step = excluded.step, payload = excluded.payload', [userId, step, payload]);
      return true;
    }
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
    if (this._useRemote) {
      await this._run('UPDATE onboarding_progress SET completed = 1 WHERE user_id = ?', [userId]);
      await this._run('UPDATE users SET onboarded = 1 WHERE id = ?', [userId]);
      await this._log(userId, 'ONBOARDING_COMPLETED', 'onboarding');
      return;
    }
    const idx = this._store.onboarding.findIndex(o => o.user_id === userId);
    if (idx !== -1) this._store.onboarding[idx].completed = 1;
    const uIdx = this._store.users.findIndex(u => u.id === userId);
    if (uIdx !== -1) this._store.users[uIdx].onboarded = 1;
    this._save();
    await this._log(userId, 'ONBOARDING_COMPLETED', 'onboarding');
  }

  async getOnboarding(userId) {
    if (this._useRemote) {
      const row = await this._getRow('SELECT * FROM onboarding_progress WHERE user_id = ? LIMIT 1', [userId]);
      if (!row) return { step: 1, completed: 0, payload: {} };
      return { step: row.step, completed: row.completed, payload: JSON.parse(row.payload || '{}') };
    }
    const r = this._store.onboarding.find(o => o.user_id === userId);
    if (!r) return { step: 1, completed: 0, payload: {} };
    return { step: r.step, completed: r.completed, payload: JSON.parse(r.payload || '{}') };
  }

  async _log(userId, action, resource) {
    if (this._useRemote) {
      await this._run('INSERT INTO audit_log (id, user_id, action, resource, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?)', [
        this._uuid(), userId, action, resource, '127.0.0.1', new Date().toISOString()]);
      return;
    }
    this._store.audit_log.push({ id: this._uuid(), user_id: userId, action, resource, ip_address: '127.0.0.1', created_at: new Date().toISOString() });
    this._save();
  }

  async getAuditLog(userId, limit = 30) {
    if (this._useRemote) {
      return await this._getRows('SELECT * FROM audit_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [userId, limit]);
    }
    return this._store.audit_log.filter(l => l.user_id === userId).slice(-limit).reverse();
  }

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

// Expose a promise that resolves once the DB is fully initialized.
// Inline scripts should: await window.dbReady; before calling db methods.
window.dbReady = db._ready;
