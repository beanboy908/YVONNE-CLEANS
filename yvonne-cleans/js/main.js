/* Yvonne Cleans — site interactions */

(function () {
  'use strict';

  const WHATSAPP_NUMBER = '27722389894';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---- Year in footer ---- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Sticky header shadow on scroll ---- */
  const header = $('#header');
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu ---- */
  const hamburger = $('#hamburger');
  const nav = $('#nav');
  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      hamburger.classList.toggle('is-open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    // close on link click (mobile)
    $$('a', nav).forEach(a => {
      a.addEventListener('click', () => {
        if (nav.classList.contains('is-open')) {
          nav.classList.remove('is-open');
          hamburger.classList.remove('is-open');
          hamburger.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      });
    });
  }

  /* ---- Smooth scroll for in-page anchors ---- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const headerHeight = header ? header.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ---- Reveal-on-scroll ----
     Only opt-in elements near the viewport. We mark the document with
     .js-reveal so the CSS only hides when this script has run. If JS
     fails or the user scrolls super fast, content is always visible. */
  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('js-reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -10% 0px' });

    const targets = [
      '.service-card',
      '.testimonial',
      '.step',
      '.gallery__item',
      '.about__feature',
      '.faq__item',
      '.about__img',
      '.about__sticker',
      '.section__head',
      '.cta__content',
      '.cta__form'
    ];
    targets.forEach(sel => {
      $$(sel).forEach((el, i) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${Math.min(i * 60, 240)}ms`;
        observer.observe(el);
      });
    });

    // Safety net: after 2.5s, force everything visible (in case IO never fires for some reason)
    setTimeout(() => {
      $$('.reveal').forEach(el => el.classList.add('is-visible'));
    }, 2500);
  }

  /* ---- Quote form ---- */
  const MAX_LENGTHS = { name: 80, phone: 20, service: 60, message: 1000 };
  const PHONE_RE = /^[0-9+()\-.\s]{7,20}$/;

  // Strip control characters and clamp length before the value is used anywhere.
  const clean = (value, max) =>
    value.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ').trim().slice(0, max);

  const form = $('#quoteForm');
  const success = $('#formSuccess');
  if (form && success) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = clean((data.get('name') || '').toString(), MAX_LENGTHS.name);
      const phone = clean((data.get('phone') || '').toString(), MAX_LENGTHS.phone);
      const service = clean((data.get('service') || '').toString(), MAX_LENGTHS.service);
      const message = clean((data.get('message') || '').toString(), MAX_LENGTHS.message);

      const serviceSelect = $('select[name="service"]', form);
      const serviceOptions = serviceSelect
        ? $$('option', serviceSelect).map(o => o.value.trim()).filter(Boolean)
        : [];

      if (!name || !PHONE_RE.test(phone) || !serviceOptions.includes(service)) {
        // visual feedback
        form.animate(
          [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-6px)' },
            { transform: 'translateX(6px)' },
            { transform: 'translateX(-4px)' },
            { transform: 'translateX(0)' }
          ],
          { duration: 400, easing: 'ease-in-out' }
        );
        return;
      }

      // Build a WhatsApp message to Yvonne
      const waText = encodeURIComponent(
        `Hi Yvonne! I'd like a cleaning quote.\n\n` +
        `Name: ${name}\n` +
        `Phone: ${phone}\n` +
        `Service: ${service}\n` +
        `Details: ${message || '—'}`
      );
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`;

      success.hidden = false;
      form.reset();
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Open WhatsApp in a new tab after a short pause
      setTimeout(() => {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }, 800);
    });
  }

  /* ---- Light parallax on hero (subtle, GPU-friendly) ---- */
  const heroBg = document.querySelector('.hero__bg');
  if (heroBg && window.matchMedia('(min-width: 900px)').matches) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = Math.min(window.scrollY * 0.25, 80);
          heroBg.style.transform = `scale(1.05) translateY(${y}px)`;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }
})();
