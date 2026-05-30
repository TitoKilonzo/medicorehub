// MediCore Hub — Main JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Init Lucide icons
  if (window.lucide) lucide.createIcons();

  // Sticky nav scroll effect
  const nav = document.getElementById('mainNav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    });
  }

  // Mobile menu toggle
  const toggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  if (toggle && mobileMenu) {
    mobileMenu.classList.add('hidden');
    toggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
      mobileMenu.classList.toggle('open');
    });
  }

  // Animated counters
  const counters = document.querySelectorAll('.stat-num[data-target]');
  if (counters.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => observer.observe(c));
  }

  function animateCounter(el) {
    const target = parseFloat(el.dataset.target);
    const isDecimal = String(target).includes('.');
    const duration = 1800;
    const step = 16;
    const increment = target / (duration / step);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = isDecimal ? current.toFixed(2) : Math.floor(current);
    }, step);
  }

  // Metric card counters (analytics page)
  const metricVals = document.querySelectorAll('.metric-val[data-target]');
  if (metricVals.length) {
    const obs2 = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCounter(e.target);
          obs2.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    metricVals.forEach(m => obs2.observe(m));
  }

  // Scroll-reveal for cards
  const revealEls = document.querySelectorAll('.module-card, .testi-card, .metric-card, .security-pillar-card, .interop-badge, .pillar');
  if (revealEls.length) {
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach((e, idx) => {
        if (e.isIntersecting) {
          setTimeout(() => {
            e.target.style.opacity = '1';
            e.target.style.transform = 'translateY(0)';
          }, 80 * (idx % 6));
          revealObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    revealEls.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      revealObs.observe(el);
    });
  }

  // Contact form submission (demo)
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      btn.textContent = 'Message Sent';
      btn.style.background = 'var(--teal-dark)';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = 'Send Message';
        btn.style.background = '';
        btn.disabled = false;
        contactForm.reset();
      }, 3000);
    });
  }

  // Active nav link detection
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href').split('/').pop();
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
});
