/**
 * router.js — hash routing for the three views.
 * The page never reloads: this module owns which view is visible, the tab's
 * aria-current, the app-bar label, the document title, focus and scroll reset.
 */

const VIEWS = {
  home: { id: 'view-home', label: 'Home' },
  subjects: { id: 'view-subjects', label: 'Subjects' },
  settings: { id: 'view-settings', label: 'Settings' },
};

const FALLBACK = 'home';
const listeners = new Set();
const viewport = document.getElementById('main');
const where = document.getElementById('appbar-where');

let current = { view: FALLBACK, param: null };

/** @param {string} hash @returns {{ view: string, param: string|null, known: boolean }} */
function parse(hash) {
  const raw = String(hash ?? '').replace(/^#\/?/, '').trim();
  const [head, param] = raw.split('/');
  const known = Object.prototype.hasOwnProperty.call(VIEWS, head);
  return { view: known ? head : FALLBACK, param: param || null, known };
}

/** @returns {{ view: string, param: string|null }} */
export function currentRoute() {
  return { ...current };
}

/** @param {string} path e.g. "/subjects/science" or "#/settings" */
export function navigate(path) {
  const next = path.startsWith('#') ? path : `#${path.startsWith('/') ? '' : '/'}${path}`;
  if (location.hash === next) apply(false);
  else location.hash = next;
}

/**
 * Subscribes to route changes and replays the current route immediately, so a
 * listener registered after first paint still renders the right state.
 * @param {(route: { view: string, param: string|null }) => void} fn
 * @returns {() => void} unsubscribe
 */
export function onRoute(fn) {
  listeners.add(fn);
  fn({ ...current });
  return () => listeners.delete(fn);
}

function focusTitle(view) {
  const section = document.getElementById(VIEWS[view].id);
  const title = section?.querySelector('.view__title');
  if (title) title.focus({ preventScroll: true });
}

function apply(isInitial) {
  const next = parse(location.hash);

  // Unknown hashes (e.g. the #main skip link) must not change the view.
  if (!next.known && !isInitial) return;

  current = { view: next.view, param: next.param };

  Object.entries(VIEWS).forEach(([name, meta]) => {
    const section = document.getElementById(meta.id);
    if (section) section.hidden = name !== current.view;
  });

  document.querySelectorAll('.tab').forEach((tab) => {
    if (tab.dataset.tab === current.view) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });

  if (where) where.textContent = VIEWS[current.view].label;
  document.title = `${VIEWS[current.view].label} · VidyaSetu`;
  if (viewport) viewport.scrollTop = 0;

  listeners.forEach((fn) => fn({ ...current }));
  if (!isInitial) focusTitle(current.view);
}

// Keep the hash canonical on first load without adding a history entry.
if (!parse(location.hash).known && location.hash) {
  history.replaceState(null, '', '#/home');
}

window.addEventListener('hashchange', () => apply(false));
apply(true);
