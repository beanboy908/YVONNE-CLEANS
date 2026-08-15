/* Yvonne Cleans — site interactions */

(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* Report a failure without letting it break the rest of the page. */
  const report = (context, error) => {
    console.error(`[yvonne-cleans] ${context}:`, error);
  };

  /* Wrap an event handler so one broken feature cannot silently kill others. */
  const guard = (context, fn) => function (...args) {
    try {
      return fn.apply(this, args);
    } catch (error) {
      report(context, error);
    }
  };

  /* Run an independent feature block; a failure is logged, not swallowed. */
  const feature = (context, fn) => {
    try {
      fn();
    } catch (error) {
      report(context, error);
    }
  };

  feature('footer year', () => {
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });

  /* ---- Sticky header shadow on scroll ---- */
  const header = $('#header');
  const onScroll = guard('header scroll', () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  });
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu ---- */
  feature('mobile menu', () => {
    const hamburger = $('#hamburger');
    const nav = $('#nav');
    if (!hamburger || !nav) return;

    hamburger.addEventListener('click', guard('mobile menu toggle', () => {
      const open = nav.classList.toggle('is-open');
      hamburger.classList.toggle('is-open', open);
      hamburger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    }));

    // close on link click (mobile)
    $$('a', nav).forEach(a => {
      a.addEventListener('click', guard('mobile menu close', () => {
        if (nav.classList.contains('is-open')) {
          nav.classList.remove('is-open');
          hamburger.classList.remove('is-open');
          hamburger.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      }));
    });
  });

  /* ---- Smooth scroll for in-page anchors ---- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', guard('smooth scroll', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      let target = null;
      try {
        target = document.querySelector(id);
      } catch (error) {
        // Fragments such as "#1-section" are not valid CSS selectors; fall
        // back to the native anchor behaviour instead of breaking the click.
        report(`smooth scroll target "${id}"`, error);
        return;
      }
      if (!target) return;
      e.preventDefault();
      const headerHeight = header ? header.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    }));
  });

  /* ---- Reveal-on-scroll ----
     Only opt-in elements near the viewport. We mark the document with
     .js-reveal so the CSS only hides when this script has run. If JS
     fails or the user scrolls super fast, content is always visible. */
  const revealAll = () => $$('.reveal').forEach(el => el.classList.add('is-visible'));

  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('js-reveal');
    try {
      const observer = new IntersectionObserver(guard('reveal observer', (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }), { threshold: 0.05, rootMargin: '0px 0px -10% 0px' });

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
      setTimeout(guard('reveal safety net', revealAll), 2500);
    } catch (error) {
      // Never leave content hidden because the animation setup failed.
      report('reveal-on-scroll setup', error);
      document.documentElement.classList.remove('js-reveal');
      revealAll();
    }
  }

  /* ---- Quote form ---- */
  const WHATSAPP_NUMBER = '27722389894';

  feature('quote form', () => {
    const form = $('#quoteForm');
    const success = $('#formSuccess');
    const errorBox = $('#formError');
    if (!form || !success) return;

    const showError = (msg) => {
      if (errorBox) {
        errorBox.textContent = msg;
        errorBox.hidden = false;
      } else {
        // No place to render the message — at least surface it to the user.
        window.alert(msg);
      }
    };
    const clearError = () => {
      if (errorBox) {
        errorBox.textContent = '';
        errorBox.hidden = true;
      }
    };

    const shake = () => {
      if (typeof form.animate !== 'function') return;
      try {
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
      } catch (error) {
        report('quote form shake animation', error);
      }
    };

    form.addEventListener('submit', guard('quote form submit', (e) => {
      e.preventDefault();
      clearError();

      const data = new FormData(form);
      const value = (key) => (data.get(key) || '').toString().trim();
      const name = value('name');
      const phone = value('phone');
      const service = value('service');
      const message = value('message');

      const missing = [];
      if (!name) missing.push('your name');
      if (!phone) missing.push('a phone or WhatsApp number');
      if (!service) missing.push('the service you need');

      if (missing.length) {
        shake();
        showError(`Please add ${missing.join(', ')} so we can send your quote request.`);
        const firstInvalid = !name
          ? form.elements.namedItem('name')
          : !phone
            ? form.elements.namedItem('phone')
            : form.elements.namedItem('service');
        if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
        return;
      }

      const waText = encodeURIComponent(
        `Hi Yvonne! I'd like a cleaning quote.\n\n` +
        `Name: ${name}\n` +
        `Phone: ${phone}\n` +
        `Service: ${service}\n` +
        `Details: ${message || '—'}`
      );
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`;

      // Open inside the click gesture so pop-up blockers are less likely to
      // intervene, and tell the user when the hand-off did not happen.
      let opened = null;
      try {
        opened = window.open(waUrl, '_blank', 'noopener');
      } catch (error) {
        report('opening WhatsApp', error);
      }

      success.hidden = false;
      form.reset();
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });

      if (!opened) {
        showError('We could not open WhatsApp automatically — your browser may have blocked the pop-up.');
        if (errorBox) {
          const link = document.createElement('a');
          link.href = waUrl;
          link.target = '_blank';
          link.rel = 'noopener';
          link.textContent = 'Tap here to send your request on WhatsApp.';
          errorBox.appendChild(document.createElement('br'));
          errorBox.appendChild(link);
        }
      }
    }));
  });

  /* ---- Light parallax on hero (subtle, GPU-friendly) ---- */
  feature('hero parallax', () => {
    const heroBg = document.querySelector('.hero__bg');
    if (!heroBg || !window.matchMedia('(min-width: 900px)').matches) return;
    let ticking = false;
    window.addEventListener('scroll', guard('hero parallax scroll', () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(guard('hero parallax frame', () => {
        const y = Math.min(window.scrollY * 0.25, 80);
        heroBg.style.transform = `scale(1.05) translateY(${y}px)`;
        ticking = false;
      }));
    }), { passive: true });
  });
})();
