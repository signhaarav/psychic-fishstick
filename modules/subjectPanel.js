/**
 * subjectPanel.js — renders one subject's chapters into the Subjects detail pane.
 * Pure rendering: the caller owns open/close state and focus.
 */

import { el, svgIcon } from './dom.js';

/**
 * @param {HTMLElement|null} container the #subject-detail element
 * @param {object|null} subject the subject to show, or null to clear
 * @param {string} [syllabusNote]
 */
export function renderPanel(container, subject, syllabusNote = '') {
  if (!container) return;

  if (!subject) {
    container.hidden = true;
    container.replaceChildren();
    return;
  }

  const blocks = [
    el('div', {
      className: 'detail__head',
      children: [
        el('a', {
          className: 'detail__back',
          attrs: { href: '#/subjects', 'aria-label': 'Back to all subjects' },
          children: [svgIcon('icon-back')],
        }),
        el('div', {
          className: 'detail__titles',
          children: [
            el('h2', { className: 'detail__title', text: subject.name }),
            el('p', { className: 'detail__lede', text: subject.description }),
          ],
        }),
      ],
    }),
  ];

  subject.books.forEach((book) => {
    const chapters = book.chapters ?? [];
    const block = el('div', {
      className: 'book',
      children: [
        el('div', {
          className: 'book__head',
          children: [
            el('h3', { className: 'book__name', text: book.name }),
            el('span', {
              className: 'book__count',
              text: chapters.length ? `${chapters.length} chapters` : 'titles pending',
            }),
          ],
        }),
      ],
    });

    if (chapters.length) {
      block.append(
        el('ol', {
          className: 'chapters',
          children: chapters.map((title, index) =>
            el('li', {
              className: 'chapter',
              children: [
                el('span', { className: 'chapter__n tnum', text: String(index + 1) }),
                el('span', { className: 'chapter__title', text: title }),
              ],
            })
          ),
        })
      );
    } else {
      block.append(
        el('p', {
          className: 'field__hint',
          text: 'Chapter titles for this book arrive with the Hindi pack.',
        })
      );
    }

    blocks.push(block);
  });

  blocks.push(
    el('p', {
      className: 'detail__note',
      text:
        subject.note ??
        'Lesson pages for these chapters open in the next build. The chapter list above is real NCERT content, not a placeholder.',
    })
  );

  if (syllabusNote) blocks.push(el('p', { className: 'field__hint', text: syllabusNote }));

  container.replaceChildren(...blocks);
  container.hidden = false;
}
