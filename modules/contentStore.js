/**
 * contentStore.js — one shared load of the subject catalogue per page.
 * Caching is an app concern, so it lives here; contentService stays a plain
 * transport and keeps its contract unchanged (AGENTS.md §7: no fetch here).
 */

import { loadSubjects } from '../services/contentService.js';

let pending = null;

/**
 * @returns {Promise<{ schemaVersion: number, class: number, board: string, syllabusNote: string, subjects: object[] }>}
 */
export function getSubjects() {
  if (!pending) {
    pending = loadSubjects();
    // A failure must not be remembered: the retry button has to retry.
    pending.catch(() => {
      pending = null;
    });
  }
  return pending;
}
