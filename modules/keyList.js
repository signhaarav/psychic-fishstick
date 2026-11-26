/**
 * keyList.js — renders the saved-key rows (masked, never the key itself) in Settings.
 * Reading only: test and remove are delegated back to settings.js by data attributes.
 */

import { listKeys } from '../services/byokService.js';
import { el } from './dom.js';

function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderRow(key) {
  const test = el('button', {
    className: 'btn btn--ghost btn--sm',
    text: 'Test',
    attrs: {
      type: 'button',
      'data-action': 'test',
      'data-provider': key.id,
      'aria-label': `Test ${key.label} key`,
    },
  });

  const remove = el('button', {
    className: 'btn btn--danger btn--sm',
    text: 'Remove',
    attrs: {
      type: 'button',
      'data-action': 'remove',
      'data-provider': key.id,
      'aria-label': `Remove ${key.label} key`,
    },
  });

  const info = el('span', { className: 'key-row__info' });
  info.append(
    el('span', { className: 'key-row__provider', text: key.label }),
    el('span', { className: 'key-row__mask', text: key.masked })
  );
  if (key.addedAt) info.append(el('span', { className: 'field__hint', text: `Added ${formatDate(key.addedAt)}` }));

  return el('li', {
    className: 'key-row',
    children: [info, el('span', { className: 'key-row__actions', children: [test, remove] })],
  });
}

/**
 * Re-renders the key list, including the honest empty state.
 * @param {HTMLElement|null} listEl
 */
export function renderKeyList(listEl) {
  if (!listEl) return;
  const keys = listKeys();
  if (keys.length === 0) {
    listEl.replaceChildren(
      el('li', {
        className: 'field__hint',
        text: 'No keys saved. Everything except AI help works without one — and you can add one whenever you like.',
      })
    );
    return;
  }
  listEl.replaceChildren(...keys.map(renderRow));
}
