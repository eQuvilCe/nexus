/* ============ Shared site upgrade: theme, a11y, forms, small UX niceties ============ */
(function () {
  'use strict';

  var THEME_KEY = 'nexus-theme';

  // Storage is wrapped in try/catch: this same file also runs inside
  // in-chat previews where localStorage can be unavailable — it should
  // never throw, it should just fall back to an in-memory (session-only) theme.
  function getStoredTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function setStoredTheme(v) {
    try { localStorage.setItem(THEME_KEY, v); } catch (e) { /* no-op: memory-only fallback */ }
  }

  var systemPrefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  var currentTheme = getStoredTheme() || (systemPrefersLight ? 'light' : 'dark');

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.textContent = theme === 'light' ? '🌙' : '☀️';
      btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    });
  }
  applyTheme(currentTheme);

  function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme-transition', '');
    applyTheme(currentTheme);
    setStoredTheme(currentTheme);
    window.setTimeout(function () { document.body.removeAttribute('data-theme-transition'); }, 400);
  }

  // Exposed globally: true when the OS asked for less motion. Other scripts
  // (particles, tilt cards) check this to skip/soften heavy animation.
  window.prefersReducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  window.isValidEmail = function (email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  window.siteToast = function (msg) {
    var toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    window.clearTimeout(toast._hideTimer);
    toast._hideTimer = window.setTimeout(function () { toast.classList.remove('show'); }, 3000);
  };

  function initThemeToggle() {
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', toggleTheme);
    });
  }

  function initSkipLink() {
    if (document.querySelector('.skip-link')) return;
    var target = document.querySelector('#main-content') ? '#main-content' : '#navbar';
    var skip = document.createElement('a');
    skip.href = target;
    skip.className = 'skip-link';
    skip.textContent = 'Skip to content';
    document.body.insertBefore(skip, document.body.firstChild);
  }

  function initBackToTop() {
    var btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Back to top');
    btn.textContent = '↑';
    document.body.appendChild(btn);
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: window.prefersReducedMotion ? 'auto' : 'smooth' });
    });
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        btn.classList.toggle('show', window.scrollY > 500);
        ticking = false;
      });
    }, { passive: true });
  }

  function initNewsletterForms() {
    document.querySelectorAll('.newsletter-form').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = form.querySelector('input[type="email"]');
        var btn = form.querySelector('button');
        var email = input.value.trim();
        if (!window.isValidEmail(email)) {
          input.style.borderColor = '#ff6b6b';
          window.siteToast('Please enter a valid email address');
          input.focus();
          return;
        }
        input.style.borderColor = '';
        btn.disabled = true;
        var originalLabel = btn.textContent;
        btn.textContent = 'Joining…';
        window.setTimeout(function () {
          btn.textContent = 'Subscribed ✓';
          window.siteToast("You're on the list — thanks for subscribing! 🎉");
          input.value = '';
          window.setTimeout(function () {
            btn.disabled = false;
            btn.textContent = originalLabel;
          }, 2500);
        }, 600);
      });
    });
  }

  // Escape key closes the mobile menu regardless of which page's inline
  // script wired it up, and keeps the hamburger icon in sync.
  function initEscapeToClose() {
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var menu = document.querySelector('.mobile-menu.active');
      if (!menu) return;
      menu.classList.remove('active');
      var hamburger = document.querySelector('.nav-hamburger');
      if (hamburger) {
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.focus();
        var spans = hamburger.querySelectorAll('span');
        if (spans.length === 3) {
          spans[0].style.transform = 'none';
          spans[1].style.opacity = '1';
          spans[2].style.transform = 'none';
        }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initThemeToggle();
    initSkipLink();
    initBackToTop();
    initNewsletterForms();
    initEscapeToClose();
  });
})();
