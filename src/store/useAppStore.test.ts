import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from './useAppStore';
import * as privacyUtils from '@/shared/privacy';

vi.mock('@/shared/privacy', async (importOriginal) => {
  const actual = await importOriginal<typeof privacyUtils>();
  return {
    ...actual,
    savePrivacyPreference: vi.fn(),
    clearPrivacyPreference: vi.fn(),
    loadPrivacyPreference: vi.fn(() => ({ mode: 'remote', version: '1.0.0' })),
  };
});

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
    vi.clearAllMocks();
  });

  it('initializes with default data', () => {
    const state = useAppStore.getState();
    expect(state.user.name).toBe('');
    expect(state.business.name).toBe('');
    expect(state.draft.prompt).toBe('');
    expect(state.ui.pageState).toBe('form');
  });

  it('updates fields correctly via setField', () => {
    const store = useAppStore.getState();

    store.setField('userName', 'Jane Doe');
    expect(useAppStore.getState().user.name).toBe('Jane Doe');

    store.setField('businessName', 'Acme Corp');
    expect(useAppStore.getState().business.name).toBe('Acme Corp');

    store.setField('prompt', 'Build a nice website');
    expect(useAppStore.getState().draft.prompt).toBe('Build a nice website');

    store.setField('pageState', 'result');
    expect(useAppStore.getState().ui.pageState).toBe('result');
  });

  it('translates keys via t function', () => {
    const store = useAppStore.getState();
    // Default language is en-US
    const result = store.t('dashboard');
    expect(result).toBe('Dashboard');
  });

  it('handles privacy mode selection', () => {
    const store = useAppStore.getState();
    store.setPrivacyMode('remote');
    expect(store.privacyMode).toBe('remote');
    expect(privacyUtils.savePrivacyPreference).toHaveBeenCalledWith('remote');
  });

  it('clears private data on clearPrivateData', () => {
    const store = useAppStore.getState();
    store.setField('userName', 'Secret User');
    store.setPrivacyMode('remote');

    store.clearPrivateData();
    expect(useAppStore.getState().user.name).toBe('');
    expect(useAppStore.getState().privacyMode).toBeNull();
    expect(privacyUtils.clearPrivacyPreference).toHaveBeenCalled();
  });

  it('allows reviewing privacy choices', () => {
    const store = useAppStore.getState();
    store.setPrivacyMode('remote');

    store.reviewPrivacyChoice();
    expect(useAppStore.getState().privacyMode).toBeNull();
    expect(privacyUtils.clearPrivacyPreference).toHaveBeenCalled();
  });
});
