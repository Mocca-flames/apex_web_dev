/**
 * Content Loader — Dynamic text injection from JSON
 * Loads desktop (content.json) or mobile (content_mobile.json) based on viewport width
 * Provides global `window.apexContent` object with all content data
 */
(function() {
  'use strict';

  const CONTENT_DESKTOP = '/data/content.json';
  const CONTENT_MOBILE = '/data/content_mobile.json';
  const MOBILE_BREAKPOINT = 768; // px — matches CSS breakpoint

  let apexContent = null;
  var contentPromise;

  /**
   * Detect if mobile layout is active
   */
  function isMobile() {
    return window.matchMedia('(max-width: ' + MOBILE_BREAKPOINT + 'px)').matches;
  }

  /**
   * Fetch appropriate content file based on viewport
   */
  function fetchContent() {
    const url = isMobile() ? CONTENT_MOBILE : CONTENT_DESKTOP;

    return fetch(url, { credentials: 'same-origin' })
      .then(function(response) {
        if (!response.ok) {
          throw new Error('Content fetch failed: ' + response.status);
        }
        return response.json();
      })
      .then(function(data) {
        apexContent = data;
        return data;
      })
      .catch(function(err) {
        console.error('[Apex Content]', err);
        // If we attempted mobile and failed, try desktop fallback
        if (isMobile()) {
          return fetch(CONTENT_DESKTOP, { credentials: 'same-origin' })
            .then(function(resp) {
              if (!resp.ok) throw new Error('Desktop fallback failed');
              return resp.json();
            })
            .then(function(data) {
              apexContent = data;
              return data;
            })
            .catch(function(e) {
              console.error('[Apex Content] Fallback also failed', e);
              return null;
            });
        }
        // Already desktop and failed
        return null;
      });
  }

  /**
   * Get nested value using dot notation
   * Supports array indexes using bracket notation, e.g. "home.hero.stats[0].value"
   */
  function get(path) {
    if (!apexContent) return null;
    var parts = path.split('.');
    var current = apexContent;
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i];
      // Handle bracket notation: "arrayName[0]"
      var bracketMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (bracketMatch) {
        var arrName = bracketMatch[1];
        var idx = parseInt(bracketMatch[2], 10);
        if (current[arrName] && Array.isArray(current[arrName]) && idx < current[arrName].length) {
          current = current[arrName][idx];
        } else {
          return null;
        }
      } else {
        if (current[part] === undefined) return null;
        current = current[part];
      }
    }
    return current;
  }

  /**
   * Inject content into elements marked with data-content attribute
   */
  function inject(el, path, options) {
    var value = get(path);
    if (!value) return;
    options = options || {};

    if (options.attr) {
      el.setAttribute(options.attr, value);
    } else if (options.html) {
      el.innerHTML = value;
    } else if (options.raw) {
      el.textContent = value;
    } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      if (options.value) el.value = value;
      else el.placeholder = value;
    } else {
      el.textContent = value;
    }
  }

  /**
   * Batch inject multiple elements
   */
  function batch(items) {
    items.forEach(function(item) {
      inject(item.el, item.path, item.options);
    });
  }

  // ── Build Functions ─────────────────────────────────────────────

  function buildNav() {
    var container = document.querySelector('[data-nav-links]');
    if (!container) return;
    var links = get('global.nav.links');
    if (!links || !links.length) return;

    container.innerHTML = links.map(function(link) {
      return '<a href="' + link.href + '" class="nav__link">' + link.label + '</a>';
    }).join('');
  }

  function buildTicker() {
    var track = document.querySelector('[data-ticker-track]');
    if (!track) return;
    var items = get('global.ticker');
    if (!items || !items.length) return;

    var html = '';
    // Double for seamless loop
    for (var loop = 0; loop < 2; loop++) {
      items.forEach(function(item) {
        html += '<span class="ticker__item">' + item + '</span>';
      });
    }
    track.innerHTML = html;
  }

  function buildServicesPanels() {
    var panelsContainer = document.getElementById('js-service-panels');
    var dotsContainer = document.getElementById('js-progress-dots');
    if (!panelsContainer) return;

    var services = get('home.servicesSection.services');
    if (!services || !Object.keys(services).length) return;

    var panelsHtml = '';
    var dotsHtml = '';

    Object.keys(services).forEach(function(key, index) {
      var service = services[key];
      var num = String(index + 1).padStart(2, '0');
      var titleHtml = (service.title || '').replace(/\n/g, '<br>');
      panelsHtml +=
        '<div class="services-panel" data-service="' + index + '">' +
          '<span class="services-panel__num">' + num + '</span>' +
          '<h2 class="services-panel__title">' + titleHtml + '</h2>' +
          '<p class="services-panel__body">' + (service.description || '') + '</p>' +
          '<a href="/services.html#' + service.id + '" class="btn btn-navy">' +
            '<svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
            'Learn more' +
          '</a>' +
        '</div>';

      dotsHtml += '<div class="services-progress__dot" data-index="' + index + '"></div>';
    });

    panelsContainer.innerHTML = panelsHtml;
    if (dotsContainer) dotsContainer.innerHTML = dotsHtml;
  }

  function buildServicesImages() {
    var container = document.querySelector('.services-images');
    if (!container) return;

    // Image mapping aligned to service order
    var images = [
      { src: '/webp/services/border_documentation.webp', alt: 'Border Documentation — Coordinator handling customs paperwork with stamps and permits, truck waiting at border post' },
      { src: '/webp/services/route_planning.webp', alt: 'Route Planning — Large African route map with analytics, optimized path highlighted across Southern and Central Africa' },
      { src: '/webp/services/transporter_network.webp', alt: 'Transporter Network — Fleet yard with multiple trucks, dispatcher assigning loads to verified transporters' },
      { src: '/webp/services/realtime.webp', alt: 'Real-Time Monitoring — GPS tracking screen showing truck actively moving, live monitoring centre with dispatch team' },
      { src: '/webp/services/direct_communication.webp', alt: 'Direct Communication — Coordinator on WhatsApp/headset talking to driver at border post, real-time support' },
      { src: '/webp/services/successful_delivery.webp', alt: 'Successful Delivery — Truck arriving at destination, unloading cargo, client handshake confirming completed shipment' }
    ];

    var html = images.map(function(img, index) {
      return '' +
        '<div class="services-image" data-service="' + index + '">' +
          '<img src="' + img.src + '" alt="' + img.alt + '" width="620" height="1200" loading="lazy">' +
        '</div>';
    }).join('');

    container.innerHTML = html;
  }

  function buildProcessTimeline() {
    var container = document.getElementById('process-timeline');
    if (!container) return;
    var steps = get('home.process.steps');
    if (!steps || !steps.length) return;

    var html = '';
    steps.forEach(function(step, index) {
      // Parse "1. You Have Cargo — description"
      var numMatch = step.match(/^(\d+)\.\s*/);
      var number = numMatch ? numMatch[1] : (index + 1);
      var rest = step.replace(/^\d+\.\s*/, ''); // remove leading number and dot

      var parts = rest.split(' — ');
      var label = parts[0];
      var body = parts.slice(1).join(' — ');

      html +=
        '<div class="timeline__step">' +
          '<div class="timeline__node" aria-hidden="true">' + number + '</div>' +
          '<span class="timeline__label">' + label + '</span>' +
          '<span class="timeline__sub">' + body + '</span>' +
        '</div>';
    });

    container.innerHTML = html;
  }

  function buildCoverageSlides() {
    var slidesContainer = document.querySelector('.coverage-journey__slides');
    var labelsContainer = document.querySelector('.coverage-progress__labels');
    if (!slidesContainer) return;

    var countries = get('home.coverage.countries');
    if (!countries || !countries.length) return;

    var slidesHtml = '';
    var labelsHtml = '';

    countries.forEach(function(country, index) {
      // Build description based on country
      var descMap = {
        'South Africa': '(Hub) — Johannesburg dispatch HQ, 24/7 monitoring, border agents at Beit Bridge & Tlokweng',
        'Zimbabwe': '(Active) — Beit Bridge crossing, ZIMRA clearance handled, 4–10h average',
        'Zambia': '(Active) — Chirundu, Kazungula & Kasumbalesa crossings, ZRA + COMESA, 2–12h',
        'DRC': '(Specialist) — Kasumbalesa border, OGEFREM clearance, French-speaking agents, 6–24h',
        'Botswana': '(Active) — Tlokweng & Kazungula, BURS clearance, 2–4h fastest corridor',
        'Malawi': '(Active) — Mchinji border, MRA clearance with COMESA pre-approval, 4–8h',
        'Tanzania': '(Active) — Dar es Salaam corridor, long-haul JHB–port route, 3–7 days',
        'Mozambique': '(Active) — Maputo corridor via Lebombo, 4–8h clearance'
      };

      var codeMap = {
        'South Africa': 'sa', 'Zimbabwe': 'zm', 'Zambia': 'zb', 'DRC': 'dc',
        'Botswana': 'bt', 'Malawi': 'ml', 'Tanzania': 'tz', 'Mozambique': 'mz'
      };

      slidesHtml +=
        '<div class="coverage-slide" data-index="' + index + '">' +
          '<div class="coverage-slide__content">' +
            '<h3 class="coverage-slide__title">' + country.name + '</h3>' +
            '<p class="coverage-slide__text"><strong>(' + country.status + ')</strong> — ' + descMap[country.name] + '</p>' +
          '</div>' +
          '<div class="coverage-slide__frame">' +
            '<img class="coverage-slide__map" src="/experiment/' + codeMap[country.name] + '.webp" alt="' + country.name + ' — ' + country.status + '" loading="lazy" decoding="async">' +
          '</div>' +
        '</div>';

      labelsHtml += '<li class="coverage-progress__label" data-index="' + index + '">' + country.name + '</li>';
    });

    slidesContainer.innerHTML = slidesHtml;
    if (labelsContainer) labelsContainer.innerHTML = labelsHtml;
  }

  function buildPrinciples() {
    var container = document.getElementById('principles-container');
    if (!container) return;
    var principles = get('home.values.principles');
    if (!principles || !principles.length) return;

    var icons = [
      '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>',
      '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>',
      '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>',
      '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>'
    ];

    var html = '';
    principles.forEach(function(principle, i) {
      // Split by " — " with emoji before dash
      var parts = principle.split(' — ');
      var title = parts[0]; // includes emoji
      var body = parts.slice(1).join(' — ');

      html +=
        '<article class="glass-card reveal" style="--stagger-index:' + i + '">' +
          '<svg class="glass-card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
            '<' + icons[i] + '>' +
          '</svg>' +
          '<h3 class="glass-card__title">' + title + '</h3>' +
          '<p class="glass-card__body">' + body + '</p>' +
        '</article>';
    });

    container.innerHTML = html;
  }

  function buildTechBannerPills() {
    var container = document.querySelector('[data-content-pills]');
    if (!container) return;
    var pills = get('home.techBanner.pills');
    if (!pills || !pills.length) return;

    container.innerHTML = pills.map(function(pill) {
      return '<li><span class="btn btn-secondary" style="border-color:var(--apex-orange); color:var(--apex-orange);">' + pill + '</span></li>';
    }).join('');
  }

  function buildFooter() {
    // Services column links
    var servicesContainer = document.querySelector('[data-footer-services]');
    if (servicesContainer) {
      var serviceLinks = [
        { label: 'Border Documentation', href: '/border-clearance.html#documentation' },
        { label: 'Customs Clearance', href: '/border-clearance.html' },
        { label: 'Route Planning', href: '/services.html#route-planning' },
        { label: 'Transporter Network', href: '/fleet.html' },
        { label: 'Real-Time Monitoring', href: '/tracking.html' }
      ];
      servicesContainer.innerHTML = serviceLinks.map(function(link) {
        return '<a href="' + link.href + '" class="footer__link">' + link.label + '</a>';
      }).join('');
    }

    // Contact column
    var contactContainer = document.querySelector('[data-footer-contact]');
    if (contactContainer) {
      var phone = get('global.contact.whatsapp') || '072 937 7143';
      var email = get('global.contact.email') || 'dispatch@apextransport.co.za';
      contactContainer.innerHTML =
        '<a href="https://wa.me/27729377143" class="footer__link">WhatsApp: ' + phone + '</a>' +
        '<a href="tel:0729377143" class="footer__link">Call: ' + phone + '</a>' +
        '<span class="footer__link">Based in ' + get('global.contact.based') + '</span>';
    }
  }

  function injectSimpleContent() {
    var elements = document.querySelectorAll('[data-content]');
    elements.forEach(function(el) {
      var path = el.getAttribute('data-content');
      var attr = el.getAttribute('data-content-attr');
      var html = el.hasAttribute('data-content-html');
      var value = get(path);
      if (!value) return;

      if (attr) {
        el.setAttribute(attr, value);
      } else if (html) {
        el.innerHTML = value;
      } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = value;
      } else {
        el.textContent = value;
      }
    });
  }

  function buildAll() {
    buildNav();
    buildTicker();
    buildServicesPanels();
    buildServicesImages();
    buildProcessTimeline();
    buildCoverageSlides();
    buildPrinciples();
    buildTechBannerPills();
    buildFooter();
    injectSimpleContent();

    if (window.__ApexDebug) {
      console.log('[content] buildAll complete', {
        panels: document.querySelectorAll('.services-panel').length,
        images: document.querySelectorAll('.services-image').length,
        slides: document.querySelectorAll('.coverage-slide').length
      });
    }

    // Dispatch event for any modules waiting
    var event = new CustomEvent('apexContentReady');
    window.dispatchEvent(event);
  }

  // Expose API
  window.apexContent = {
    get: get,
    inject: inject,
    batch: batch,
    refresh: buildAll
  };

  // Start loading content immediately
  var contentPromise = fetchContent().then(function(data) {
    if (data) {
      buildAll();
    } else {
      console.warn('[Apex Content] No content data loaded; dynamic content will be missing');
    }
  });
  window.apexContentReady = contentPromise;

})();
