/* =========================================================
   GreenPoint Ag — interactions
   Vanilla JS, no dependencies.
========================================================== */

(function () {
  'use strict';

  /* -------- Letter-stagger labels on .btn --------
     Splits each button's text label into per-character spans plus a
     hidden duplicate row below. The CSS animates both rows up on
     hover/focus with a small per-character delay. Runs once at init. */
  function splitButtonLabels() {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(function (btn) {
      /* Idempotent — skip if we've already split this button. */
      if (btn.querySelector('.btn__label')) return;
      /* Find the first non-empty text node — that's the visible label. */
      let textNode = null;
      for (let i = 0; i < btn.childNodes.length; i++) {
        const node = btn.childNodes[i];
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          textNode = node;
          break;
        }
      }
      if (!textNode) return;

      const label = textNode.textContent.trim();
      const wrapper = document.createElement('span');
      wrapper.className = 'btn__label';

      const original = document.createElement('span');
      original.className = 'btn__chars';
      const clone = document.createElement('span');
      clone.className = 'btn__chars btn__chars--clone';
      clone.setAttribute('aria-hidden', 'true');

      const chars = Array.from(label);
      chars.forEach(function (char, i) {
        const display = char === ' ' ? ' ' : char;
        const a = document.createElement('span');
        a.className = 'btn__char';
        a.style.setProperty('--i', i);
        a.textContent = display;
        original.appendChild(a);

        const b = document.createElement('span');
        b.className = 'btn__char';
        b.style.setProperty('--i', i);
        b.textContent = display;
        clone.appendChild(b);
      });

      wrapper.appendChild(original);
      wrapper.appendChild(clone);
      btn.replaceChild(wrapper, textNode);
    });
  }
  splitButtonLabels();

  /* -------- Mobile nav toggle -------- */
  const navToggle = document.getElementById('nav-toggle');
  const navList   = document.getElementById('primary-nav-list');
  const navWrap   = navList ? navList.parentElement : null;

  if (navToggle && navWrap) {
    navToggle.addEventListener('click', function () {
      const open = navWrap.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });

    /* Close menu when a link is tapped on mobile */
    navList.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && window.matchMedia('(max-width: 63.99em)').matches) {
        navWrap.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });

    /* Reset menu state when crossing the desktop breakpoint */
    const mq = window.matchMedia('(min-width: 64em)');
    mq.addEventListener('change', function () {
      navWrap.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });

    /* Close on Escape — standard overlay/dialog affordance. */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navWrap.classList.contains('is-open')) {
        navWrap.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');
        navToggle.focus();
      }
    });
  }

  /* -------- Announcement carousel -------- */
  const announcements = [
    'This is an announcement section',
    'Find your local agronomist — over 100 locations across the Southeast',
    'GreenPoint Ag Connect: pay bills and view invoices in one place',
    '2025 Southern Agronomy Summit recap is now available'
  ];
  const annoText = document.getElementById('announcement-text');
  const annoBtns = document.querySelectorAll('.announcement__nav');
  let annoIdx = 0;
  let annoTimer = null;

  function setAnnouncement(idx, direction) {
    if (!annoText) return;
    const nextIdx = (idx + announcements.length) % announcements.length;
    if (nextIdx === annoIdx) return;
    const dir = direction || (nextIdx > annoIdx ? 1 : -1);

    /* Slide current out in the direction of motion */
    annoText.classList.remove('is-swap-in');
    annoText.classList.add('is-swap-out');
    /* If we're moving backwards, flip the exit direction */
    annoText.style.transform = dir === -1
      ? 'translateX(12px)'
      : 'translateX(-12px)';

    setTimeout(function () {
      annoIdx = nextIdx;
      annoText.textContent = announcements[annoIdx];
      /* Position the incoming text on the opposite side, then settle */
      annoText.classList.remove('is-swap-out');
      annoText.style.transform = dir === -1
        ? 'translateX(-12px)'
        : 'translateX(12px)';
      annoText.style.opacity = '0';
      /* Next frame: clear classes so it slides into place */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          annoText.style.transform = '';
          annoText.style.opacity = '';
        });
      });
    }, 280);
  }

  function startAnnouncementCycle() {
    if (annoTimer) clearInterval(annoTimer);
    annoTimer = setInterval(function () { setAnnouncement(annoIdx + 1, 1); }, 6000);
  }

  if (annoText) {
    annoBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const dir = btn.getAttribute('data-direction') === 'prev' ? -1 : 1;
        setAnnouncement(annoIdx + dir, dir);
        startAnnouncementCycle();
      });
    });
    startAnnouncementCycle();
  }

  /* -------- Zip code form -------- */
  document.querySelectorAll('.zip-search').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = form.querySelector('.zip-search__input');
      const zip = (input && input.value || '').trim();
      if (!/^\d{5}$/.test(zip)) {
        input.focus();
        input.setAttribute('aria-invalid', 'true');
        return;
      }
      input.removeAttribute('aria-invalid');
      /* In a real app this would route to /locations?zip=... */
      console.log('Zip submitted:', zip);
    });
  });

  /* -------- Reveal-on-scroll -------- */
  /* Progressive enhancement: content is visible by default. We
     add .reveal + .is-pending right before observing, and remove
     .is-pending (adding .is-visible) when the element scrolls in.
     If reduced motion is preferred, we simply don't animate. */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('IntersectionObserver' in window && !reduceMotion) {
    const targets = document.querySelectorAll(
      '.hero__heading, .hero__body, .hero__content .btn, ' +
      '.service-card, .story, .insights__title, ' +
      '.locator__heading, .locator .btn, ' +
      '.connect__heading, .connect__body, .connect .btn'
    );

    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-pending');
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function (el) {
      el.classList.add('reveal', 'is-pending');
      io.observe(el);
    });

    /* Safety net: any element still pending after 1.5s reveals itself.
       Protects against edge cases where IO doesn't fire (e.g. element
       starts already past the threshold offset). */
    setTimeout(function () {
      document.querySelectorAll('.reveal.is-pending').forEach(function (el) {
        el.classList.remove('is-pending');
        el.classList.add('is-visible');
      });
    }, 1500);
  }

  /* -------- Sticky primary nav --------
     The nav sits as a transparent overlay at the top of the hero
     image at rest. As the user scrolls, it slides up with the
     announcement strip; once the announcement has fully scrolled
     past, the nav locks to top:0 and switches to a solid dark
     "scrolled" appearance via .is-stuck. */
  const heroTopbar = document.querySelector('.hero__topbar');
  const announceEl = document.querySelector('.announcement');
  let announceHeight = announceEl ? announceEl.offsetHeight : 0;

  function publishAnnounceHeight() {
    document.documentElement.style.setProperty(
      '--announce-height',
      announceHeight + 'px'
    );
  }
  publishAnnounceHeight();

  function updateNav() {
    if (!heroTopbar) return;
    const sy = window.scrollY;
    const topOffset = Math.max(0, announceHeight - sy);
    heroTopbar.style.top = topOffset + 'px';
    /* Switch to solid styling at the point where top reaches 0 —
       this matches the moment the absolute position would have
       merged with the viewport top, so there's no visual jump. */
    heroTopbar.classList.toggle('is-stuck', sy >= announceHeight - 1);
  }

  /* -------- Hero scroll progress --------
     Writes a 0..1 progress value to the hero as the user scrolls
     through the first viewport. CSS reads it via var(--hero-progress)
     to translate/fade content and darken the image overlay. One
     scroll listener powers both this and the header shadow below. */
  const hero = document.querySelector('.hero');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function updateHeroProgress() {
    if (!hero || prefersReducedMotion) return;
    const rect = hero.getBoundingClientRect();
    /* Progress: 0 when hero is fully in view at top, 1 when fully scrolled past */
    const denom = Math.max(rect.height * 0.75, 1);
    const raw = -rect.top / denom;
    const progress = Math.min(Math.max(raw, 0), 1);
    hero.style.setProperty('--hero-progress', progress.toFixed(3));
  }

  /* -------- Header shadow on scroll --------
     Toggles a class instead of mutating inline style so CSS owns the
     visual definition. */
  const header = document.getElementById('site-header');
  let ticking = false;
  let isScrolled = false;

  function onScroll() {
    if (ticking) return;
    window.requestAnimationFrame(function () {
      if (header) {
        const should = window.scrollY > 4;
        if (should !== isScrolled) {
          header.classList.toggle('is-scrolled', should);
          isScrolled = should;
        }
      }
      updateHeroProgress();
      updateNav();
      ticking = false;
    });
    ticking = true;
  }

  function onResize() {
    /* Re-measure announcement height: padding + font scale can change
       across breakpoints, and the strip is in normal flow. */
    if (announceEl) announceHeight = announceEl.offsetHeight;
    publishAnnounceHeight();
    onScroll();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  /* Initial paint */
  updateHeroProgress();
  updateNav();

})();
