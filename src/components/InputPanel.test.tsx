import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { InputPanel } from './InputPanel';
import { useAppStore } from '@/store/useAppStore';

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

vi.mock('@/hooks/useAppActions', () => ({
  useAppActions: () => ({ handleGenerate: vi.fn() })
}));

describe('InputPanel health gating', () => {
  beforeEach(() => {
    useAppStore.setState({
      prompt: 'Test prompt',
      userName: 'Jane',
      businessName: 'Acme',
      userEmail: 'jane@example.com',
      userPhone: '555-0000',
      selectedPalette: 'forest',
      services: 'Design',
      location: 'Seattle',
      themeColor: '#10b981',
      healthStatus: { ok: false, checked: true, retrying: false, message: 'Gemini API is unavailable' },
    });
  });

  it('disables generation when the service is unhealthy', () => {
    render(<InputPanel />);

    expect(screen.getByRole('button', { name: /generatebutton/i })).toBeDisabled();
    expect(screen.getByText(/gemini api is unavailable/i)).toBeInTheDocument();
  });
});
