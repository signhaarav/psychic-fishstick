/**
 * contentService — loads static JSON content. No user data, no keys, no writes.
 * Modules stay fetch-free (AGENTS.md §7), so every network read of content lives here.
 */

const SUBJECTS_URL = './data/subjects.json';

/** Typed content failure so the UI can say what went wrong. */
export class ContentError extends Error {
  /** @param {'network'|'malformed'|'http'} kind @param {string} message */
  constructor(kind, message) {
    super(message);
    this.name = 'ContentError';
    this.kind = kind;
  }
}

/** @param {unknown} data */
function assertSubjectsShape(data) {
  if (!data || typeof data !== 'object') throw new ContentError('malformed', 'Subject data is not an object');
  if (!Array.isArray(data.subjects) || data.subjects.length === 0) {
    throw new ContentError('malformed', 'Subject data has no subjects');
  }
  data.subjects.forEach((subject) => {
    const ok =
      typeof subject.id === 'string' &&
      typeof subject.name === 'string' &&
      typeof subject.description === 'string' &&
      typeof subject.icon === 'string' &&
      Array.isArray(subject.books);
    if (!ok) throw new ContentError('malformed', `Subject "${subject?.id ?? '?'}" is incomplete`);
  });
}

/**
 * Fetches and validates the Class 9 subject catalogue.
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ schemaVersion: number, class: number, board: string, syllabusNote: string, subjects: object[] }>}
 * @throws {ContentError}
 */
export async function loadSubjects({ signal } = {}) {
  let response;
  try {
    response = await fetch(SUBJECTS_URL, { credentials: 'omit', signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ContentError('network', 'Could not reach the subject data file');
  }

  if (!response.ok) {
    throw new ContentError('http', `Subject data returned ${response.status}`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new ContentError('malformed', 'Subject data is not valid JSON');
  }

  assertSubjectsShape(data);
  return data;
}

/** @param {object} subject @returns {number} total chapters across all of its books */
export function countChapters(subject) {
  return subject.books.reduce((total, book) => total + (Array.isArray(book.chapters) ? book.chapters.length : 0), 0);
}
