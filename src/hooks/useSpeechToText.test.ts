import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSpeechToText } from './useSpeechToText';
import { MockSpeechRecognition } from '../test/setup';

describe('useSpeechToText', () => {
  const onTranscript = vi.fn();

  beforeEach(() => {
    onTranscript.mockClear();
    MockSpeechRecognition.lastInstance = null;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should initialize with default states', () => {
    const { result } = renderHook(() => useSpeechToText({ onTranscript, lang: 'en-US' }));
    expect(result.current.isListening).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle unsupported browser support', () => {
    const originalSpeech = window.SpeechRecognition;
    const originalWebkit = window.webkitSpeechRecognition;
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;

    const { result } = renderHook(() => useSpeechToText({ onTranscript, lang: 'en-US' }));
    expect(result.current.error).toBe('Speech recognition is not supported in this browser.');

    window.SpeechRecognition = originalSpeech;
    window.webkitSpeechRecognition = originalWebkit;
  });

  it('should start listening when toggleListening is called', () => {
    const { result } = renderHook(() => useSpeechToText({ onTranscript, lang: 'en-US' }));
    
    act(() => {
      result.current.toggleListening();
    });

    expect(result.current.isListening).toBe(true);
    expect(result.current.error).toBeNull();
    expect(MockSpeechRecognition.lastInstance?.start).toHaveBeenCalled();
  });

  it('should stop listening when toggleListening is called again', () => {
    const { result } = renderHook(() => useSpeechToText({ onTranscript, lang: 'en-US' }));
    
    act(() => {
      result.current.toggleListening();
    });
    expect(result.current.isListening).toBe(true);

    act(() => {
      result.current.toggleListening();
    });

    expect(result.current.isListening).toBe(false);
    expect(MockSpeechRecognition.lastInstance?.stop).toHaveBeenCalled();
  });

  it('should call onTranscript when speech result event is triggered', () => {
    renderHook(() => useSpeechToText({ onTranscript, lang: 'en-US' }));

    act(() => {
      const mockEvent = {
        results: [
          {
            isFinal: true,
            0: { transcript: 'hello world' }
          }
        ]
      };
      MockSpeechRecognition.lastInstance?.onresult(mockEvent as any);
    });

    expect(onTranscript).toHaveBeenCalledWith('hello world');
  });

  it('should handle speech error event', () => {
    const { result } = renderHook(() => useSpeechToText({ onTranscript, lang: 'en-US' }));

    act(() => {
      result.current.toggleListening();
    });
    expect(result.current.isListening).toBe(true);

    act(() => {
      const mockErrorEvent = {
        error: 'network'
      };
      MockSpeechRecognition.lastInstance?.onerror(mockErrorEvent as any);
    });

    expect(result.current.isListening).toBe(false);
    expect(result.current.error).toBe('Speech recognition error: network');
  });

  it('should set isListening to false when onend is triggered', () => {
    const { result } = renderHook(() => useSpeechToText({ onTranscript, lang: 'en-US' }));

    act(() => {
      result.current.toggleListening();
    });
    expect(result.current.isListening).toBe(true);

    act(() => {
      MockSpeechRecognition.lastInstance?.onend();
    });

    expect(result.current.isListening).toBe(false);
  });
});
