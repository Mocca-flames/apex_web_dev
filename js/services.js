// services.js
// Scroll-driven service panels — tied to Lenis smooth scroll (desktop)
// Falls back to native scroll on mobile — same logic, no Lenis dependency.
// Requires: scroll.js (window.getLenis)
//
// Fix — pointer-events / inert:
//   setStickyVisible() is the single source of truth for show/hide.
//   CSS must pair: .services-sticky { pointer-events: none }
//                  .services-sticky.is-visible { pointer-events: auto }
//
// Fix — panel 0 never activated:
//   activateService() early-returns when index === currentIndex (both 0).
//   Panel 0 and image 0 now get is-active set explicitly at init.

(function() {
  var SERVICE_COUNT = 6;

  function initServices() {
    var track    = document.getElementById('services');
    var sticky   = document.querySelector('.services-sticky');
    var panels   = document.querySelectorAll('.services-panel');
    var images   = document.querySelectorAll('.services-image');
    var fill     = document.getElementById('js-progress-fill');
    var dotsWrap = document.getElementById('js-progress-dots');
    var lenis    = window.getLenis ? window.getLenis() : null;

    if (!track || !panels.length) return;

    if (window.__ApexDebug) {
      console.log('[services] init', {
        track: !!track, panels: panels.length, images: images.length,
        fill: !!fill, dotsWrap: !!dotsWrap, lenis: !!lenis,
        trackRect: track.getBoundingClientRect(),
        trackComputedHeight: getComputedStyle(track).height,
        windowInnerHeight: window.innerHeight
      });
    }

    /* ── Visibility helper ────────────────────────────────────────────
     *  Single source of truth for showing/hiding the sticky panel.
     *  - is-visible drives CSS opacity/transform (paired with
     *    pointer-events via the CSS rules described in the file header).
     *  - inert removes the panel from tab order and the a11y tree when
     *    hidden so keyboard/screen-reader users can't land inside it.
     * ─────────────────────────────────────────────────────────────── */
    function setStickyVisible(visible) {
      if (!sticky) return;
      sticky.classList.toggle('is-visible', visible);
      if (visible) {
        sticky.removeAttribute('inert');
      } else {
        sticky.setAttribute('inert', '');
      }
    }

    /* Start hidden immediately */
    setStickyVisible(false);

    // ── Reset dots container before building ──────────────────
    if (dotsWrap) dotsWrap.innerHTML = '';

    // ── Build progress dots ────────────────────────────────────
    panels.forEach(function(_, i) {
      var dot = document.createElement('button');
      dot.className = 'services-progress__dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', 'Jump to service ' + (i + 1));
      dot.dataset.index = i;

      dot.addEventListener('click', function() {
        var trackTop    = track.offsetTop;
        var trackHeight = track.offsetHeight - window.innerHeight;
        var targetY     = trackTop + (i / (SERVICE_COUNT - 1)) * trackHeight;
        if (lenis) {
          lenis.scrollTo(targetY, { duration: 1.2 });
        } else {
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        }
      });

      if (dotsWrap) dotsWrap.appendChild(dot);
    });

    // ── Inject mobile images into each panel ──────────────────
    // Images are inserted as firstChild but CSS order:3 positions
    // them visually between the title and body on mobile.
    var isMobile = window.matchMedia('(max-width: 1024px)').matches;

    if (isMobile) {
      panels.forEach(function(panel) {
        var serviceIndex = parseInt(panel.dataset.service, 10);
        var img = images[serviceIndex] && images[serviceIndex].querySelector('img');
        if (!img) return;

        var mobileImg = document.createElement('img');
        mobileImg.className = 'services-panel__mobile-img';
        mobileImg.src     = img.src;
        mobileImg.alt     = img.alt;
        mobileImg.width   = img.width;
        mobileImg.height  = img.height;
        mobileImg.loading = 'lazy';

        panel.insertBefore(mobileImg, panel.firstChild);
      });
    }

    // ── Scroll-driven state ────────────────────────────────────
    var currentIndex = 0;

    /* activateService skips when index === currentIndex, so panel 0
       would never get is-active at init. Set it explicitly here. */
    if (panels[0]) panels[0].classList.add('is-active');
    if (images[0]) images[0].classList.add('is-active');

    function activateService(index) {
      if (index === currentIndex) return;
      var prev = currentIndex;
      currentIndex = index;

      if (window.__ApexDebug) console.log('[services] activateService', { prev: prev, next: index });

      panels[prev].classList.remove('is-active');
      panels[prev].classList.add('is-exiting');

      setTimeout(function() {
        panels[prev].classList.remove('is-exiting');
      }, 550);

      panels[index].classList.add('is-active');

      /* images array still exists on mobile (display:none), toggling
         classes on hidden elements is harmless and keeps state in sync
         in case of a resize/reinit. */
      if (images[prev]) images[prev].classList.remove('is-active');
      if (images[index]) images[index].classList.add('is-active');

      var dots = dotsWrap ? dotsWrap.querySelectorAll('.services-progress__dot') : [];
      dots.forEach(function(dot, i) {
        dot.classList.toggle('is-active', i === index);
        dot.classList.toggle('is-past',   i < index);
      });
    }

    function onScroll() {
      var rect      = track.getBoundingClientRect();
      var trackSpan = rect.height - window.innerHeight;

      if (window.__ApexDebug && rect.height > 0) {
        var progressDraft = -rect.top / trackSpan;
        console.log('[services scroll]', {
          rectTop:      rect.top.toFixed(1),
          rectHeight:   rect.height.toFixed(1),
          innerHeight:  window.innerHeight,
          trackSpan:    trackSpan.toFixed(1),
          progress:     progressDraft.toFixed(4),
          wouldReturn:  trackSpan <= 0 || progressDraft < 0 || progressDraft > 1
        });
      }

      if (trackSpan <= 0) return;

      var progress = -rect.top / trackSpan;

      if (progress < 0 || progress > 1) {
        setStickyVisible(false);
        return;
      }

      setStickyVisible(true);

      var seg = 1 / SERVICE_COUNT;
      var idx = Math.min(Math.floor(progress / seg), SERVICE_COUNT - 1);

      /* fill is a vertical bar on desktop; hidden on mobile via CSS.
         Setting height is safe to call even when the element is hidden. */
      if (fill) fill.style.height = ((idx / (SERVICE_COUNT - 1)) * 100) + '%';

      activateService(idx);
    }

    // Run once on init, then subscribe
    onScroll();

    if (lenis) {
      lenis.on('scroll', onScroll);
    } else {
      /* Mobile and reduced-motion fallback: native scroll event */
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // ── Keyboard: arrow keys ──────────────────────────────────
    track.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowDown' && currentIndex < SERVICE_COUNT - 1) {
        e.preventDefault();
        var dots = dotsWrap ? dotsWrap.querySelectorAll('.services-progress__dot') : [];
        if (dots[currentIndex + 1]) dots[currentIndex + 1].click();
      }
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        var dots = dotsWrap ? dotsWrap.querySelectorAll('.services-progress__dot') : [];
        if (dots[currentIndex - 1]) dots[currentIndex - 1].click();
      }
    });
  }

  window.initServices = initServices;
})();