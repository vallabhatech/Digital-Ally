import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InputPanel } from './InputPanel';
import { useAppStore } from '@/store/useAppStore';

describe('InputPanel health gating', () => {
  it('disables generation when the service is unhealthy', () => {
    useAppStore.setState({
      privacyMode: 'remote',
      user: { name: 'Jane', email: 'jane@example.com', phone: '555-0000' },
      business: { name: 'Acme', services: 'Design', location: 'Seattle' },
      draft: {
        prompt: 'Test prompt for homepage and services section',
        modificationPrompt: '',
        selectedPalette: 'Corporate',
        themeColor: '#10b981',
      },
      generation: {
        generatedCode: '',
        generatedUrl: '',
        newsletter: '',
        isGeneratingPost: false,
      },
      ui: {
        pageState: 'form',
        language: 'en-US',
        error: null,
        lastPrompt: '',
        retryCount: 0,
        healthStatus: {
          ok: false,
          checked: true,
          retrying: false,
          message: 'Gemini API is unavailable',
        },
      },
    });

    render(<InputPanel />);

    expect(screen.getByRole('button', { name: /generate website/i })).toBeDisabled();
    expect(screen.getByText(/gemini api is unavailable/i)).toBeInTheDocument();
  });
});
