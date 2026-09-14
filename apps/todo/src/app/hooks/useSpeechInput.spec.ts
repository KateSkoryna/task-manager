import { act, renderHook } from '@testing-library/react';
import { useSpeechInput } from './useSpeechInput';

type Listener<T> = ((event: T) => void) | null;

class FakeSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = '';
  onresult: Listener<{
    results: ArrayLike<{ [i: number]: { transcript: string } }>;
  }> = null;
  onerror: Listener<{ error: string }> = null;
  onend: (() => void) | null = null;

  start = jest.fn();
  stop = jest.fn(() => {
    this.onend?.();
  });

  emitResult(transcripts: string[]) {
    this.onresult?.({
      results: transcripts.map((transcript) => ({ 0: { transcript } })),
    });
  }

  emitError(error: string) {
    this.onerror?.({ error });
  }
}

let lastInstance: FakeSpeechRecognition | null = null;

function installFakeSpeechRecognition() {
  lastInstance = null;
  (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition =
    jest.fn().mockImplementation(() => {
      lastInstance = new FakeSpeechRecognition();
      return lastInstance;
    });
}

function removeSpeechRecognition() {
  delete (window as unknown as { SpeechRecognition?: unknown })
    .SpeechRecognition;
  delete (window as unknown as { webkitSpeechRecognition?: unknown })
    .webkitSpeechRecognition;
}

describe('useSpeechInput', () => {
  afterEach(() => {
    removeSpeechRecognition();
  });

  test('reports unsupported when neither SpeechRecognition constructor exists', () => {
    removeSpeechRecognition();
    const { result } = renderHook(() => useSpeechInput());
    expect(result.current.isSupported).toBe(false);
  });

  test('reports supported and starts listening', () => {
    installFakeSpeechRecognition();
    const { result } = renderHook(() => useSpeechInput());
    expect(result.current.isSupported).toBe(true);

    act(() => result.current.start());

    expect(result.current.isListening).toBe(true);
    expect(lastInstance?.start).toHaveBeenCalledTimes(1);
  });

  test('feeds interim and final results into transcript', () => {
    installFakeSpeechRecognition();
    const { result } = renderHook(() => useSpeechInput());

    act(() => result.current.start());
    act(() => lastInstance?.emitResult(['add milk to ']));
    expect(result.current.transcript).toBe('add milk to ');

    act(() => lastInstance?.emitResult(['add milk to the list']));
    expect(result.current.transcript).toBe('add milk to the list');
  });

  test('stop ends the session', () => {
    installFakeSpeechRecognition();
    const { result } = renderHook(() => useSpeechInput());

    act(() => result.current.start());
    act(() => result.current.stop());

    expect(lastInstance?.stop).toHaveBeenCalledTimes(1);
    expect(result.current.isListening).toBe(false);
  });

  test('surfaces permission-denied distinctly from no-speech', () => {
    installFakeSpeechRecognition();
    const { result, rerender } = renderHook(() => useSpeechInput());

    act(() => result.current.start());
    act(() => lastInstance?.emitError('not-allowed'));
    expect(result.current.error).toBe('permission-denied');

    rerender();
    act(() => result.current.start());
    act(() => lastInstance?.emitError('no-speech'));
    expect(result.current.error).toBe('no-speech');
  });

  test('unrecognized errors fall back to unknown', () => {
    installFakeSpeechRecognition();
    const { result } = renderHook(() => useSpeechInput());

    act(() => result.current.start());
    act(() => lastInstance?.emitError('audio-capture'));
    expect(result.current.error).toBe('unknown');
  });
});
