/**
 * Coverage Journey — scroll-hijacked sticky section
 *
 * Guarantees:
 *  - .coverage-sticky is hidden on every init and any time the arena
 *    content is mutated (coverage.js rebuilds its DOM at init; content.js
 *    rebuilds it later — race condition without this guard).
 *  - onScroll always strips is-visible first; only re-adds when progress is
 *    legitimately in the 0-to-1 range (track is inside the viewport).
 *  - Keyboard access only when the user is genuinely inside the track.
 */
(function () {
  'use strict';

  var SLIDE_COUNT = 8;

  function initCoverage() {
    var section = document.getElementById('coverage');
    if (!section) return;

    var track  = section.querySelector('.coverage-track');
    var sticky = section.querySelector('.coverage-sticky');
    var slides = section.querySelectorAll('.coverage-slide');
    var labels = section.querySelectorAll('.coverage-progress__label');
    var fillEl = document.getElementById('js-coverage-fill');
    var dotEl  = document.getElementById('js-coverage-dot');

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

    /* ── Prove sticky starts hidden ───────────────────────────────── */
    if (sticky) sticky.classList.remove('is-visible');

    /* -----------------------------------------------------------------
     * Schedule THREE follow-up runs of out-of-range check to absorb
     * late-asynchronous layout flushes (content.json build, font load,
     * image decode, scroll-by-hash, etc.) that can push the section into
     * or out of the viewport after initCoverage returns.
     * Each delayed run KNOWS the sticky must SHOW or HIDE independently
     * of the first synchronous call. Nothing trusts a cached rect. */
    function flushCheck() { onScroll(); }
    setTimeout(flushCheck, 100);
    setTimeout(flushCheck, 500);
    setTimeout(flushCheck, 2000);

    /* ── Metrics & State ─────────────────────────────────────────── */
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
        var pct = ((index + 0.5) / SLIDE_COUNT) * 100;
        fillEl.style.height = pct + '%';
        dotEl.style.top    = pct + '%';
      }
    }

    /* ── Core scroll handler ──────────────────────────────────────── */
    function onScroll() {
      /* Always strip visible FIRST so a race cannot leave it permanently
         visible if the section is out of range, has zero span, or the DOM
         is mid-rebuild. */
      if (sticky) sticky.classList.remove('is-visible');

      /* If the track has less than one viewport of scroll range, there is
         nothing to pin — bail out leaving the sticky hidden. This covers
         mobile browsers, reduced-motion, and any layout flush. */
      var rect     = track.getBoundingClientRect();
      var trackSpan = rect.height - window.innerHeight;

      if (trackSpan <= 0) return;

      var progress = -rect.top / trackSpan;
      if (progress < 0 || progress > 1) return;   /* section not in viewport */

      /* Track IS in viewport: show the fixed panel. */
      sticky.classList.add('is-visible');

      var segmentSize = 1 / SLIDE_COUNT;
      var targetIndex = Math.min(
        Math.floor(progress / segmentSize),
        SLIDE_COUNT - 1
      );

      setActive(targetIndex, false);
    }

    /* ── Re-hide sticky whenever the coverage DOM is mutated
            (content.js calls buildCoverageSlides() after its JSON fetch resolves,
            which replaces .coverage-journey__slides innerHTML — invalidating
            any liveNodeList coverage.js previously held.)
            Re-bind labels/slides after every mutation so the observer never
            operates on stale detached references. */
    var mo = new MutationObserver(function () {
      var newSlides = section.querySelectorAll('.coverage-slide');
      var newLabels = section.querySelectorAll('.coverage-progress__label');
      if (!newSlides.length) return;

      slides = newSlides;
      labels = newLabels;

      if (sticky) sticky.classList.remove('is-visible');
      setActive(0, true);
    });

    mo.observe(section, {
      childList: true,
      subtree:   true
    });

    /* ── Subscribe to scroll events ──────────────────────────────── */
    var lenis = window.getLenis ? window.getLenis() : null;

    if (lenis) {
      lenis.on('scroll', onScroll);
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* ── Keyboard: arrow keys jump between slides when sticky is shown ── */
    sticky.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' && currentIndex < SLIDE_COUNT - 1) {
        e.preventDefault();
        scrollToSlide(currentIndex + 1);
      }
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        scrollToSlide(currentIndex - 1);
      }
    });

    sticky.setAttribute('tabindex', '0');

    function scrollToSlide(idx) {
      var trackHeight = track.offsetHeight - window.innerHeight;
      if (trackHeight <= 0) return;
      var targetY = track.offsetTop + (idx / (SLIDE_COUNT - 1)) * trackHeight;
      if (lenis) {
        lenis.scrollTo(targetY, { duration: 0.8 });
      } else {
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      }
    }

    onScroll(); /* run once on init in case page loads mid-section */
  }

  window.initCoverage = initCoverage;
})();
