// services.js
// Scroll-driven service panels — tied to Lenis smooth scroll (desktop)
// Falls back to native scroll on mobile — same logic, no Lenis dependency.
// Requires: scroll.js (window.getLenis)

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

    console.log('[services] init', {
      track: !!track, panels: panels.length, images: images.length,
      fill: !!fill, dotsWrap: !!dotsWrap, lenis: !!lenis,
       viewportW: window.innerWidth, viewportH: window.visualViewport ? window.visualViewport.height : window.innerHeight,
     });
     if (!track) { console.error('[services] ABORT: #services track element not found'); return; }
     if (!panels.length) { console.error('[services] ABORT: no .services-panel elements found'); return; }

    /* ── Visibility helper ────────────────────────────────────────────
     * setStickyVisible() is the single source of truth for show/hide.
     * - is-visible drives CSS opacity/transform (paired with
     *   pointer-events via the CSS rules described in the file header).
     * - inert removes the panel from tab order and the a11y tree when
     *   hidden so keyboard/screen-reader users can't land inside it.
     * ─────────────────────────────────────────────────────────────── */
    var _stickyVisible = false;
    function setStickyVisible(visible) {
      if (!sticky) return;
      if (_stickyVisible === visible) return; // no-op guard — prevents spam
      _stickyVisible = visible;

      sticky.classList.toggle('is-visible', visible);
      if (visible) {
        sticky.removeAttribute('inert');
      } else {
        sticky.setAttribute('inert', '');
      }

      /* ── Clear stale inline styles set by a previous visible=true call.
          Without this, opacity:1 !important left over from the prior call
          beats the CSS transition (opacity 1 → 0), so opacity stays at 1
          forever and scroll events keep firing the "STILL" warning. */
      sticky.style.removeProperty('opacity');
      sticky.style.removeProperty('pointer-events');

      /* CRITICAL FIX: Reflow before reading computed style.
         Without this, getComputedStyle() can return a stale value cached
         before the class toggle was painted. */
      void sticky.offsetWidth;

      var afterOpacity = getComputedStyle(sticky).opacity;
      console.log('[services] setStickyVisible', {
        visible: visible,
        now_is_visible: sticky.classList.contains('is-visible'),
        now_inert: sticky.hasAttribute('inert'),
        now_opacity: afterOpacity,
      });

      /* FIX: If opacity is still 0 after toggle+reflow, force inline override.
         This covers the narrow window where a CSS transition is mid-flight
         or a layout rebuild had reset opacity between toggle and read.
         The guard below only fires on the →true path (the →false path
         intentionally lets the CSS transition 1 → 0 play out normally). */
      if (visible && parseFloat(afterOpacity) < 0.99) {
        console.warn('[services] setStickyVisible: opacity STILL', afterOpacity,
          '— forcing inline opacity:1 + pointer-events:auto');
        sticky.style.cssText = 'opacity:1 !important; pointer-events:auto !important;';
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
        var vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        var trackTop    = track.offsetTop;
        var trackHeight = track.offsetHeight - vh;
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

    /* panel 0 and image 0: set is-active explicitly at init.
       activateService skips index === currentIndex, so without this
       the first panel would never get the class on init */
    if (panels[0]) panels[0].classList.add('is-active');
    if (images[0]) images[0].classList.add('is-active');

    function activateService(index) {
      console.log('[services] activateService', { prev: currentIndex, next: index, changed: index !== currentIndex });
      if (index === currentIndex) return;
      var prev = currentIndex;
      currentIndex = index;

      /* CRITICAL: re-query DOM every call — buildAll/nav:injected can
         rebuild the section (innerHTML rewrite) between scroll events,
         leaving the initial NodeList stale. */
      var livePanels = document.querySelectorAll('.services-panel');
      var liveImages = document.querySelectorAll('.services-image');
      if (livePanels.length === 0) {
        console.warn('[services] activateService: no .services-panel found — skipping');
        return;
      }
      var prevP = livePanels[prev];
      var nextP = livePanels[index];
      if (prevP) { prevP.classList.remove('is-active'); prevP.classList.add('is-exiting'); }
      if (nextP) { nextP.classList.add('is-active'); }
      if (prevP) {
        setTimeout(function() {
          prevP.classList.remove('is-exiting');
        }, 550);
      }

      if (liveImages[prev]) liveImages[prev].classList.remove('is-active');
      if (liveImages[index]) liveImages[index].classList.add('is-active');

      var dots = dotsWrap ? dotsWrap.querySelectorAll('.services-progress__dot') : [];
      dots.forEach(function(dot, i) {
        dot.classList.toggle('is-active', i === index);
        dot.classList.toggle('is-past',   i < index);
      });
    }

    function onScroll() {
      /* FIX: Force reflow before measuring, so layout re-computes in
         case the DOM was rebuilt by buildAll/nav:injected after init. */
      void sticky.offsetWidth;
      void track.offsetHeight;

      var vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      var rect      = track.getBoundingClientRect();
      var trackSpan = rect.height - vh;

      console.log('[services onScroll]', {
        rectTop:      rect.top.toFixed(1),
        rectHeight:   rect.height.toFixed(1),
        innerHeight:   vh,
        trackSpan:    trackSpan.toFixed(1),
        notEnoughScrollSpace: trackSpan <= 0,
      });

      if (trackSpan <= 0) {
        /* FIX: Section may have been rebuilt after init — try again
           after a short debounce, so we don't permanently miss the
           section on a rebuilding page. */
        setTimeout(function() {
          var freshRect = track.getBoundingClientRect();
          var freshSpan = freshRect.height - vh;
          if (freshSpan > 0) {
            console.warn('[services] recalibrated: trackSpan was 0, now', freshSpan.toFixed(1));
            onScroll();
          }
        }, 100);
        return;
      }

      var progress = -rect.top / trackSpan;
      console.log('[services onScroll] progress', progress.toFixed(4), {
        outOfRange:  progress < 0 || progress > 1,
      });

      if (progress < 0 || progress > 1) {
        /* §Guard: skip repeated out-of-range calls that don't change anything.
           Without this, laminar scroll (e.g. Lenis or a fast-touch trackpad)
           can fire onScroll hundreds of times per frame while the section is
           far off-screen, spamming setStickyVisible(false) and clogging the
           console with useless "progress 3.41 → outOfRange: true" lines. */
        if (!_stickyVisible) return;
        setStickyVisible(false);
        return;
      }

      if (_stickyVisible) return; // already in-view — only activate once
      setStickyVisible(true);

      var seg = 1 / SERVICE_COUNT;
      var idx = Math.min(Math.floor(progress / seg), SERVICE_COUNT - 1);
      console.log('[services onScroll] seg', seg.toFixed(4), '→ idx', idx);

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

  /* ── Debug overlay: ?debug=1 URL param ─────────────────────────────────
   * Forces .services-sticky visible, outlines all key elements, and dumps
   * computed style for every panel. */
  if (('' + window.location.search).indexOf('debug=1') !== -1) {
    setTimeout(function() {
      var sticky = document.querySelector('.services-sticky');
      if (!sticky) { console.error('[services] DEBUG: .services-sticky not in DOM'); return; }

      /* Kill all transitions and force opacity */
      var allSvc = document.querySelectorAll('.services-sticky, .services-sticky *');
      allSvc.forEach(function(el) {
        el.style.opacity = '1';
        el.style.display = '';
        el.style.visibility = 'visible';
        el.style.pointerEvents = '';
        el.style.transition = 'none';
      });
      sticky.classList.add('is-visible');
      sticky.style.cssText = 'opacity:1 !important; display:flex !important; pointer-events:auto !important; z-index:999999 !important;';

      console.group('[services] DEBUG FORCE');
      setTimeout(function() {
        var ss = getComputedStyle(sticky);
        console.groupCollapsed('  STICKY (t=300ms)');
        'display,position,top,left,width,height,opacity,zIndex,isolation,overflow'.split(',').forEach(function(k) {
          console.log('  ' + k + ':', ss[k]);
        });
        console.log('  .is-visible:', sticky.classList.contains('is-visible'));
        console.groupEnd();

        console.groupCollapsed('  PANELS (t=300ms)');
        document.querySelectorAll('.services-panel').forEach(function(el, i) {
          var s = getComputedStyle(el);
          console.log('  [' + i + '] active=' + el.classList.contains('is-active') +
            ' op=' + s.opacity + ' disp=' + s.display + ' vis=' + s.visibility +
            ' h=' + s.height + ' kids=' + el.children.length +
            ' text="' + el.textContent.trim().substring(0, 40) + '"');
        });
        console.groupEnd();
      }, 200);

      console.groupEnd();
    }, 1500);
  }
})();
