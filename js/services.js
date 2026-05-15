// services.js
// Scroll-driven service panels — tied to Lenis smooth scroll
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

    // ── Reset dots container before building ──────────────────
    if (dotsWrap) dotsWrap.innerHTML = '';

    // ── Build progress dots ───────────────────────────────
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

      dotsWrap.appendChild(dot);
    });

    // ── Inject mobile images into each panel ─────────────
    var isMobile = window.matchMedia('(max-width: 1024px)').matches;

    if (isMobile) {
      panels.forEach(function(panel) {
        var serviceIndex = parseInt(panel.dataset.service, 10);
        var img = images[serviceIndex] && images[serviceIndex].querySelector('img');
        if (!img) return;

        var mobileImg = document.createElement('img');
        mobileImg.className = 'services-panel__mobile-img';
        mobileImg.src    = img.src;
        mobileImg.alt    = img.alt;
        mobileImg.width  = img.width;
        mobileImg.height = img.height;
        mobileImg.loading = 'lazy';

        panel.insertBefore(mobileImg, panel.firstChild);
      });
    }

    // ── Scroll-driven state (desktop only) ───────────────
    var currentIndex = 0;

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

      images[prev].classList.remove('is-active');
      images[index].classList.add('is-active');

      var dots = dotsWrap.querySelectorAll('.services-progress__dot');
      dots.forEach(function(dot, i) {
        dot.classList.toggle('is-active', i === index);
        dot.classList.toggle('is-past',   i < index);
      });
    }

    function onScroll() {
      scrollToIndexFromScroll();
    }

    function scrollToIndexFromScroll() {
      var rect      = track.getBoundingClientRect();
      var trackSpan = rect.height - window.innerHeight;

      if (window.__ApexDebug && rect.height > 0) {
        var progressDraft = -rect.top / trackSpan;
        console.log('[services scroll]', {
          rectTop: rect.top.toFixed(1),
          rectHeight: rect.height.toFixed(1),
          innerHeight: window.innerHeight,
          trackSpan: trackSpan.toFixed(1),
          progress: progressDraft.toFixed(4),
          wouldReturn: trackSpan <= 0 || progressDraft < 0 || progressDraft > 1
        });
      }

      if (trackSpan <= 0) return;

      var progress = -rect.top / trackSpan;
      if (progress < 0 || progress > 1) {
        sticky.classList.remove('is-visible');
        return;
      }

      // Show the fixed overlay while the track is inside the viewport
      sticky.classList.add('is-visible');

      var seg  = 1 / SERVICE_COUNT;
      var idx  = Math.min(Math.floor(progress / seg), SERVICE_COUNT - 1);
      fill.style.height = ((idx / (SERVICE_COUNT - 1)) * 100) + '%';
      activateService(idx);
    }

    var lenis = window.getLenis ? window.getLenis() : null;

    // Run once on init, then subscribe to scroll events
    onScroll(); // set initial active panel + fill

    if (lenis) {
      lenis.on('scroll', onScroll);
    } else {
      // Fallback: native scroll event if Lenis isn't available
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // ── Keyboard: arrow keys ──────────────────────────────
    track.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowDown' && currentIndex < SERVICE_COUNT - 1) {
        e.preventDefault();
        var dots = dotsWrap.querySelectorAll('.services-progress__dot');
        if (dots[currentIndex + 1]) dots[currentIndex + 1].click();
      }
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        var dots = dotsWrap.querySelectorAll('.services-progress__dot');
        if (dots[currentIndex - 1]) dots[currentIndex - 1].click();
      }
    });
  }

  window.initServices = initServices;
})();
