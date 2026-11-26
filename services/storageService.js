/**
 * storageService — the only code in this app that touches localStorage.
 * Namespaced, JSON-safe, and quiet about failures: callers get a result object, never a thrown error.
 * Never logs values (they may contain a key).
 */

const PREFIX = 'vs:v1:';

export const KEYS = {
  byok: `${PREFIX}byok`,
  settings: `${PREFIX}settings`,
};

/** Session-only fallback used when storage is blocked (Safari private mode, etc.). */
const memory = new Map();

let availability = null;

/** @returns {boolean} true when localStorage is readable and writable. */
export function isAvailable() {
  if (availability !== null) return availability;
  try {
    const probe = `${PREFIX}__probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    availability = true;
  } catch {
    availability = false;
  }
  return availability;
}

/**
 * @param {string} key one of KEYS
 * @param {*} [fallback]
 * @returns {*} parsed value, or fallback when missing or corrupt
 */
export function read(key, fallback = null) {
  if (!isAvailable()) return memory.has(key) ? memory.get(key) : fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    console.warn(`[storage] value at storage key "${key}" is not valid JSON — falling back`);
    return fallback;
  }
}

/**
 * @param {string} key one of KEYS
 * @param {*} value must be JSON-serialisable
 * @returns {{ ok: boolean, persisted?: boolean, error?: 'quota'|'blocked'|'unknown' }}
 */
export function write(key, value) {
  let serialised;
  try {
    serialised = JSON.stringify(value);
  } catch {
    return { ok: false, error: 'unknown' };
  }

  if (!isAvailable()) {
    memory.set(key, value);
    return { ok: true, persisted: false };
  }

  try {
    window.localStorage.setItem(key, serialised);
    return { ok: true, persisted: true };
  } catch (error) {
    const quota = error instanceof Error && error.name === 'QuotaExceededError';
    return { ok: false, error: quota ? 'quota' : 'blocked' };
  }
}

/** @param {string} key one of KEYS */
export function remove(key) {
  memory.delete(key);
  if (!isAvailable()) return { ok: true };
  try {
    window.localStorage.removeItem(key);
    return { ok: true };
  } catch {
    return { ok: false, error: 'blocked' };
  }
}

/** Removes every key this app owns. Used by "erase my data". */
export function clearNamespace() {
  memory.clear();
  if (!isAvailable()) return { ok: true };
  try {
    const doomed = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(PREFIX)) doomed.push(key);
    }
    doomed.forEach((key) => window.localStorage.removeItem(key));
    return { ok: true, removed: doomed.length };
  } catch {
    return { ok: false, error: 'blocked' };
  }
}
