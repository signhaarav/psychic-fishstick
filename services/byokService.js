/**
 * byokService — key custody and the only outbound requests in the app.
 * Keys live in localStorage (constraint C2), are masked for display, sent only to the chosen
 * provider's own origin in a header, never logged, never placed in a URL (AGENTS.md §9).
 */

import { KEYS, read, write } from './storageService.js';
import { getProvider } from './providers.js';

const MIN_KEY_LENGTH = 12;
const MAX_KEY_LENGTH = 220;
const TEST_TIMEOUT_MS = 12000;

/** @param {string} raw @returns {string} e.g. "sk-…9f2a" — the only form the UI ever sees */
export function mask(raw) {
  const key = String(raw ?? '');
  if (key.length <= 8) return '•'.repeat(Math.max(key.length, 4));
  return `${key.slice(0, 3)}…${key.slice(-4)}`;
}

/** @returns {{ [providerId: string]: { key: string, addedAt: string } }} */
function readAll() {
  const stored = read(KEYS.byok, {});
  return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
}

/** @returns {{ id: string, label: string, masked: string, addedAt: string }[]} */
export function listKeys() {
  return Object.entries(readAll())
    .filter(([, record]) => record && typeof record.key === 'string')
    .map(([id, record]) => ({
      id,
      label: getProvider(id)?.label ?? id,
      masked: mask(record.key),
      addedAt: record.addedAt ?? '',
    }));
}

/**
 * @param {string} id @param {string} rawKey
 * @returns {{ ok: true, masked: string, persisted: boolean } | { ok: false, error: string }}
 */
export function saveKey(id, rawKey) {
  if (!getProvider(id)) return { ok: false, error: 'unknown-provider' };

  const key = String(rawKey ?? '').trim();
  if (key.length < MIN_KEY_LENGTH) return { ok: false, error: 'too-short' };
  if (key.length > MAX_KEY_LENGTH) return { ok: false, error: 'too-long' };
  if (/\s/.test(key)) return { ok: false, error: 'has-space' };

  const all = readAll();
  all[id] = { key, addedAt: new Date().toISOString() };
  const result = write(KEYS.byok, all);
  if (!result.ok) return { ok: false, error: result.error ?? 'unknown' };

  return { ok: true, masked: mask(key), persisted: result.persisted !== false };
}

/**
 * Removes a key and hands the record back so the caller can offer Undo for a few seconds.
 * @param {string} id
 * @returns {{ ok: true, record: { id: string, key: string, addedAt: string } } | { ok: false }}
 */
export function removeKey(id) {
  const all = readAll();
  const record = all[id];
  if (!record) return { ok: false };
  delete all[id];
  if (!write(KEYS.byok, all).ok) return { ok: false };
  return { ok: true, record: { id, key: record.key, addedAt: record.addedAt ?? '' } };
}

/** @param {{ id: string, key: string, addedAt: string }} record */
export function restoreKey(record) {
  if (!record?.id || !record?.key) return { ok: false, error: 'unknown' };
  const all = readAll();
  all[record.id] = { key: record.key, addedAt: record.addedAt || new Date().toISOString() };
  return write(KEYS.byok, all);
}

/** Internal only: the one place plaintext leaves storage, and never leaves this file. */
function getRawKey(id) {
  const record = readAll()[id];
  return typeof record?.key === 'string' ? record.key : null;
}

/** @param {number} status @returns {string} */
function classifyStatus(status) {
  if (status === 400 || status === 401 || status === 403) return 'invalid-key';
  if (status === 429) return 'rate-limited';
  return 'provider-down';
}

/** Human sentence for an error kind — worded in one place so the UI never invents its own. */
export function describeError(kind) {
  const map = {
    'no-key': 'No key saved for this provider yet.',
    'invalid-key': 'The provider rejected this key. Check that you copied all of it and that it belongs to this provider.',
    'rate-limited': 'The provider is rate-limiting this key. Wait a minute, then try again.',
    'provider-down': 'The provider did not answer normally. Try again shortly.',
    network:
      'Could not reach the provider from this browser. Your connection may be down, or the provider may block browser requests.',
    timeout: 'The provider took too long to answer. Try again.',
    cancelled: 'Test cancelled.',
    unknown: 'Something went wrong while testing the key.',
  };
  return map[kind] ?? map.unknown;
}

/**
 * One-token request proving a saved key works.
 * @param {string} id
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ ok: true, latencyMs: number } | { ok: false, kind: string, status?: number }>}
 */
export async function testKey(id, { signal } = {}) {
  const provider = getProvider(id);
  if (!provider) return { ok: false, kind: 'unknown' };

  const key = getRawKey(id);
  if (!key) return { ok: false, kind: 'no-key' };

  const { url, init } = provider.buildRequest(key);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TEST_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  if (signal) signal.addEventListener('abort', onAbort, { once: true });

  const started = performance.now();
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, credentials: 'omit' });
    const latencyMs = Math.round(performance.now() - started);

    if (!response.ok) {
      try {
        await response.body?.cancel();
      } catch {
        /* nothing left to cancel */
      }
      return { ok: false, kind: classifyStatus(response.status), status: response.status };
    }

    await response.json().catch(() => null);
    return { ok: true, latencyMs };
  } catch (error) {
    const aborted = error instanceof DOMException && error.name === 'AbortError';
    if (!aborted) return { ok: false, kind: 'network' };
    return { ok: false, kind: signal?.aborted ? 'cancelled' : 'timeout' };
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}
