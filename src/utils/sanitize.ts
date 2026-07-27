import DOMPurify, { type RemovedElement, type RemovedAttribute } from 'dompurify';
import { enhanceHtmlImages } from '@/lib/lazy-loading';

const CSP_META = `<meta http-equiv="Content-Security-Policy" content="default-src 'self' data: gap: https://ssl.gstatic.com 'unsafe-eval'; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com; img-src data: https: http:; font-src https: data:;">`;

const TAILWIND_SCRIPT = `<script src="https://cdn.tailwindcss.com"></script>`;

/** Allowlisted external script sources that are safe to re-inject after sanitization. */
const TRUSTED_SCRIPT_SRCS = ['https://cdn.tailwindcss.com'];

const PURIFY_CONFIG = {
  WHOLE_DOCUMENT: true,
  ADD_TAGS: ['link', 'style'],
  ADD_ATTR: ['rel', 'href', 'src', 'crossorigin', 'target', 'type'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
  FORBID_ATTR: [
    'onerror',
    'onload',
    'onclick',
    'onmouseover',
    'onfocus',
    'onblur',
    'onchange',
    'onsubmit',
    'action',
    'formaction',
    'srcdoc',
    'data',
  ],
};

export interface SanitizeResult {
  html: string;
  hadUnsafeContent: boolean;
}

/**
 * Returns true if a DOMPurify removed-item represents a trusted script
 * (one whose `src` starts with a TRUSTED_SCRIPT_SRCS entry).
 */
function isTrustedScriptRemoval(item: RemovedElement | RemovedAttribute): boolean {
  const el = (item as RemovedElement).element;
  if (!el || el.nodeName !== 'SCRIPT') return false;
  // RemovedElement.element is typed as Node; cast to Element to access getAttribute.
  const src = (el as Element).getAttribute('src') ?? '';
  return TRUSTED_SCRIPT_SRCS.some((trusted) => src.startsWith(trusted));
}

export function sanitizePreviewHtml(raw: string): SanitizeResult {
  const hasTailwind = raw.includes('cdn.tailwindcss.com');
  const clean = DOMPurify.sanitize(raw.trim(), PURIFY_CONFIG) as string;

  // Only flag as unsafe if DOMPurify removed something OTHER than a trusted script.
  const hadUnsafeContent = DOMPurify.removed.some((item) => !isTrustedScriptRemoval(item));

  let processed = clean;
  if (hasTailwind && !processed.includes('cdn.tailwindcss.com')) {
    processed = processed.includes('<head')
      ? processed.replace(/(<head[^>]*>)/i, `$1${TAILWIND_SCRIPT}`)
      : TAILWIND_SCRIPT + processed;
  }

  const withCsp = processed.includes('<head')
    ? processed.replace(/(<head[^>]*>)/i, `$1${CSP_META}`)
    : CSP_META + processed;

  return { html: enhanceHtmlImages(withCsp), hadUnsafeContent };
}
