/* =====================================================================
   MediCore Hub — App JS (PWA + UI helpers)
   ===================================================================== */

// ── PWA Registration ──────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('[SW] Registered:', reg.scope))
      .catch(err => console.warn('[SW] Failed:', err));
  });
}

// ── Init Lucide icons wherever called ────────────────────────────────
function initIcons() {
  if (window.lucide) lucide.createIcons();
}
document.addEventListener('DOMContentLoaded', initIcons);

// ── Offline indicator ─────────────────────────────────────────────────
const offlineBar = document.getElementById('offlineBar');
function updateOnlineStatus() {
  if (offlineBar) offlineBar.classList.toggle('visible', !navigator.onLine);
}
window.addEventListener('online',  updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// ── Toast system ──────────────────────────────────────────────────────
const Toast = {
  container: null,
  init() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  },
  show(message, type = 'info', sub = '', duration = 4000) {
    this.init();
    const icons = { success: 'check-circle', error: 'x-circle', info: 'info', warning: 'alert-triangle' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i data-lucide="${icons[type] || 'info'}"></i>
      <div class="toast-text"><p>${message}</p>${sub ? `<span>${sub}</span>` : ''}</div>`;
    this.container.appendChild(toast);
    if (window.lucide) lucide.createIcons({ nodes: [toast] });
    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  },
  success(msg, sub) { this.show(msg, 'success', sub); },
  error(msg, sub)   { this.show(msg, 'error',   sub); },
  info(msg, sub)    { this.show(msg, 'info',     sub); }
};
window.Toast = Toast;

// ── Button loading state ──────────────────────────────────────────────
function setLoading(btn, loading, text = '') {
  if (!btn) return;
  if (loading) {
    btn.classList.add('loading');
    btn.disabled = true;
    if (text) btn.dataset.origText = btn.innerHTML;
  } else {
    btn.classList.remove('loading');
    btn.disabled = false;
    if (btn.dataset.origText) btn.innerHTML = btn.dataset.origText;
  }
}
window.setLoading = setLoading;

// ── Form validation ───────────────────────────────────────────────────
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePassword(pw) {
  return {
    length:  pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    number:  /\d/.test(pw),
    special: /[!@#$%^&*]/.test(pw),
    score:   [pw.length >= 8, /[A-Z]/.test(pw), /\d/.test(pw), /[!@#$%^&*]/.test(pw)].filter(Boolean).length
  };
}
window.validateEmail    = validateEmail;
window.validatePassword = validatePassword;

// ── Password strength UI ──────────────────────────────────────────────
function updateStrengthBar(pw, barsEl, labelEl) {
  const v = validatePassword(pw);
  const levels = ['', 'weak', 'fair', 'good', 'strong'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const bars = barsEl.querySelectorAll('.strength-bar');
  bars.forEach((bar, i) => {
    bar.className = 'strength-bar';
    if (i < v.score) bar.classList.add(levels[v.score]);
  });
  if (labelEl) {
    labelEl.textContent = pw ? `Password strength: ${labels[v.score]}` : '';
    labelEl.style.color = ['','#EF4444','#F59E0B','#0EA5E9','#10B981'][v.score];
  }
}
window.updateStrengthBar = updateStrengthBar;

// ── Toggle password visibility ────────────────────────────────────────
document.addEventListener('click', e => {
  const btn = e.target.closest('.input-toggle');
  if (!btn) return;
  const input = btn.closest('.input-wrap').querySelector('input');
  const icon  = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.setAttribute('data-lucide', 'eye-off');
  } else {
    input.type = 'password';
    icon.setAttribute('data-lucide', 'eye');
  }
  if (window.lucide) lucide.createIcons({ nodes: [btn] });
});

// ── Field error helpers ───────────────────────────────────────────────
function showFieldError(input, msg) {
  input.classList.add('error');
  let err = input.closest('.form-group').querySelector('.field-error');
  if (!err) {
    err = document.createElement('div');
    err.className = 'field-error';
    input.closest('.form-group').appendChild(err);
  }
  err.innerHTML = `<i data-lucide="alert-circle"></i>${msg}`;
  if (window.lucide) lucide.createIcons({ nodes: [err] });
}
function clearFieldError(input) {
  input.classList.remove('error');
  const err = input.closest('.form-group')?.querySelector('.field-error');
  if (err) err.remove();
}
function clearAllErrors(form) {
  form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  form.querySelectorAll('.field-error').forEach(el => el.remove());
  form.querySelectorAll('.alert').forEach(el => el.remove());
}
function showFormAlert(form, msg, type = 'error') {
  let el = form.querySelector('.form-alert');
  if (!el) { el = document.createElement('div'); el.className = 'form-alert'; form.prepend(el); }
  const icons = { error: 'x-circle', success: 'check-circle', info: 'info' };
  el.className = `alert alert-${type} form-alert`;
  el.innerHTML = `<i data-lucide="${icons[type]}"></i><span>${msg}</span>`;
  if (window.lucide) lucide.createIcons({ nodes: [el] });
}
window.showFieldError  = showFieldError;
window.clearFieldError = clearFieldError;
window.clearAllErrors  = clearAllErrors;
window.showFormAlert   = showFormAlert;

// ── Topbar avatar initials ────────────────────────────────────────────
function setAvatarInitials(name) {
  const els = document.querySelectorAll('.topbar-avatar, .avatar-circle');
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  els.forEach(el => { if (!el.querySelector('img')) el.textContent = initials; });
}
window.setAvatarInitials = setAvatarInitials;

// ── Auth guard ────────────────────────────────────────────────────────
function requireAuth() {
  if (!window.db) return;
  const auth = db.getAuth();
  if (!auth) { window.location.href = '/app/pages/login.html'; return null; }
  setAvatarInitials(auth.user.name || 'U');
  return auth;
}
window.requireAuth = requireAuth;

// ── PWA install prompt ────────────────────────────────────────────────
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  const banner = document.getElementById('pwaBanner');
  if (banner && !localStorage.getItem('pwa_dismissed')) {
    setTimeout(() => banner.classList.remove('hidden'), 2500);
  }
});
document.addEventListener('click', async e => {
  if (e.target.closest('#pwaInstall')) {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') Toast.success('Installing MediCore Hub…', 'Check your home screen');
      deferredPrompt = null;
    }
    document.getElementById('pwaBanner')?.classList.add('hidden');
  }
  if (e.target.closest('#pwaDismiss')) {
    document.getElementById('pwaBanner')?.classList.add('hidden');
    localStorage.setItem('pwa_dismissed', '1');
  }
});

// ── Smooth scroll for ToC ─────────────────────────────────────────────
document.addEventListener('click', e => {
  const toc = e.target.closest('.toc-item[href]');
  if (!toc) return;
  e.preventDefault();
  const target = document.querySelector(toc.getAttribute('href'));
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelectorAll('.toc-item').forEach(t => t.classList.remove('active'));
    toc.classList.add('active');
  }
});

// ── Intersection observer for ToC active state ────────────────────────
function initTocObserver() {
  const sections = document.querySelectorAll('.section-content-block[id]');
  if (!sections.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.toc-item').forEach(t => t.classList.remove('active'));
        const active = document.querySelector(`.toc-item[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.3, rootMargin: '-80px 0px -60% 0px' });
  sections.forEach(s => obs.observe(s));
}
document.addEventListener('DOMContentLoaded', initTocObserver);

// ── Modal helpers ─────────────────────────────────────────────────────
function openModal(id)  {
  const m = document.getElementById(id);
  if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
}
document.addEventListener('click', e => {
  if (e.target.closest('.modal-close') || e.target.classList.contains('modal-overlay')) {
    document.querySelectorAll('.modal-overlay.open').forEach(m => {
      m.classList.remove('open');
      document.body.style.overflow = '';
    });
  }
});
window.openModal  = openModal;
window.closeModal = closeModal;
