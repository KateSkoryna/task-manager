import { useCallback, useEffect, useRef, useState } from 'react';

export type SpeechInputError = 'permission-denied' | 'no-speech' | 'unknown';

interface UseSpeechInputResult {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  start: () => void;
  stop: () => void;
  error: SpeechInputError | null;
}

// The Web Speech API isn't part of TypeScript's DOM lib (it's still
// non-standard), so these are the minimal shapes this hook actually uses
// rather than a full ambient declaration.
interface SpeechRecognitionResultLike {
  [index: number]: { transcript: string };
}
interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionConstructorLike = new () => SpeechRecognitionLike;

const getSpeechRecognitionCtor = ():
  | SpeechRecognitionConstructorLike
  | undefined => {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

const toSpeechInputError = (rawError: string): SpeechInputError => {
  if (rawError === 'not-allowed' || rawError === 'permission-denied') {
    return 'permission-denied';
  }
  if (rawError === 'no-speech') return 'no-speech';
  return 'unknown';
};

/**
 * Wraps `SpeechRecognition` (Chrome/Safari; Firefox has no implementation)
 * so voice input feeds the same text the keyboard produces — the chat
 * composer never needs to know whether text arrived by typing or speech.
 */
export function useSpeechInput(): UseSpeechInputResult {
  const isSupported = getSpeechRecognitionCtor() != null;
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<SpeechInputError | null>(null);

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current;
      if (!recognition) return;
      // Detach handlers first — `stop()` only requests a stop, the browser
      // fires `onend` (and possibly a final `onresult`) asynchronously
      // afterward, which would otherwise call these setters post-unmount.
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
    };
  }, []);

  const start = useCallback(() => {
    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor || recognitionRef.current) return;

    setError(null);
    setTranscript('');

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language;

    recognition.onresult = (event) => {
      let combined = '';
      for (let i = 0; i < event.results.length; i++) {
        combined += event.results[i][0].transcript;
      }
      setTranscript(combined);
    };

    recognition.onerror = (event) => {
      setError(toSpeechInputError(event.error));
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { isSupported, isListening, transcript, start, stop, error };
}
