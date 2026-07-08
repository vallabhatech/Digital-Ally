import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeneration } from '@/hooks/useGeneration';
import * as geminiService from '@/services/geminiService';

const mockT = vi.fn((key: string) => key);

describe('useGeneration', () => {
  it('returns errors when website form validation fails', async () => {
    const { result } = renderHook(() => useGeneration({ t: mockT }));

    const response = await act(async () =>
      result.current.generateWebsiteContent({
        userName: '',
        businessName: '',
        userEmail: 'not-an-email',
        userPhone: '',
        prompt: '',
        services: '',
        location: '',
        themeColor: '#10b981',
        selectedPalette: '',
      })
    );

    expect(result.current).toBeTruthy();
    expect(response).toEqual({ success: false, error: expect.any(String) });
  });

  it('retries website generation and returns success if service passes', async () => {
    const serviceSpy = vi.spyOn(geminiService, 'generateWebsite');

    serviceSpy
      .mockRejectedValueOnce(new Error('Transient'))
      .mockResolvedValueOnce('<!doctype html><body>ok</body>');

    const { result } = renderHook(() => useGeneration({ t: mockT }));

    const response = await act(async () =>
      result.current.generateWebsiteContent({
        userName: 'Alice',
        businessName: 'Example',
        userEmail: 'alice@example.com',
        userPhone: '+1234567890',
        prompt: 'Describe the business',
        services: 'Consulting',
        location: 'Remote',
        themeColor: '#10b981',
        selectedPalette: 'Modern',
      })
    );

    expect(response).toEqual({ success: true, code: '<!doctype html><body>ok</body>' });
    expect(serviceSpy).toHaveBeenCalledTimes(2);
    serviceSpy.mockRestore();
  });
});
