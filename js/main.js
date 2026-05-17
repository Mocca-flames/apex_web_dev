/**
 * Main entry point
 * - Wait for DOM ready
 * - Initialize Lenis smooth scroll if conditions met
 * - Connect modules: nav, reveal, form, tracking, services, coverage
 */
(function() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

   function init() {
      if (window.__ApexDebug) {
        console.log('[main] init', {
          apexContentReady: !!window.apexContentReady,
          initServices: typeof window.initServices,
          initCoverage: typeof window.initCoverage
        });
      }

      var contentPromise = window.apexContentReady || Promise.resolve();

     window.tryInitLenis().then(function(lenis) {
       initNav();
       initReveal();
       initForm();
       initTracking();
     });

     contentPromise.then(function() {
      if (window.__ApexDebug) console.log('[main] contentPromise resolved, window.apexContentReady is:', window.apexContentReady ? 'resolved' : 'missing');
      initServices();
      initCoverage();
    }).catch(function(err) {
      console.warn('[Main] Content load failed, services may be limited', err);
      initServices();
    });
  }

  // Module stubs — real implementations in separate files loaded via <script defer>
  function initNav()      {}
  function initReveal()   {}
  function initForm()     {}
  function initTracking() {}
})();
