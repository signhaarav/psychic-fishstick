/**
 * subjectRow.js — one subject as a full-width tappable row.
 * Shared by Home (shortcuts) and Subjects (the list), so the markup is identical.
 */

import { countChapters } from '../services/contentService.js';
import { el, svgIcon } from './dom.js';

/**
 * @param {object} subject
 * @param {{ sub?: string }} [options] what to show under the name
 * @returns {HTMLLIElement}
 */
export function subjectRow(subject, { sub = subject.tagline ?? '' } = {}) {
  const chapters = countChapters(subject);
  return el('li', {
    children: [
      el('a', {
        className: `subject-row hue-${subject.hue}`,
        attrs: { href: `#/subjects/${subject.id}` },
        children: [
          el('span', { className: 'subject-row__icon', children: [svgIcon(subject.icon)] }),
          el('span', {
            className: 'subject-row__text',
            children: [
              el('span', { className: 'subject-row__name', text: subject.name }),
              el('span', { className: 'subject-row__sub', text: sub }),
            ],
          }),
          el('span', {
            className: 'subject-row__count',
            text: chapters > 0 ? `${chapters} ch.` : `${subject.books.length} bk.`,
          }),
          svgIcon('icon-go', 'subject-row__go'),
        ],
      }),
    ],
  });
}
