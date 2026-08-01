# Yvonne Cleans — Website

A clean, modern, mobile-first website for Yvonne Cleans, a residential & commercial cleaning service in Pretoria.

## What's in here

```
yvonne-cleans/
├── index.html           # The whole site (single page)
├── css/styles.css       # All styles — fully responsive
├── js/main.js           # Menu, form, scroll, animations
├── assets/images/       # Hero, services, gallery, real team photos
└── robots.txt
```

## Live contact details
- **Phone / WhatsApp:** 072 238 9894
- **Email:** yvonnepmabena@gmail.com
- **Area:** Pretoria & surrounds

## How to update

### Change a phone number or email
Open `index.html` and use Find & Replace:
- `27722389894` (international format used in WhatsApp links)
- `072 238 9894` (display format)
- `yvonnepmabena@gmail.com`

### Change a service description
Open `index.html`, find the `<!-- Services -->` section. Each service is a `<article class="service-card">` block — edit the text inside.

### Add a new testimonial
In the `<!-- Testimonials -->` section, copy a `<div class="testimonial">…</div>` block and edit the contents.

### Swap a photo
Drop a new image into `assets/images/` and update the corresponding `background-image: url('…')` in `index.html`.

### Change colors
Open `css/styles.css` and edit the `--green-*` variables at the top. The whole site will update.

## How to deploy
The site is a static site — drop the whole `yvonne-cleans/` folder onto any host:
- **Netlify:** drag the folder onto netlify.com/drop
- **Vercel:** `vercel deploy`
- **cPanel / traditional hosting:** upload via FTP
- **Custom domain:** point your domain's DNS to the host

## Built-in features
- ✅ Sticky header with shadow on scroll
- ✅ Mobile hamburger menu
- ✅ Hero with WhatsApp + call CTAs
- ✅ 6 service cards (residential, office, deep, move, events, upholstery)
- ✅ About section with brand story & real team photos
- ✅ 4-step "how it works"
- ✅ 3 testimonials
- ✅ Photo gallery (with hover captions)
- ✅ 7-question FAQ (accordion)
- ✅ Quote form that opens WhatsApp with prefilled message
- ✅ Floating WhatsApp button (always visible)
- ✅ Reveal-on-scroll animations
- ✅ Fully responsive (mobile / tablet / desktop)
- ✅ SEO meta + Open Graph
- ✅ Accessible (keyboard, screen reader, reduced-motion)
