/**
 * Unit tests for yvonne-cleans/js/main.js
 *
 * main.js ships as an IIFE with no exports, so we exercise its behaviour by
 * building a representative DOM, stubbing the browser APIs jsdom lacks, and
 * (re-)executing the module against that DOM. jest.isolateModules gives each
 * test a fresh run of the IIFE.
 */

const path = require('path');

const MAIN_JS = path.resolve(__dirname, '../yvonne-cleans/js/main.js');

const DOM = `
  <header class="header" id="header"></header>
  <nav class="nav" id="nav">
    <a href="#services">Services</a>
    <a href="#missing">Missing target</a>
    <a href="#">Bare hash</a>
    <a href="https://example.com">External</a>
  </nav>
  <button class="hamburger" id="hamburger" aria-label="Open menu" aria-expanded="false"></button>

  <main>
    <div class="hero"><div class="hero__bg"></div></div>
    <section id="services">
      <div class="service-card">Card</div>
      <div class="section__head">Head</div>
    </section>
    <form class="cta__form" id="quoteForm" novalidate>
      <input type="text" name="name" />
      <input type="tel" name="phone" />
      <select name="service">
        <option value="">Choose</option>
        <option value="Deep clean">Deep clean</option>
      </select>
      <textarea name="message"></textarea>
    </form>
    <p class="cta__form-success" id="formSuccess" hidden></p>
  </main>

  <footer><span id="year"></span></footer>
`;

/** Set window.scrollY (read-only in jsdom). */
function setScrollY(value) {
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    writable: true,
    value,
  });
}

let ioInstances;

function installStubs() {
  // Browser APIs jsdom does not implement.
  Element.prototype.animate = jest.fn(() => ({ finished: Promise.resolve() }));
  Element.prototype.scrollIntoView = jest.fn();
  window.scrollTo = jest.fn();
  window.open = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false });
  window.requestAnimationFrame = jest.fn((cb) => {
    cb();
    return 1;
  });

  ioInstances = [];
  global.IntersectionObserver = class {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.observed = [];
      this.unobserved = [];
      ioInstances.push(this);
    }
    observe(el) {
      this.observed.push(el);
    }
    unobserve(el) {
      this.unobserved.push(el);
    }
    disconnect() {}
    /** Test helper: simulate the browser firing the observer. */
    trigger(entries) {
      this.callback(entries, this);
    }
  };
  window.IntersectionObserver = global.IntersectionObserver;
}

/** Execute a fresh copy of main.js against the given DOM markup. */
function loadMainWith(markup) {
  document.documentElement.className = '';
  document.body.innerHTML = markup;
  jest.isolateModules(() => {
    require(MAIN_JS);
  });
}

/** Render the full DOM fixture and execute a fresh copy of main.js against it. */
function loadMain() {
  loadMainWith(DOM);
}

beforeEach(() => {
  jest.useFakeTimers();
  installStubs();
  setScrollY(0);
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
  delete global.IntersectionObserver;
});

describe('defensive guards', () => {
  test('runs without throwing when the expected elements are absent', () => {
    expect(() => loadMainWith('<div></div>')).not.toThrow();
    // No #year to populate, no listeners wired, no crash.
    expect(document.getElementById('year')).toBeNull();
  });

  test('smooth scroll works even when there is no header for offset', () => {
    loadMainWith(
      '<a href="#target">go</a><section id="target">t</section>'
    );
    const link = document.querySelector('a[href="#target"]');
    const evt = new Event('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(evt);
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    expect(evt.defaultPrevented).toBe(true);
  });
});

describe('footer year', () => {
  test('sets current year in #year', () => {
    loadMain();
    expect(document.getElementById('year').textContent).toBe(
      String(new Date().getFullYear())
    );
  });
});

describe('sticky header', () => {
  test('adds is-scrolled once scrolled past threshold', () => {
    loadMain();
    const header = document.getElementById('header');
    // onScroll runs once on load with scrollY = 0 -> not scrolled.
    expect(header.classList.contains('is-scrolled')).toBe(false);

    setScrollY(50);
    window.dispatchEvent(new Event('scroll'));
    expect(header.classList.contains('is-scrolled')).toBe(true);
  });

  test('removes is-scrolled at or below threshold', () => {
    loadMain();
    const header = document.getElementById('header');
    setScrollY(50);
    window.dispatchEvent(new Event('scroll'));
    expect(header.classList.contains('is-scrolled')).toBe(true);

    setScrollY(4);
    window.dispatchEvent(new Event('scroll'));
    expect(header.classList.contains('is-scrolled')).toBe(false);
  });
});

describe('mobile menu', () => {
  test('hamburger toggles nav open state and body scroll lock', () => {
    loadMain();
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');

    hamburger.click();
    expect(nav.classList.contains('is-open')).toBe(true);
    expect(hamburger.classList.contains('is-open')).toBe(true);
    expect(hamburger.getAttribute('aria-expanded')).toBe('true');
    expect(document.body.style.overflow).toBe('hidden');

    hamburger.click();
    expect(nav.classList.contains('is-open')).toBe(false);
    expect(hamburger.getAttribute('aria-expanded')).toBe('false');
    expect(document.body.style.overflow).toBe('');
  });

  test('clicking a nav link closes an open menu', () => {
    loadMain();
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');

    hamburger.click();
    expect(nav.classList.contains('is-open')).toBe(true);

    nav.querySelector('a').click();
    expect(nav.classList.contains('is-open')).toBe(false);
    expect(hamburger.getAttribute('aria-expanded')).toBe('false');
    expect(document.body.style.overflow).toBe('');
  });

  test('nav link click is a no-op when the menu is already closed', () => {
    loadMain();
    const nav = document.getElementById('nav');
    nav.querySelector('a').click();
    expect(nav.classList.contains('is-open')).toBe(false);
  });
});

describe('smooth scroll for in-page anchors', () => {
  test('scrolls to an existing target and prevents default', () => {
    loadMain();
    const link = document.querySelector('a[href="#services"]');
    const evt = new Event('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(evt);

    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    expect(window.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth' })
    );
    expect(evt.defaultPrevented).toBe(true);
  });

  test('ignores bare "#" links', () => {
    loadMain();
    const link = document.querySelector('a[href="#"]');
    const evt = new Event('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(evt);
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(evt.defaultPrevented).toBe(false);
  });

  test('ignores anchors whose target does not exist', () => {
    loadMain();
    const link = document.querySelector('a[href="#missing"]');
    const evt = new Event('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(evt);
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(evt.defaultPrevented).toBe(false);
  });
});

describe('reveal-on-scroll', () => {
  test('marks the document, observes targets and reveals on intersect', () => {
    loadMain();
    expect(document.documentElement.classList.contains('js-reveal')).toBe(true);
    expect(ioInstances).toHaveLength(1);

    const io = ioInstances[0];
    const card = document.querySelector('.service-card');
    expect(card.classList.contains('reveal')).toBe(true);
    expect(io.observed).toContain(card);

    io.trigger([{ isIntersecting: true, target: card }]);
    expect(card.classList.contains('is-visible')).toBe(true);
    expect(io.unobserved).toContain(card);
  });

  test('non-intersecting entries are left hidden', () => {
    loadMain();
    const io = ioInstances[0];
    const head = document.querySelector('.section__head');
    io.trigger([{ isIntersecting: false, target: head }]);
    expect(head.classList.contains('is-visible')).toBe(false);
  });

  test('safety timeout forces all reveal elements visible', () => {
    loadMain();
    const card = document.querySelector('.service-card');
    expect(card.classList.contains('is-visible')).toBe(false);
    jest.advanceTimersByTime(2500);
    expect(card.classList.contains('is-visible')).toBe(true);
  });

  test('skips reveal wiring when IntersectionObserver is unavailable', () => {
    delete global.IntersectionObserver;
    delete window.IntersectionObserver;
    loadMain();
    expect(document.documentElement.classList.contains('js-reveal')).toBe(false);
    expect(document.querySelector('.service-card').classList.contains('reveal')).toBe(
      false
    );
  });
});

describe('quote form', () => {
  function fill({ name = '', phone = '', service = '', message = '' }) {
    document.querySelector('input[name="name"]').value = name;
    document.querySelector('input[name="phone"]').value = phone;
    document.querySelector('select[name="service"]').value = service;
    document.querySelector('textarea[name="message"]').value = message;
  }

  function submit() {
    const form = document.getElementById('quoteForm');
    const evt = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(evt);
    return evt;
  }

  test('invalid submission shakes the form and does not show success', () => {
    loadMain();
    fill({ name: 'Jane' }); // phone + service missing
    const evt = submit();

    expect(evt.defaultPrevented).toBe(true);
    expect(document.getElementById('formSuccess').hidden).toBe(true);
    expect(document.getElementById('quoteForm').animate).toHaveBeenCalledTimes(1);
    expect(window.open).not.toHaveBeenCalled();
  });

  test('valid submission reveals success and opens a prefilled WhatsApp link', () => {
    loadMain();
    fill({
      name: 'Jane Doe',
      phone: '072 123 4567',
      service: 'Deep clean',
      message: '3-bed home',
    });
    submit();

    const success = document.getElementById('formSuccess');
    expect(success.hidden).toBe(false);
    expect(success.scrollIntoView).toHaveBeenCalled();
    expect(document.querySelector('input[name="name"]').value).toBe('');

    jest.advanceTimersByTime(800);
    expect(window.open).toHaveBeenCalledTimes(1);
    const [url, target, features] = window.open.mock.calls[0];
    expect(url).toContain('https://wa.me/27722389894?text=');
    expect(target).toBe('_blank');
    expect(features).toBe('noopener');

    const text = decodeURIComponent(url.split('text=')[1]);
    expect(text).toContain('Name: Jane Doe');
    expect(text).toContain('Phone: 072 123 4567');
    expect(text).toContain('Service: Deep clean');
    expect(text).toContain('Details: 3-bed home');
  });

  test('valid submission without a message uses an em-dash placeholder', () => {
    loadMain();
    fill({ name: 'Jane', phone: '072', service: 'Deep clean' });
    submit();
    jest.advanceTimersByTime(800);

    const url = window.open.mock.calls[0][0];
    const text = decodeURIComponent(url.split('text=')[1]);
    expect(text).toContain('Details: —');
  });
});

describe('hero parallax', () => {
  test('transforms the hero background on wide viewports', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    loadMain();
    const heroBg = document.querySelector('.hero__bg');

    setScrollY(100);
    window.dispatchEvent(new Event('scroll'));

    expect(window.requestAnimationFrame).toHaveBeenCalled();
    expect(heroBg.style.transform).toBe('scale(1.05) translateY(25px)');
  });

  test('parallax translation is capped at 80px', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    loadMain();
    const heroBg = document.querySelector('.hero__bg');

    setScrollY(1000);
    window.dispatchEvent(new Event('scroll'));
    expect(heroBg.style.transform).toBe('scale(1.05) translateY(80px)');
  });

  test('parallax stays off on narrow viewports', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    loadMain();
    const heroBg = document.querySelector('.hero__bg');

    setScrollY(100);
    window.dispatchEvent(new Event('scroll'));
    expect(heroBg.style.transform).toBe('');
  });
});
