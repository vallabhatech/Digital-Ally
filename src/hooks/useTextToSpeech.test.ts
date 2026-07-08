import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTextToSpeech } from './useTextToSpeech';
import { MockSpeechSynthesisUtterance, mockSpeechSynthesis } from '../test/setup';

describe('useTextToSpeech', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockSpeechSynthesisUtterance.lastInstance = null;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should initialize with default states', () => {
    const { result } = renderHook(() => useTextToSpeech());
    expect(result.current.isSpeaking).toBe(false);
    expect(typeof result.current.speak).toBe('function');
    expect(typeof result.current.cancel).toBe('function');
  });

  it('should get and set voices on mount', () => {
    renderHook(() => useTextToSpeech());
    expect(mockSpeechSynthesis.getVoices).toHaveBeenCalled();
  });

  it('should call speak and trigger isSpeaking status', async () => {
    const { result } = renderHook(() => useTextToSpeech());

    act(() => {
      result.current.speak('Hello unit testing', 'en-US');
    });

    // Wait briefly for the internal setTimeout
    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    expect(MockSpeechSynthesisUtterance.lastInstance).not.toBeNull();
    expect(MockSpeechSynthesisUtterance.lastInstance?.text).toBe('Hello unit testing');
    expect(MockSpeechSynthesisUtterance.lastInstance?.lang).toBe('en-US');
  });

  it('should cancel speaking when cancel is called', () => {
    const { result } = renderHook(() => useTextToSpeech());

    // Mock that speechSynthesis is speaking
    mockSpeechSynthesis.speaking = true;

    act(() => {
      result.current.cancel();
    });

    expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
  });
});
