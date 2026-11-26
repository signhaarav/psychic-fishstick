/**
 * subjects.js — the Subjects view: a searchable list of five subjects plus a
 * detail pane reached by #/subjects/<id>. Opening a subject swaps panes.
 */

import { countChapters } from '../services/contentService.js';
import { getSubjects } from './contentStore.js';
import { el } from './dom.js';
import { renderPanel } from './subjectPanel.js';
import { subjectRow } from './subjectRow.js';
import { onRoute } from './router.js';

const browser = document.getElementById('subjects-browser');
const grid = document.getElementById('subjects-grid');
const search = document.getElementById('subjects-search');
const countEl = document.getElementById('subjects-count');
const statusEl = document.getElementById('subjects-status');
const detail = document.getElementById('subject-detail');

let subjects = [];
let syllabusNote = '';
let query = '';
let debounceId = null;
let route = { view: 'home', param: null };

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
        el('p', {
          text: 'Try “science”, “poetry”, “democracy”, or a chapter name like “polynomials”.',
        }),
        el('button', {
          className: 'btn btn--secondary btn--sm',
          text: 'Clear search',
          attrs: { type: 'button', 'data-action': 'clear-search' },
        }),
      ],
    })
  );
  statusEl.hidden = false;
}
function renderCards(list) {
  grid.replaceChildren(...list.map((subject) => subjectRow(subject)));
  grid.hidden = false;
  statusEl.hidden = true;
}
function applyFilter() {
  const needle = query.trim().toLowerCase();
  const list = subjects.filter((subject) => matches(subject, needle));
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
          className: 'btn btn--secondary btn--sm',
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
    const data = await getSubjects();
    subjects = data.subjects;
    syllabusNote = data.syllabusNote ?? '';
    statusEl.hidden = true;
    applyFilter();
    applyRoute();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    renderError(error?.message ?? 'Unknown error');
  } finally {
    grid.setAttribute('aria-busy', 'false');
  }
}

/** @param {string|null} id */
function showDetail(id) {
  const subject = subjects.find((item) => item.id === id) ?? null;
  if (!subject) {
    showBrowser();
    return;
  }
  browser.hidden = true;
  renderPanel(detail, subject, syllabusNote);
  document.title = `${subject.name} · VidyaSetu`;
  detail.focus({ preventScroll: true });
}

function showBrowser() {
  renderPanel(detail, null, syllabusNote);
  browser.hidden = false;
  document.title = 'Subjects · VidyaSetu';
}

/** Re-applies the current route; called on load and after data arrives (deep links). */
function applyRoute() {
  if (route.view !== 'subjects') return;
  if (route.param) showDetail(route.param);
  else showBrowser();
}

onRoute((next) => {
  route = next;
  applyRoute();
});

search?.addEventListener('input', () => {
  query = search.value;
  if (debounceId !== null) clearTimeout(debounceId);
  debounceId = setTimeout(() => {
    debounceId = null;
    applyFilter();
  }, 120);
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
