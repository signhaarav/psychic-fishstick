/**
 * dom.js — tiny element helpers shared by modules. No state, no side effects, no data access.
 * Everything goes through createElement + textContent, so no code path can inject an HTML string.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * @param {string} tag
 * @param {{ className?: string, text?: string, attrs?: Record<string,string>, children?: Node[] }} [options]
 * @returns {HTMLElement}
 */
export function el(tag, { className, text, attrs = {}, children = [] } = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  Object.entries(attrs).forEach(([name, value]) => node.setAttribute(name, value));
  children.forEach((child) => node.append(child));
  return node;
}

/**
 * References a symbol from the inline sprite in index.html.
 * @param {string} symbolId e.g. "icon-math"
 * @param {string} [className]
 * @returns {SVGSVGElement}
 */
export function svgIcon(symbolId, className = 'icon') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#${symbolId}`);
  svg.append(use);
  return svg;
}
