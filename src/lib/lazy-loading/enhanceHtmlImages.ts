import { LAZY_IMAGE_CLASS, LAZY_IMAGE_FALLBACK, LAZY_IMAGE_STYLES } from './constants';

/**
 * Enhance sanitized HTML so images use native lazy loading, async decoding,
 * placeholder styling, and a documented fallback source attribute.
 */
export function enhanceHtmlImages(html: string): string {
  const withLazyImages = html.replace(/<img\b([^>]*?)(\s*\/?)>/gi, (match, attrs, closing) => {
    if (/loading\s*=/i.test(attrs)) {
      return match;
    }

    const classAttr = /class\s*=/i.test(attrs)
      ? attrs.replace(/class\s*=\s*(['"])(.*?)\1/i, (_m: string, q: string, classes: string) => {
          const next = classes.includes(LAZY_IMAGE_CLASS)
            ? classes
            : `${classes} ${LAZY_IMAGE_CLASS}`.trim();
          return `class=${q}${next}${q}`;
        })
      : `${attrs} class="${LAZY_IMAGE_CLASS}"`;

    const withFallback = /data-fallback\s*=/i.test(classAttr)
      ? classAttr
      : `${classAttr} data-fallback="${LAZY_IMAGE_FALLBACK}"`;

    return `<img${withFallback} loading="lazy" decoding="async"${closing}>`;
  });

  if (withLazyImages.includes('</head>')) {
    return withLazyImages.replace('</head>', `${LAZY_IMAGE_STYLES}</head>`);
  }

  if (withLazyImages.includes('<head')) {
    return withLazyImages.replace(/(<head[^>]*>)/i, `$1${LAZY_IMAGE_STYLES}`);
  }

  return LAZY_IMAGE_STYLES + withLazyImages;
}

export { LAZY_IMAGE_FALLBACK, LAZY_IMAGE_PLACEHOLDER, LAZY_IMAGE_CLASS } from './constants';
