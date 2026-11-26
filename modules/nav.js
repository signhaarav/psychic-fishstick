/**
 * nav.js — fixed navbar behaviour: mobile disclosure menu, active-section state, anchor closing.
 * One IntersectionObserver does the highlighting; there is no scroll listener anywhere.
 */

const header = document.getElementById('site-nav');
const toggle = header?.querySelector('.nav__toggle');
const menu = document.getElementById('nav-menu');

const SECTIONS = ['home', 'subjects', 'how-it-works'];

function setOpen(open) {
  if (!header || !toggle) return;
  header.classList.toggle('nav--open', open);
  toggle.setAttribute('aria-expanded', String(open));

  const label = toggle.querySelector('.nav__label');
  if (label) label.textContent = open ? 'Close' : 'Menu';

  const icon = toggle.querySelector('use');
  if (icon) icon.setAttribute('href', open ? '#icon-close' : '#icon-menu');
}

function isOpen() {
  return header?.classList.contains('nav--open') ?? false;
}

function wireMenu() {
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  // Any link or button inside the menu closes it (an action was taken).
  menu.addEventListener('click', (event) => {
    const target = event.target.closest('a, button');
    if (target && isOpen()) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !isOpen()) return;
    setOpen(false);
    toggle.focus();
  });

  // Clicking outside the bar closes the panel.
  document.addEventListener('click', (event) => {
    if (!isOpen()) return;
    if (header.contains(event.target)) return;
    setOpen(false);
  });

  // A resize to desktop width must not leave a stale "open" state behind.
  const desktop = window.matchMedia('(min-width: 900px)');
  desktop.addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}

function wireActiveSection() {
  const links = new Map();
  document.querySelectorAll('.nav__link[href^="#"]').forEach((link) => {
    links.set(link.getAttribute('href').slice(1), link);
  });

  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link, id) => {
          if (id === entry.target.id) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    },
    // A band across the middle of the viewport: whichever section crosses it is "current".
    { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
  );

  SECTIONS.forEach((id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}

wireMenu();
wireActiveSection();
