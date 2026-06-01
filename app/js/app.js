/* MediCore Hub — App JS  */
'use strict';

// ── PWA ──────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// ── Lucide icons ─────────────────────────────────────────────────
function initIcons(root) {
  if (window.lucide) {
    root ? lucide.createIcons({ nodes: [root] }) : lucide.createIcons();
  }
}
document.addEventListener('DOMContentLoaded', () => initIcons());

// ── Offline indicator ─────────────────────────────────────────────
(function () {
  const bar = document.getElementById('offlineBar');
  function sync() { bar && bar.classList.toggle('visible', !navigator.onLine); }
  window.addEventListener('online',  sync);
  window.addEventListener('offline', sync);
  sync();
})();

// ── Toast ─────────────────────────────────────────────────────────
const Toast = (function () {
  let container = null;
  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }
  const ICONS = { success: 'check-circle', error: 'x-circle', info: 'info', warning: 'alert-triangle' };
  function show(msg, type, sub, ms) {
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<i data-lucide="${ICONS[type] || 'info'}"></i>
      <div><div class="toast-msg">${msg}</div>${sub ? `<div class="toast-sub">${sub}</div>` : ''}</div>`;
    getContainer().appendChild(t);
    initIcons(t);
    setTimeout(() => {
      t.classList.add('is-removing');
      t.addEventListener('animationend', () => t.remove(), { once: true });
    }, ms || 4000);
  }
  return {
    success(m, s) { show(m, 'success', s); },
    error(m, s)   { show(m, 'error',   s); },
    info(m, s)    { show(m, 'info',    s); },
    warning(m, s) { show(m, 'warning', s); }
  };
})();
window.Toast = Toast;

// ── Button loading ────────────────────────────────────────────────
function setLoading(btn, on) {
  if (!btn) return;
  btn.disabled = on;
  btn.classList.toggle('is-loading', on);
}
window.setLoading = setLoading;

// ── Password visibility toggle ────────────────────────────────────
document.addEventListener('click', e => {
  const btn = e.target.closest('.input-toggle');
  if (!btn) return;
  const input = btn.closest('.input-wrap')?.querySelector('input');
  if (!input) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.querySelector('i')?.setAttribute('data-lucide', isHidden ? 'eye-off' : 'eye');
  initIcons(btn);
});

// ── Validation helpers ────────────────────────────────────────────
function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
function pwStrength(v) {
  const checks = [v.length >= 8, /[A-Z]/.test(v), /[0-9]/.test(v), /[^A-Za-z0-9]/.test(v)];
  return { score: checks.filter(Boolean).length, checks };
}
window.validEmail = validEmail;
window.pwStrength = pwStrength;

// ── Password strength bar ─────────────────────────────────────────
function renderStrengthBar(val, barsEl, labelEl) {
  const { score } = pwStrength(val);
  const levels = ['', 'weak', 'fair', 'good', 'strong'];
  const names  = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#EF4444', '#F59E0B', '#38BDF8', '#10B981'];
  barsEl.querySelectorAll('.strength-bar').forEach((b, i) => {
    b.className = 'strength-bar' + (i < score ? ` ${levels[score]}` : '');
  });
  if (labelEl) {
    labelEl.textContent = val ? `Password strength: ${names[score]}` : '';
    labelEl.style.color = colors[score] || '';
  }
}
window.renderStrengthBar = renderStrengthBar;

// ── Field error helpers ───────────────────────────────────────────
function fieldError(input, msg) {
  input.classList.add('is-error');
  let el = input.closest('.form-group')?.querySelector('.field-error');
  if (!el) {
    el = document.createElement('div');
    el.className = 'field-error';
    input.closest('.form-group').appendChild(el);
  }
  el.innerHTML = `<i data-lucide="alert-circle"></i>${msg}`;
  initIcons(el);
}
function clearField(input) {
  input.classList.remove('is-error');
  input.closest('.form-group')?.querySelector('.field-error')?.remove();
}
function clearForm(form) {
  form.querySelectorAll('.is-error').forEach(el => el.classList.remove('is-error'));
  form.querySelectorAll('.field-error').forEach(el => el.remove());
  form.querySelectorAll('.form-alert').forEach(el => el.remove());
}
function formAlert(form, msg, type) {
  let el = form.querySelector('.form-alert');
  if (!el) { el = document.createElement('div'); el.className = 'form-alert'; form.prepend(el); }
  const icons = { error: 'x-circle', success: 'check-circle', info: 'info' };
  el.className = `alert alert-${type || 'error'} form-alert`;
  el.innerHTML = `<i data-lucide="${icons[type || 'error']}"></i><span>${msg}</span>`;
  initIcons(el);
}
window.fieldError   = fieldError;
window.clearField   = clearField;
window.clearForm    = clearForm;
window.formAlert    = formAlert;

// ── Auth guard ────────────────────────────────────────────────────
function requireAuth(redirect) {
  if (!window.db) return null;
  const auth = window.db.getAuth();
  if (!auth) {
    window.location.href = redirect || '/app/pages/login.html';
    return null;
  }
  // Set avatar initials wherever present
  const initials = (auth.user.name || 'U')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  document.querySelectorAll('.topbar-avatar').forEach(el => {
    if (!el.querySelector('img')) el.textContent = initials;
  });
  return auth;
}
window.requireAuth = requireAuth;

// ── Modal helpers ─────────────────────────────────────────────────
function openModal(id)  { const m = document.getElementById(id); if (m) { m.classList.add('is-open');  document.body.style.overflow = 'hidden'; } }
function closeModal(id) { const m = document.getElementById(id); if (m) { m.classList.remove('is-open'); document.body.style.overflow = '';       } }
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop') || e.target.closest('.modal-close')) {
    document.querySelectorAll('.modal-backdrop.is-open').forEach(m => {
      m.classList.remove('is-open');
      document.body.style.overflow = '';
    });
  }
});
window.openModal  = openModal;
window.closeModal = closeModal;

// ── ToC scroll observer ───────────────────────────────────────────
function initToc(scrollEl) {
  const sections = document.querySelectorAll('[data-toc-section]');
  if (!sections.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      document.querySelectorAll('.toc-item').forEach(t => t.classList.remove('is-active'));
      document.querySelector(`.toc-item[href="#${e.target.id}"]`)?.classList.add('is-active');
    });
  }, { root: scrollEl || null, threshold: 0.3, rootMargin: '-70px 0px -60% 0px' });
  sections.forEach(s => obs.observe(s));
}
window.initToc = initToc;

// ── PWA install ───────────────────────────────────────────────────
let _deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _deferredPrompt = e;
  const banner = document.getElementById('pwaBanner');
  if (banner && !localStorage.getItem('pwa_dismissed')) {
    setTimeout(() => banner.classList.remove('is-hidden'), 3000);
  }
});
document.addEventListener('click', async e => {
  if (e.target.closest('#pwaInstallBtn') && _deferredPrompt) {
    _deferredPrompt.prompt();
    const { outcome } = await _deferredPrompt.userChoice;
    if (outcome === 'accepted') Toast.success('Installing MediCore Hub', 'Check your home screen');
    _deferredPrompt = null;
    document.getElementById('pwaBanner')?.classList.add('is-hidden');
  }
  if (e.target.closest('#pwaDismissBtn')) {
    document.getElementById('pwaBanner')?.classList.add('is-hidden');
    localStorage.setItem('pwa_dismissed', '1');
  }
});

// ── Mobile sidebar drawer ────────────────────────────────────────
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const sidebar  = document.querySelector('.app-sidebar');
    const menuBtn  = document.getElementById('mobileMenuBtn');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (!sidebar) return;

    function openDrawer()  {
      sidebar.classList.add('is-open');
      if (backdrop) backdrop.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function closeDrawer() {
      sidebar.classList.remove('is-open');
      if (backdrop) backdrop.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    menuBtn?.addEventListener('click', openDrawer);
    backdrop?.addEventListener('click', closeDrawer);

    // Close on nav link click (mobile)
    sidebar.querySelectorAll('.sidebar-link, .sidebar-link button').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 960) closeDrawer();
      });
    });

    // Close on resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 960) closeDrawer();
    });
  });
})();
