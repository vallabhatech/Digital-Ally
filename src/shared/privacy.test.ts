import { describe, it, expect, beforeEach } from 'vitest';
import { loadPrivacyPreference, savePrivacyPreference, clearPrivacyPreference, CONSENT_VERSION } from './privacy';

describe('privacy utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return null when no preference is saved', () => {
    const preference = loadPrivacyPreference();
    expect(preference).toBeNull();
  });

  it('should save and load preference correctly', () => {
    const mode = 'remote';
    const saved = savePrivacyPreference(mode);

    expect(saved.mode).toBe(mode);
    expect(saved.consentVersion).toBe(CONSENT_VERSION);
    expect(saved.decidedAt).toBeDefined();

    const loaded = loadPrivacyPreference();
    expect(loaded).not.toBeNull();
    expect(loaded?.mode).toBe(mode);
    expect(loaded?.consentVersion).toBe(CONSENT_VERSION);
  });

  it('should clear preference correctly', () => {
    savePrivacyPreference('local');
    localStorage.setItem('sessionToken', 'abc-123');

    clearPrivacyPreference();

    expect(loadPrivacyPreference()).toBeNull();
    expect(localStorage.getItem('sessionToken')).toBeNull();
  });

  it('should handle legacy or corrupted preference json', () => {
    localStorage.setItem('digital-ally-privacy-preference', '{corruptedJson');
    expect(loadPrivacyPreference()).toBeNull();
  });

  it('should reject legacy consent version', () => {
    const legacyPref = {
      consentVersion: '1999-01-01',
      mode: 'local',
      decidedAt: new Date().toISOString(),
    };
    localStorage.setItem('digital-ally-privacy-preference', JSON.stringify(legacyPref));
    expect(loadPrivacyPreference()).toBeNull();
  });
});
