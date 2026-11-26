/**
 * toast.js — one toast at a time, in the page's single aria-live region (#toasts).
 * Owns its timer so a second toast can never inherit the first one's countdown.
 */

let timerId = null;
let current = null;

function host() {
  return document.getElementById('toasts');
}

/** Removes the visible toast (if any) and clears its timer. */
export function dismissToast() {
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
  if (current) {
    current.remove();
    current = null;
  }
}

/**
 * @param {string} message plain text, never HTML
 * @param {{ variant?: 'info'|'success'|'danger'|'warning', actionLabel?: string|null,
 *           onAction?: (() => void)|null, duration?: number }} [options]
 */
export function notify(message, options = {}) {
  const { variant = 'info', actionLabel = null, onAction = null, duration = 5000 } = options;
  const region = host();
  if (!region) return;

  dismissToast();

  const toast = document.createElement('div');
  toast.className = `toast toast--${variant}`;

  const text = document.createElement('p');
  text.className = 'toast__msg';
  text.textContent = message;
  toast.append(text);

  if (actionLabel && typeof onAction === 'function') {
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'toast__action';
    action.textContent = actionLabel;
    action.addEventListener('click', () => {
      dismissToast();
      onAction();
    });
    toast.append(action);
  }

  region.append(toast);
  current = toast;

  if (duration > 0) {
    timerId = setTimeout(dismissToast, duration);
  }
}
