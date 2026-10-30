/* CodeDNA — landing v2 motion engine
   transform/opacity only · IntersectionObserver driven · reduced-motion aware */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ── off-white fallback when JS never runs is handled in CSS (.fx-live gate) ── */

  /* ── 1. Scroll reveals ──────────────────────────────────────── */
  var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-fx]'));

  if (reduceMotion || !('IntersectionObserver' in window)) {
    nodes.forEach(function (n) { n.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ── 2. Stagger the bars inside each card ───────────────────── */
  document.querySelectorAll('.l2-livecard, .l2-card--big, .l2-signalbars, .l2-mini').forEach(function (group) {
    Array.prototype.forEach.call(group.querySelectorAll('[data-bar]'), function (bar, i) {
      bar.style.setProperty('--j', String(i));
    });
  });

  /* ── 3. Score rings: radius → dash offset ───────────────────── */
  var CIRC = 2 * Math.PI * 52; // r=52 viewBox 120
  document.querySelectorAll('[data-count-ring]').forEach(function (ring) {
    var scope = ring.closest('[data-count-ring]') === ring
      ? ring
      : ring.closest('.l2-ring');
    // read the paired count value from the sibling value element
    var valueEl = scope ? scope.querySelector('[data-count-to]') : null;
    var v = valueEl ? parseFloat(valueEl.getAttribute('data-count-to')) : 87;
    var offset = (CIRC * (1 - (v / 100))).toFixed(1);
    ring.style.setProperty('--ring-offset', offset);
  });

  /* ── 4. Count-up numbers ────────────────────────────────────── */
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function animateValue(el, target, duration, decimals, suffix) {
    if (reduceMotion) {
      el.textContent = target.toFixed(decimals) + (suffix || '');
      return;
    }
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      el.textContent = (easeOutCubic(p) * target).toFixed(decimals) + (suffix || '');
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ring values (starts after ring stroke begins drawing)
  document.querySelectorAll('[data-count-to]').forEach(function (el, i) {
    var target = parseFloat(el.getAttribute('data-count-to'));
    if (!isNaN(target) && target > 0) {
      animateValue(el, target, 1800 + i * 100, 0, '');
    }
  });

  // stats counters (data-target / data-decimals / data-suffix)
  var stats = Array.prototype.slice.call(document.querySelectorAll('.stat[data-target]'));
  function runStat(el, index) {
    var target = parseFloat(el.getAttribute('data-target'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var suffix = el.getAttribute('data-suffix') || '';
    animateValue(el.querySelector('.stat-value'), target, 1600 + index * 120, decimals, '');
    var suffixEl = el.querySelector('.stat-suffix');
    if (suffixEl) {
      window.setTimeout(function () { suffixEl.textContent = suffix; }, 2000 + index * 120);
    }
  }
  if (stats.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      stats.forEach(runStat);
    } else {
      var statIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !entry.target.dataset.animated) {
            entry.target.dataset.animated = 'true';
            runStat(entry.target, Array.prototype.indexOf.call(stats, entry.target));
            statIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });
      stats.forEach(function (s) { statIO.observe(s); });
    }
  }

  /* ── 5. Cursor-tracked card glow ────────────────────────────── */
  if (finePointer && !reduceMotion) {
    document.addEventListener('pointermove', function (e) {
      var card = e.target && e.target.closest && e.target.closest('.l2-glow');
      if (card) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(2) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(2) + '%');
      }
    }, { passive: true });
  }

  /* ── 6. Gentle 3D tilt on the hero visual ───────────────────── */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      var raf = null;
      card.addEventListener('pointermove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          var r = card.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5;
          var y = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = 'perspective(900px) rotateX(' + (-y * 7).toFixed(2) + 'deg) rotateY(' + (x * 8).toFixed(2) + 'deg) translateY(-2px)';
          card.style.transition = 'transform 80ms linear';
        });
      });
      card.addEventListener('pointerleave', function () {
        card.style.transition = 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)';
        card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
      });
    });
  }

  /* ── 7. Magnetic connect buttons ────────────────────────────── */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.l2-magnet').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        btn.style.transform = 'translate(' + (x * 7).toFixed(1) + 'px, ' + (y * 5).toFixed(1) + 'px)';
      });
      btn.addEventListener('pointerleave', function () {
        btn.style.transform = '';
      });
    });
  }
  /* ── 0. Active nav-link highlighting on scroll ──────────────── */
  (function () {
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-pill .nav-link'));
    var sections = navLinks.map(function (a) {
      var id = (a.getAttribute('href') || '').replace('#', '');
      return { link: a, el: document.getElementById(id) };
    }).filter(function (x) { return x.el; });

    function updateActive() {
      var y = window.scrollY + 120;
      var current = sections[0];
      sections.forEach(function (s) {
        if (s.el.offsetTop <= y) current = s;
      });
      navLinks.forEach(function (l) { l.classList.remove('active'); });
      if (current) current.link.classList.add('active');
    }
    window.addEventListener('scroll', function () { window.requestAnimationFrame(updateActive); }, { passive: true });
    updateActive();
  })();

})();
