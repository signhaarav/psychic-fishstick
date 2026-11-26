/**
 * theme.js — appearance preferences: colour theme and Low-End Device Mode.
 * The only module that writes attributes on <html>; everything else reacts to tokens.
 */

import { KEYS, read, write } from '../services/storageService.js';

const DEFAULTS = { theme: 'system', ledm: null };

/** @returns {{ theme: 'light'|'dark'|'system', ledm: boolean|null }} */
export function readSettings() {
  const stored = read(KEYS.settings, {});
  if (!stored || typeof stored !== 'object') return { ...DEFAULTS };
  const theme = ['light', 'dark', 'system'].includes(stored.theme) ? stored.theme : DEFAULTS.theme;
  const ledm = typeof stored.ledm === 'boolean' ? stored.ledm : DEFAULTS.ledm;
  return { theme, ledm };
}

/** @param {'light'|'dark'|'system'} theme */
export function applyTheme(theme) {
  const root = document.documentElement;
  const systemDark = matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
  root.setAttribute('data-theme', resolved);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', resolved === 'dark' ? '#0b0d12' : '#fbfbfd');
}

/** Heuristic for weak hardware or a user asking to save data. */
export function detectLEDM() {
  const connection = navigator.connection ?? {};
  if (connection.saveData === true) return true;
  if (/^(slow-)?2g$|^3g$/.test(connection.effectiveType ?? '')) return true;
  if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 2) return true;
  if (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 2) return true;
  return false;
}

/** @param {boolean} enabled */
export function applyLEDM(enabled) {
  document.documentElement.classList.toggle('ledm', enabled);
}

/**
 * @param {{ theme?: 'light'|'dark'|'system', ledm?: boolean|null }} patch
 * @returns {{ ok: boolean, error?: string }}
 */
export function saveSettings(patch) {
  const next = { ...readSettings(), ...patch };
  return write(KEYS.settings, next);
}

/** Applies stored (or detected) preferences at startup. */
export function initTheme() {
  const settings = readSettings();
  applyTheme(settings.theme);
  // Follow the OS while the user's choice is "system"
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (readSettings().theme === 'system') applyTheme('system');
  });
  applyLEDM(settings.ledm === null ? detectLEDM() : settings.ledm);
  return settings;
}
