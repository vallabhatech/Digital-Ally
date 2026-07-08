import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock window.SpeechRecognition and window.webkitSpeechRecognition
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = '';
  start = vi.fn();
  stop = vi.fn();
  onresult = null as any;
  onerror = null as any;
  onend = null as any;
  
  static lastInstance: MockSpeechRecognition | null = null;

  constructor() {
    MockSpeechRecognition.lastInstance = this;
  }
}

global.window.SpeechRecognition = MockSpeechRecognition as any;
global.window.webkitSpeechRecognition = MockSpeechRecognition as any;

// Mock window.speechSynthesis and SpeechSynthesisUtterance
class MockSpeechSynthesisUtterance {
  text = '';
  lang = '';
  voice = null;
  onstart = null as any;
  onend = null as any;
  onerror = null as any;
  
  static lastInstance: MockSpeechSynthesisUtterance | null = null;

  constructor(text?: string) {
    this.text = text || '';
    MockSpeechSynthesisUtterance.lastInstance = this;
  }
}

const mockSpeechSynthesis = {
  speaking: false,
  getVoices: vi.fn().mockReturnValue([
    { name: 'Google US English', lang: 'en-US', default: true, localService: true, voiceURI: 'Google US English' }
  ]),
  speak: vi.fn((utterance: any) => {
    mockSpeechSynthesis.speaking = true;
    if (utterance.onstart) {
      utterance.onstart();
    }
    setTimeout(() => {
      mockSpeechSynthesis.speaking = false;
      if (utterance.onend) {
        utterance.onend();
      }
    }, 50);
  }),
  cancel: vi.fn(() => {
    mockSpeechSynthesis.speaking = false;
  }),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

global.window.speechSynthesis = mockSpeechSynthesis as any;
global.window.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance as any;

// Mock session/localStorage if not fully present or needed
if (typeof global.window.crypto === 'undefined') {
  global.window.crypto = {} as any;
}
if (typeof global.window.crypto.randomUUID === 'undefined') {
  global.window.crypto.randomUUID = () => '12345678-1234-1234-1234-1234567890ab';
}
export { MockSpeechRecognition, MockSpeechSynthesisUtterance, mockSpeechSynthesis };
