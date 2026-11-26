/**
 * subjects.js — the subject grid, live search and its four states.
 * No fetch and no storage: content comes from contentService, nothing is written.
 */

import { countChapters, loadSubjects } from '../services/contentService.js';
import { el, svgIcon } from './dom.js';
import { renderPanel } from './subjectPanel.js';

const grid = document.getElementById('subjects-grid');
const search = document.getElementById('subjects-search');
const countEl = document.getElementById('subjects-count');
const statusEl = document.getElementById('subjects-status');
const panel = document.getElementById('subject-panel');
let subjects = [];
let syllabusNote = '';
let query = '';
let activeId = null;
let debounceId = null;  // search debounce

/** @param {object} subject */
function matches(subject, needle) {
  if (!needle) return true;
  const haystack = [
    subject.name,
    subject.tagline,
    subject.description,
    ...subject.books.map((book) => book.name),
    ...subject.books.flatMap((book) => book.chapters ?? []),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}
function renderCount(shown) {
  if (!countEl) return;
  if (!subjects.length) {
    countEl.textContent = '';
    return;
  }
  const chapters = subjects.reduce((total, subject) => total + countChapters(subject), 0);
  const books = subjects.reduce((total, subject) => total + subject.books.length, 0);
  countEl.textContent = query
    ? `${shown} of ${subjects.length} subjects match “${query}”`
    : `${subjects.length} subjects · ${chapters} chapters across ${books} NCERT books`;
}
function renderEmpty() {
  grid.replaceChildren();
  grid.hidden = true;
  statusEl.replaceChildren(
    el('div', {
      className: 'state',
      children: [
        el('p', { className: 'state__title', text: `No subject matches “${query}”.` }),
        el('p', { text: 'Try “science”, “poetry”, “democracy”, or a chapter name like “polynomials”.' }),
        el('button', {
          className: 'btn btn--ghost btn--sm',
          text: 'Clear search',
          attrs: { type: 'button', 'data-action': 'clear-search' },
        }),
      ],
    })
  );
  statusEl.hidden = false;
}
function renderCards(list) {
  grid.replaceChildren();

  list.forEach((subject) => {
    const chapters = countChapters(subject);
    const button = el('button', {
      className: `subject-card hue-${subject.hue}`,
      attrs: {
        type: 'button',
        'aria-expanded': String(activeId === subject.id),
        'aria-controls': 'subject-panel',
      },
      children: [
        el('span', {
          className: 'subject-card__top',
          children: [
            el('span', { className: 'subject-card__icon', children: [svgIcon(subject.icon)] }),
            el('span', {
              className: 'subject-card__text',
              children: [
                el('span', { className: 'subject-card__name', text: subject.name }),
                el('span', { className: 'subject-card__tagline', text: subject.tagline }),
              ],
            }),
          ],
        }),
        el('span', {
          className: 'subject-card__meta',
          children: [
            el('span', { text: chapters > 0 ? `${chapters} chapters` : `${subject.books.length} books` }),
            el('span', { className: 'chip', text: 'Lessons in Session 1' }),
          ],
        }),
      ],
    });
    button.dataset.subjectId = subject.id;
    grid.append(el('li', { className: 'rise', children: [button] }));
  });

  grid.hidden = false;
  statusEl.hidden = true;
}
function applyFilter() {
  const needle = query.trim().toLowerCase();
  const list = subjects.filter((subject) => matches(subject, needle));
  if (activeId && !list.some((subject) => subject.id === activeId)) {
    activeId = null; // the open chapter panel no longer matches the filter
    renderPanel(panel, null, syllabusNote);
  }
  renderCount(list.length);
  if (list.length === 0) renderEmpty();
  else renderCards(list);
}
function renderError(message) {
  grid.replaceChildren();
  grid.hidden = true;
  statusEl.replaceChildren(
    el('div', {
      className: 'state state--error',
      children: [
        el('p', { className: 'state__title', text: 'Subjects could not be loaded.' }),
        el('p', { text: `${message}. Check your connection, then try again.` }),
        el('button', {
          className: 'btn btn--ghost btn--sm',
          text: 'Try again',
          attrs: { type: 'button', 'data-action': 'retry' },
        }),
      ],
    })
  );
  statusEl.hidden = false;
}
async function load() {
  statusEl.hidden = true;
  grid.setAttribute('aria-busy', 'true');
  statusEl.replaceChildren(
    el('p', {
      className: 'loading',
      children: [el('span', { className: 'loading__dot' }), el('span', { text: 'Loading subjects…' })],
    })
  );
  statusEl.hidden = false;

  try {
    const data = await loadSubjects();
    subjects = data.subjects;
    syllabusNote = data.syllabusNote ?? '';
    statusEl.hidden = true;
    applyFilter();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    renderError(error?.message ?? 'Unknown error');
  } finally {
    grid.setAttribute('aria-busy', 'false');
  }
}
function setActive(id) {
  activeId = activeId === id ? null : id;
  const subject = subjects.find((item) => item.id === activeId) ?? null;
  renderPanel(panel, subject, syllabusNote);
  document.querySelectorAll('.subject-card').forEach((card) => {
    card.setAttribute('aria-expanded', String(card.dataset.subjectId === activeId));
  });
  if (subject) panel?.focus({ preventScroll: false });
  else document.querySelector(`.subject-card[data-subject-id="${id}"]`)?.focus();
}
search?.addEventListener('input', () => {
  query = search.value;
  if (debounceId !== null) clearTimeout(debounceId);
  debounceId = setTimeout(() => {
    debounceId = null;
    applyFilter();
  }, 120);
});

grid?.addEventListener('click', (event) => {
  const card = event.target.closest('.subject-card');
  if (card) setActive(card.dataset.subjectId);
});

panel?.addEventListener('click', (event) => {
  if (event.target.closest('[data-action="close-panel"]')) setActive(activeId);
});

statusEl?.addEventListener('click', (event) => {
  if (event.target.closest('[data-action="clear-search"]')) {
    if (search) search.value = '';
    query = '';
    applyFilter();
    search?.focus();
  }
  if (event.target.closest('[data-action="retry"]')) load();
});

load();
