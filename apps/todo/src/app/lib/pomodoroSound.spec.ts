import { playChime } from './pomodoroSound';

describe('playChime', () => {
  afterEach(() => {
    delete (global as { AudioContext?: unknown }).AudioContext;
  });

  test('does nothing when the Web Audio API is unavailable', () => {
    expect(() => playChime()).not.toThrow();
  });

  test('plays two oscillator tones through an AudioContext when available', () => {
    const oscillator = {
      type: '',
      frequency: { value: 0 },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };
    const gain = {
      gain: {
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
      },
      connect: jest.fn(),
    };
    const ctx = {
      currentTime: 0,
      destination: {},
      createOscillator: jest.fn().mockReturnValue(oscillator),
      createGain: jest.fn().mockReturnValue(gain),
      close: jest.fn(),
    };
    const AudioContextMock = jest.fn().mockImplementation(() => ctx);
    (global as { AudioContext?: unknown }).AudioContext = AudioContextMock;

    playChime();

    expect(AudioContextMock).toHaveBeenCalledTimes(1);
    expect(ctx.createOscillator).toHaveBeenCalledTimes(2);
    expect(oscillator.start).toHaveBeenCalledTimes(2);
    expect(oscillator.stop).toHaveBeenCalledTimes(2);
  });
});
