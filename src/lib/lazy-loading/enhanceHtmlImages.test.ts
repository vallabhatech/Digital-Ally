import { describe, it, expect } from 'vitest';
import { enhanceHtmlImages, LAZY_IMAGE_CLASS, LAZY_IMAGE_FALLBACK } from './enhanceHtmlImages';

describe('enhanceHtmlImages', () => {
  it('adds lazy loading attributes to img tags', () => {
    const html =
      '<html><head></head><body><img src="https://example.com/a.jpg" alt="Hero"></body></html>';
    const result = enhanceHtmlImages(html);

    expect(result).toContain('loading="lazy"');
    expect(result).toContain('decoding="async"');
    expect(result).toContain(`class="${LAZY_IMAGE_CLASS}"`);
    expect(result).toContain(`data-fallback="${LAZY_IMAGE_FALLBACK}"`);
  });

  it('preserves existing classes on img tags', () => {
    const html = '<img class="hero" src="https://example.com/a.jpg" alt="Hero">';
    const result = enhanceHtmlImages(html);

    expect(result).toContain('class="hero da-lazy-image"');
  });

  it('does not duplicate lazy attributes when already present', () => {
    const html = '<img src="a.jpg" loading="lazy" alt="Already lazy">';
    const result = enhanceHtmlImages(html);

    expect(result.match(/loading="lazy"/g)?.length).toBe(1);
  });

  it('injects placeholder styles into head', () => {
    const html = '<html><head></head><body><img src="a.jpg" alt="Test"></body></html>';
    const result = enhanceHtmlImages(html);

    expect(result).toContain(`img.${LAZY_IMAGE_CLASS}`);
    expect(result).toContain('</head>');
  });
});
