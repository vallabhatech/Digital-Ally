import { useState, useEffect, useCallback, useRef } from 'react';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);
  
  const updateVoices = useCallback(() => {
    if (synthRef.current) {
        setVoices(synthRef.current.getVoices());
    }
  }, []);

  useEffect(() => {
    const synth = synthRef.current;
    if (!synth) return;

    // Voices are loaded asynchronously.
    updateVoices();
    synth.addEventListener('voiceschanged', updateVoices);

    return () => {
      synth.removeEventListener('voiceschanged', updateVoices);
      // Make sure to cancel any ongoing speech when the component unmounts.
      if (synth.speaking) {
          synth.cancel();
      }
    };
  }, [updateVoices]);

  const speak = useCallback((text: string, lang: string) => {
    const synth = synthRef.current;
    if (!text || !synth) return;
    
    // Cancel any previous speech to prevent queueing and to stop current speech.
    if (synth.speaking) {
        synth.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find the best voice for the requested language
    const langPrefix = lang.split('-')[0];
    const matchingVoices = voices.filter(v => v.lang === lang || v.lang.startsWith(langPrefix));

    if (matchingVoices.length > 0) {
        // Prioritize voices with "Google" in the name as they are often higher quality.
        const googleVoice = matchingVoices.find(v => v.name.toLowerCase().includes('google'));
        utterance.voice = googleVoice || matchingVoices[0];
    } else {
        // If no specific voice is found, still set the lang property.
        // The browser's speech engine may have a default voice for the language.
        utterance.voice = null;
    }
    
    utterance.lang = lang;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
        // "interrupted" and "canceled" are expected errors when speech is manually stopped.
        // We should not log them to the console as they are part of the normal application flow.
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.error("SpeechSynthesis Error:", e.error);
        }
        setIsSpeaking(false);
    };
    
    // A brief timeout can prevent race-condition errors in some browsers.
    setTimeout(() => {
        synth.speak(utterance)
    }, 50);

  }, [voices]);

  const cancel = useCallback(() => {
    const synth = synthRef.current;
    if(synth && synth.speaking) {
        // The utterance's onend or onerror event will fire and handle setting isSpeaking to false.
        // This avoids race conditions with setting state manually.
        synth.cancel();
    }
  }, []);

  return { isSpeaking, speak, cancel };
};
