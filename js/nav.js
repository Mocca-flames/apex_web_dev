/**
 * Navigation interactions
 *  - Mobile menu toggle
 *  - Close button within overlay
 *  - Body scroll lock (position:fixed on open; unlock + isolated scroll correction on close)
 *  - Auto-close menu on any scroll gesture
 *  - Sticky scrolled state (adds .nav--scrolled when page scrolled past 80px)
 */
(function() {
  var nav = document.querySelector('.nav');
  var menu = document.querySelector('.nav__menu');
  var toggle = document.querySelector('.nav__toggle');
  var closeBtn = document.querySelector('.nav__menu-close');
  var mobileFooter = document.getElementById('mobileFooter');
  var lenis = window.getLenis ? window.getLenis() : null;

  if (!nav || !menu || !toggle) return;

  // ── Open / close ──────────────────────────────────────────
  function openMenu() {
    toggle.setAttribute('aria-expanded', 'true');
    menu.classList.add('is-open');
    if (mobileFooter) mobileFooter.classList.add('is-visible');
    if (closeBtn) closeBtn.style.display = 'flex';

    // Lock body scroll: position:fixed + overflow:hidden on both root nodes.
    // position:fixed on body is respected by Android Chrome; iOS Safari ignores it
    // but the paired overflow:hidden on <html> limits most vertical jank.
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + (window.scrollY || window.pageYOffset) + 'px';
    document.body.style.width = '100%';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
    if (mobileFooter) mobileFooter.classList.remove('is-visible');
    if (closeBtn) closeBtn.style.display = 'none';

    // Unlock — remove fixed position and overflow locks
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';

    // Apply a scroll correction in the next frame so that services.js /
    // coverage.js don't see a hazardous 'scroll' event during body unlock.
    // lenis.stop() prevents Lenis from snaffling the event; setTimeout(0)
    // lets the browser finish the unlock paint first.
    if (lenis) {
      lenis.stop();
      setTimeout(function () {
        window.scrollTo(0, lenis.scroll || 0);
        lenis.start();
      }, 0);
    } else {
      requestAnimationFrame(function () {
        window.scrollTo(0, window.scrollY || 0);
      });
    }
  }

  // Close button (sibling of nav__menu — content.js never overwrites it)
  if (closeBtn) {
    closeBtn.addEventListener('click', closeMenu);
  }

  // Hamburger toggle
  toggle.addEventListener('click', function() {
    toggle.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu();
  });

  // Close on any link inside the overlay
  menu.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', closeMenu);
  });

  // Toggle backdrop / body lock when menu opens/closes
  var backdrop = document.getElementById('nav-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', closeMenu);
  }

  // Auto-close: any scroll attempt while open closes the menu
  document.addEventListener('scroll', function onMenuScroll() {
    if (menu.classList.contains('is-open')) {
      closeMenu();
    }
  }, { passive: true });

  // Sticky nav state: add .nav--scrolled at scroll > 80 px
  function updateNav() {
    if (window.scrollY > 80) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
  }
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // Close on resize to desktop
  window.addEventListener('resize', function() {
    if (window.innerWidth > 1024) {
      closeMenu();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      closeMenu();
      toggle.focus();
    }
  });
})();
