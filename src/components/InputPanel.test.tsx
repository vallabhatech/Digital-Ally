import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InputPanel } from './InputPanel';
import { AppContext } from '@/app/context/AppContext';

describe('InputPanel health gating', () => {
  it('disables generation when the service is unhealthy', () => {
    render(
      <AppContext.Provider
        value={{
          privacyMode: 'remote',
          setPrivacyMode: vi.fn(),
          reviewPrivacyChoice: vi.fn(),
          clearPrivateData: vi.fn(),
          prompt: 'Test prompt',
          setPrompt: vi.fn(),
          userName: 'Jane',
          setUserName: vi.fn(),
          businessName: 'Acme',
          setBusinessName: vi.fn(),
          userEmail: 'jane@example.com',
          setUserEmail: vi.fn(),
          userPhone: '555-0000',
          setUserPhone: vi.fn(),
          selectedPalette: 'forest',
          setSelectedPalette: vi.fn(),
          generatedCode: '',
          pageState: 'form',
          setPageState: vi.fn(),
          language: 'en-US',
          setLanguage: vi.fn(),
          error: null,
          setError: vi.fn(),
          handleGenerate: vi.fn(),
          reset: vi.fn(),
          t: (key: string) => key,
          modificationPrompt: '',
          setModificationPrompt: vi.fn(),
          handleAssist: vi.fn(),
          generatedUrl: '',
          newsletter: '',
          isGeneratingPost: false,
          handleGenerateNewsletter: vi.fn(),
          handleSelectExample: vi.fn(),
          services: 'Design',
          setServices: vi.fn(),
          location: 'Seattle',
          setLocation: vi.fn(),
          themeColor: '#10b981',
          setThemeColor: vi.fn(),
          lastPrompt: '',
          setLastPrompt: vi.fn(),
          retryCount: 0,
          setRetryCount: vi.fn(),
          handleRetry: vi.fn(),
          healthStatus: { ok: false, checked: true, retrying: false, message: 'Gemini API is unavailable' },
        } as any}
      >
        <InputPanel />
      </AppContext.Provider>
    );

    expect(screen.getByRole('button', { name: /generatebutton/i })).toBeDisabled();
    expect(screen.getByText(/gemini api is unavailable/i)).toBeInTheDocument();
  });
});
