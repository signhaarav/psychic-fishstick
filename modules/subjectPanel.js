/**
 * subjectPanel.js — renders the chapter panel that opens under the subject grid.
 * Pure rendering of one subject; the caller owns open/close state and focus.
 */

import { el } from './dom.js';

/**
 * @param {HTMLElement} panel the #subject-panel element
 * @param {object|null} subject the subject to show, or null to close
 * @param {string} [syllabusNote]
 */
export function renderPanel(panel, subject, syllabusNote = '') {
  if (!panel) return;

  if (!subject) {
    panel.hidden = true;
    panel.replaceChildren();
    return;
  }

  const blocks = [
    el('div', {
      className: 'panel__head',
      children: [
        el('div', {
          children: [
            el('h3', { className: 'panel__title', text: subject.name }),
            el('p', { className: 'panel__lede', text: subject.description }),
          ],
        }),
        el('button', {
          className: 'btn btn--ghost btn--sm',
          text: 'Close',
          attrs: {
            type: 'button',
            'data-action': 'close-panel',
            'aria-label': `Close ${subject.name} chapter list`,
          },
        }),
      ],
    }),
  ];

  subject.books.forEach((book) => {
    const block = el('div', { className: 'panel__book' });
    block.append(el('h4', { className: 'panel__book-name', text: book.name }));

    if (book.chapters?.length) {
      block.append(
        el('ul', {
          className: 'panel__chapters',
          children: book.chapters.map((chapter) => el('li', { text: chapter })),
        })
      );
    } else {
      block.append(
        el('p', { className: 'field__hint', text: 'Chapter titles for this book arrive with the Hindi pack.' })
      );
    }
    blocks.push(block);
  });

  blocks.push(
    el('p', {
      className: 'panel__note',
      text:
        subject.note ??
        'Lesson pages for these chapters open in Session 1. The chapter list above is real NCERT content, not a placeholder.',
    })
  );

  if (syllabusNote) blocks.push(el('p', { className: 'field__hint', text: syllabusNote }));

  panel.replaceChildren(...blocks);
  panel.hidden = false;
}
