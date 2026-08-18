/* Yvonne Cleans — site interactions */

(function () {
  'use strict';

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

  /* ---- Service-card quote shortcuts ---- */
  const quoteService = $('#quoteForm select[name="service"]');
  const quoteFormSection = $('#contact');
  $$('[data-quote-service]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      if (quoteService) quoteService.value = link.dataset.quoteService || '';
      quoteFormSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => quoteService?.focus({ preventScroll: true }), 450);
    });
  });

  /* ---- Quote form ---- */
  const form = $('#quoteForm');
  const success = $('#formSuccess');
  const formError = $('#formError');
  if (form && success && formError) {
    const requiredFields = ['name', 'phone', 'service', 'area', 'timing'];
    const clearValidation = () => {
      formError.hidden = true;
      requiredFields.forEach((fieldName) => form.elements[fieldName]?.removeAttribute('aria-invalid'));
    };

    form.addEventListener('input', clearValidation);
    form.addEventListener('change', clearValidation);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get('name') || '').toString().trim();
      const phone = (data.get('phone') || '').toString().trim();
      const service = (data.get('service') || '').toString().trim();
      const area = (data.get('area') || '').toString().trim();
      const timing = (data.get('timing') || '').toString().trim();
      const message = (data.get('message') || '').toString().trim();

      const values = { name, phone, service, area, timing };
      const missingFields = requiredFields.filter((fieldName) => !values[fieldName]);

      if (missingFields.length) {
        formError.hidden = false;
        missingFields.forEach((fieldName) => form.elements[fieldName]?.setAttribute('aria-invalid', 'true'));
        form.elements[missingFields[0]]?.focus();
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

      clearValidation();

      // Build a WhatsApp message to Yvonne
      const waText = encodeURIComponent(
        `Hi Yvonne! I'd like a cleaning quote.\n\n` +
        `Name: ${name}\n` +
        `Phone: ${phone}\n` +
        `Service: ${service}\n` +
        `Area: ${area}\n` +
        `Preferred timing: ${timing}\n` +
        `Details: ${message || '—'}`
      );
      const waUrl = `https://wa.me/27722389894?text=${waText}`;

      success.hidden = false;
      form.reset();
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Open WhatsApp in a new tab after a short pause
      setTimeout(() => {
        window.open(waUrl, '_blank', 'noopener');
      }, 800);
    });
  }

  /* ---- Offline app support ---- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch((error) => {
        console.warn('Yvonne Cleans offline support could not be registered.', error);
      });
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
