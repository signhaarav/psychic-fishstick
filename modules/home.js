/**
 * home.js — the Home view: real counts, the BYOK status line, and one-tap
 * shortcuts into a subject. Every number here is read from data or storage;
 * nothing is invented (no streaks, no completion percentages).
 */

import { countChapters } from '../services/contentService.js';
import { getSubjects } from './contentStore.js';
import { listKeys } from '../services/byokService.js';
import { el } from './dom.js';
import { subjectRow } from './subjectRow.js';

const statsEl = document.getElementById('home-stats');
const aiEl = document.getElementById('ai-status');
const listEl = document.getElementById('home-subjects');

/** @param {{ subjects: object[] }} data */
function renderStats(data) {
  if (!statsEl) return;
  const subjects = data.subjects;
  const books = subjects.reduce((total, subject) => total + subject.books.length, 0);
  const chapters = subjects.reduce((total, subject) => total + countChapters(subject), 0);
  const values = statsEl.querySelectorAll('.stat__value');
  [subjects.length, books, chapters].forEach((value, index) => {
    if (values[index]) values[index].textContent = String(value);
  });
}

/** The status line is a fact, not a nudge: it says exactly what is on this device. */
function renderKeys() {
  if (!aiEl) return;
  const keys = listKeys();
  if (keys.length === 0) {
    aiEl.textContent = 'No key attached yet. Everything except AI help already works.';
    return;
  }
  const names = keys.slice(0, 2).map((key) => key.label).join(' and ');
  const more = keys.length > 2 ? ` and ${keys.length - 2} more` : '';
  aiEl.textContent = `${keys.length === 1 ? 'Key ready' : 'Keys ready'} for ${names}${more}.`;
}

async function renderShortcuts() {
  if (!listEl) return;
  try {
    const data = await getSubjects();
    renderStats(data);
    listEl.replaceChildren(...data.subjects.map(subjectRow));
    listEl.setAttribute('aria-busy', 'false');
  } catch {
    listEl.setAttribute('aria-busy', 'false');
    listEl.replaceChildren(
      el('li', {
        className: 'meta',
        text: 'Subjects could not be loaded. Open the Subjects tab to try again.',
      })
    );
  }
}

// Settings dispatches this after any key change, so Home never shows a stale line.
document.addEventListener('vs:keys-changed', renderKeys);

renderKeys();
renderShortcuts();
