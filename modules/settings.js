/**
 * settings.js — the Settings view: appearance, BYOK key management, honest status copy.
 * Key work is delegated to byokService; this module never reads a raw key.
 */

import { describeError, removeKey, restoreKey, saveKey, testKey } from '../services/byokService.js';
import { getProvider, listProviders } from '../services/providers.js';
import { el } from './dom.js';
import { renderKeyList } from './keyList.js';
import { applyLEDM, applyTheme, initTheme, saveSettings } from './theme.js';
import { notify } from './toast.js';

const form = document.getElementById('key-form');
const providerSelect = document.getElementById('provider-select');
const keyInput = document.getElementById('api-key');
const keyHint = document.getElementById('key-hint');
const keyError = document.getElementById('key-error');
const statusEl = document.getElementById('key-status');
const listEl = document.getElementById('key-list');
const ledmToggle = document.getElementById('ledm-toggle');
const visibilityButton = document.getElementById('key-visibility');
const themeRadios = document.querySelectorAll('input[name="theme"]');

let testing = false;

function setStatus(text, state = 'idle') {
  if (!statusEl) return;
  statusEl.textContent = text;
  statusEl.dataset.state = state;
}

function showFieldError(message) {
  if (keyError) {
    keyError.textContent = message;
    keyError.hidden = !message;
  }
  keyInput?.setAttribute('aria-invalid', String(Boolean(message)));
}

/** Home listens for this so its status line is never stale. */
function announceKeysChanged() {
  document.dispatchEvent(new CustomEvent('vs:keys-changed'));
}

const VALIDATION = {
  'too-short': 'That looks too short — a full key is usually 30 characters or more.',
  'too-long': 'That is longer than any provider key. Check you pasted only the key.',
  'has-space': 'Remove the spaces or line breaks from the key.',
  quota: 'This browser is out of storage space, so the key was not saved.',
  blocked: 'This browser blocked storage (private mode?). The key was not saved.',
  'unknown-provider': 'Pick a provider first.',
};

function fillProviders() {
  if (!providerSelect || providerSelect.options.length > 0) return;
  listProviders().forEach((provider) => {
    const option = el('option', { text: provider.label });
    option.value = provider.id;
    providerSelect.append(option);
  });
}

function updateHint() {
  const provider = getProvider(providerSelect?.value ?? '');
  if (keyHint) keyHint.textContent = provider ? `${provider.keyHint}. Create one at ${provider.docsUrl}` : '';
}

async function runTest(id) {
  if (testing) return;
  testing = true;
  const label = getProvider(id)?.label ?? id;
  setStatus(`Testing ${label}…`, 'busy');

  const result = await testKey(id);
  testing = false;

  if (result.ok) {
    setStatus(`Key works — answered in ${result.latencyMs} ms.`, 'ok');
    notify('Key works. AI help is ready.', { variant: 'success' });
    return;
  }

  const sentence = describeError(result.kind);
  setStatus(sentence, 'error');
  notify(sentence, { variant: 'danger', duration: 7000 });
}

function removeWithUndo(id) {
  const label = getProvider(id)?.label ?? 'Key';
  const result = removeKey(id);

  if (!result.ok) {
    notify('That key could not be removed. Reload the page and try again.', { variant: 'danger' });
    return;
  }

  renderKeyList(listEl);
  announceKeysChanged();
  notify(`${label} key removed.`, {
    variant: 'warning',
    actionLabel: 'Undo',
    duration: 7000,
    onAction: () => {
      const restored = restoreKey(result.record);
      renderKeyList(listEl);
      announceKeysChanged();
      notify(restored.ok ? 'Key restored.' : 'Could not restore that key.', {
        variant: restored.ok ? 'success' : 'danger',
      });
    },
  });
}

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const result = saveKey(providerSelect?.value ?? '', keyInput?.value ?? '');

  if (!result.ok) {
    showFieldError(VALIDATION[result.error] ?? 'The key could not be saved. Try again.');
    setStatus('', 'idle');
    return;
  }

  showFieldError('');
  if (keyInput) keyInput.value = '';
  renderKeyList(listEl);
  announceKeysChanged();
  setStatus(
    result.persisted
      ? `Saved ${result.masked} in this browser. It leaves only when you use an AI feature.`
      : `Saved ${result.masked} for this tab only — this browser is blocking storage.`,
    'ok'
  );
  notify('Key saved.', { variant: 'success' });
});

visibilityButton?.addEventListener('click', () => {
  if (!keyInput) return;
  const revealed = keyInput.type === 'text';
  keyInput.type = revealed ? 'password' : 'text';
  visibilityButton.setAttribute('aria-pressed', String(!revealed));
  visibilityButton.textContent = revealed ? 'Show' : 'Hide';
  keyInput.focus();
});

listEl?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  if (button.dataset.action === 'test') runTest(button.dataset.provider);
  if (button.dataset.action === 'remove') removeWithUndo(button.dataset.provider);
});

providerSelect?.addEventListener('change', updateHint);

themeRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    if (!radio.checked) return;
    applyTheme(radio.value);
    saveSettings({ theme: radio.value });
  });
});

ledmToggle?.addEventListener('change', () => {
  applyLEDM(ledmToggle.checked);
  saveSettings({ ledm: ledmToggle.checked });
});

const settings = initTheme();
const themeRadio = document.getElementById(`theme-${settings.theme}`);
if (themeRadio) themeRadio.checked = true;
if (ledmToggle) {
  ledmToggle.checked =
    settings.ledm === null ? document.documentElement.classList.contains('ledm') : settings.ledm;
}
fillProviders();
updateHint();
renderKeyList(listEl);
