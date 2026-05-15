// scroll.js — Lenis smooth-scroll singleton
// Loaded on demand by modules that depend on smooth scroll
// Initialized only on desktop, non-reduced-motion, tier-2

(function() {
  let lenisInstance = null;

  function getLenis() {
    return lenisInstance;
  }

  function initLenis() {
    if (typeof Lenis === 'undefined') {
      console.warn('Lenis library not loaded');
      return null;
    }

    var lenis = new Lenis({
      duration: 0.8,
      easing: function(t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      orientation: 'vertical',
      smoothWheel: false,
      smoothTouch: false,
      touchMultiplier: 2,
      lerp: 0.1
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      lenis.destroy();
      return null;
    }

    lenisInstance = lenis;
    window.lenisInstance = lenis;

    lenis.on('scroll', function({ scroll, limit, velocity, progress }) {
      document.documentElement.style.setProperty('--scroll-y',    scroll);
      document.documentElement.style.setProperty('--scroll-prog', progress.toFixed(4));
      document.documentElement.style.setProperty('--scroll-vel',  Math.abs(velocity).toFixed(3));
    });

    return lenis;
  }

  function tryInitLenis() {
    var html = document.documentElement;
    var shouldEnable = (
      html.classList.contains('tier-2') &&
      window.innerWidth >= 1024 &&
      window.matchMedia('(hover: hover)').matches &&
      window.matchMedia('(prefers-reduced-motion: no-preference)').matches
    );

    if (!shouldEnable) return Promise.resolve(null);

    return new Promise(function(resolve) {
      if (window.Lenis) return resolve(initLenis());

      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js';
      script.crossOrigin = 'anonymous';
      script.async = true;
      script.onload = function() {
        if (window.Lenis) {
          resolve(initLenis());
        } else {
          console.error('Lenis script loaded but window.Lenis is still undefined');
          resolve(null);
        }
      };
      script.onerror = function() {
        console.error('Failed to load Lenis from CDN');
        resolve(null);
      };
      document.head.appendChild(script);
    });
  }

  // Expose globally
  window.getLenis = getLenis;
  window.tryInitLenis = tryInitLenis;
})();
