import { describe, it, expect } from 'vitest';
import { sanitizePreviewHtml } from './sanitize';

describe('sanitizePreviewHtml', () => {
  it('should pass through clean HTML content and prepend CSP meta tag', () => {
    const rawHtml = '<div>Hello World</div>';
    const result = sanitizePreviewHtml(rawHtml);

    expect(result.hadUnsafeContent).toBe(false);
    expect(result.html).toContain('Content-Security-Policy');
    expect(result.html).toContain('<div>Hello World</div>');
  });

  it('should detect and remove script tags', () => {
    const rawHtml = '<div>Hello<script>alert("xss")</script> World</div>';
    const result = sanitizePreviewHtml(rawHtml);

    expect(result.hadUnsafeContent).toBe(true);
    expect(result.html).not.toContain('script');
    expect(result.html).not.toContain('alert');
    expect(result.html).toContain('<div>Hello World</div>');
  });

  it('should detect and remove inline event handlers', () => {
    const rawHtml = '<button onclick="alert(\'xss\')">Click me</button>';
    const result = sanitizePreviewHtml(rawHtml);

    // Note: button tag is also in FORBID_TAGS, so the tag itself is removed
    expect(result.hadUnsafeContent).toBe(true);
    expect(result.html).not.toContain('button');
    expect(result.html).not.toContain('onclick');
  });

  it('should sanitize full html and prepend CSP meta tag', () => {
    const rawHtml = '<html><head><title>Test</title></head><body><div>Content</div></body></html>';
    const result = sanitizePreviewHtml(rawHtml);

    expect(result.hadUnsafeContent).toBe(false);
    expect(result.html).toContain('Content-Security-Policy');
    expect(result.html).toContain('<div>Content</div>');
  });

  it('should remove forbidden iframe tags', () => {
    const rawHtml = '<div><iframe src="https://example.com"></iframe></div>';
    const result = sanitizePreviewHtml(rawHtml);

    expect(result.hadUnsafeContent).toBe(true);
    expect(result.html).not.toContain('iframe');
  });
});

describe('sanitizePreviewHtml lazy loading integration', () => {
  it('enhances images in sanitized preview HTML', () => {
    const raw = `<!DOCTYPE html><html><head></head><body><img src="https://example.com/photo.jpg" alt="Photo"></body></html>`;
    const { html } = sanitizePreviewHtml(raw);

    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain('da-lazy-image');
  });
});
