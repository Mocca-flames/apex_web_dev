/**
 * Tracking lookup
 *  - Input validation (format: APX-YYYY-NNNNN)
 *  - Mock endpoint returns one of four states
 *  - Renders appropriate card with data
 */
(function() {
  var input = document.getElementById('trackingRef');
  var btn = document.getElementById('trackBtn');
  var resultEl = document.getElementById('trackingResult');

  if (!input || !btn || !resultEl) return;

  // Mock data store (for demo)
  var mockDB = {
    'APX-2026-004821': 'transit',
    'APX-2026-004800': 'border',
    'APX-2026-004799': 'delivered',
    'APX-2026-999999': 'notfound'
  };

  function validateRef(ref) {
    // Basic format: APX-YYYY-NNNNN (6 digits)
    return /^APX-\d{4}-\d{6}$/i.test(ref);
  }

  function showState(state) {
    // Hide all
    ['transit','border','delivered','notfound','error'].forEach(function(s) {
      var el = document.getElementById('state-' + s);
      if (el) el.style.display = 'none';
    });
    // Show requested
    var target = document.getElementById('state-' + state);
    if (target) {
      target.style.display = 'block';
      target.classList.add('reveal-is-visible');
    } else {
      document.getElementById('state-error').style.display = 'block';
    }
  }

  function performLookup(ref) {
    if (!validateRef(ref)) {
      showState('notfound');
      return;
    }

    // Show loading
    btn.disabled = true;
    btn.textContent = 'Checking...';

    // Simulate network latency
    setTimeout(function() {
      var status = mockDB[ref.toUpperCase()] || 'notfound';
      showState(status);
      btn.disabled = false;
      btn.textContent = 'Track →';
    }, 800);
  }

  btn.addEventListener('click', function() {
    var ref = input.value.trim();
    performLookup(ref);
  });

  input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performLookup(input.value.trim());
    }
  });

  // Clear previous result on input
  input.addEventListener('input', function() {
    resultEl.style.display = 'none';
  });
})();
