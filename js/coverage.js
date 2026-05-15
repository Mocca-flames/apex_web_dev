(function () {
  'use strict';

  var SLIDE_COUNT = 8;

  function initCoverage() {
    var section = document.getElementById('coverage');
    if (!section) return;

    var track     = section.querySelector('.coverage-track');
    var sticky    = section.querySelector('.coverage-sticky');
    var slides    = section.querySelectorAll('.coverage-slide');
    var labels    = section.querySelectorAll('.coverage-progress__label');
    var fillEl    = document.getElementById('js-coverage-fill');
    var dotEl     = document.getElementById('js-coverage-dot');

    if (!track || !slides.length) {
      if (window.__ApexDebug) console.warn('[coverage] init: missing elements', { track: !!track, slides: slides.length });
      return;
    }

    if (window.__ApexDebug) {
      console.log('[coverage] init', {
        trackRect: track.getBoundingClientRect(),
        trackComputedH: getComputedStyle(track).height,
        slides: slides.length,
        fillEl: !!fillEl,
        dotEl: !!dotEl,
        windowInnerHeight: window.innerHeight
      });
    }

    /* ── Metrics & State ──────────────────────────────────── */
    var currentIndex = 0;
    setActive(0, true);   /* initialise without animation */

    function setActive(index, instant) {
      if (index === currentIndex && !instant) return;
      currentIndex = index;

      slides.forEach(function (slide, i) {
        var active = i === index;
        slide.classList.toggle('is-active', active);
      });

      labels.forEach(function (label, i) {
        label.classList.toggle('is-active', i === index);
      });

      /* progress rail: 0 at top of first label, 100 at bottom of last */
      if (fillEl && dotEl) {
        /* centre of each label is at (i + 0.5) / SLIDE_COUNT × 100% of the rail */
        var pct = ((index + 0.5) / SLIDE_COUNT) * 100;
        fillEl.style.height = pct + '%';
        dotEl.style.top = pct + '%';
      }
    }

    /* ── Scroll handler ───────────────────────────────────────── */
    function onScroll() {
      var rect = track.getBoundingClientRect();
      var trackSpan = rect.height - window.innerHeight;

      if (trackSpan <= 0) return;

      var progress = -rect.top / trackSpan;
      if (progress < 0 || progress > 1) {
        if (sticky) sticky.classList.remove('is-visible');
        return;
      }

      // Show the fixed panel while inside the track
      if (sticky) sticky.classList.add('is-visible');

      var segmentSize = 1 / SLIDE_COUNT;
      var targetIndex = Math.min(
        Math.floor(progress / segmentSize),
        SLIDE_COUNT - 1
      );

      setActive(targetIndex, false);
    }

    var lenis = window.getLenis ? window.getLenis() : null;

    if (lenis) {
      lenis.on('scroll', onScroll);
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    onScroll(); /* run once on init in case page loads mid-section */
  }

  window.initCoverage = initCoverage;
})();
