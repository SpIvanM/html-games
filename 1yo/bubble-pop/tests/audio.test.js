import { describe, it, expect, beforeEach, vi } from 'vitest';
import { playSound } from '../src/audio.js';

describe('Audio functionality', () => {
  beforeEach(() => {
    // Mock AudioContext
    window.AudioContext = window.AudioContext || vi.fn().mockImplementation(() => ({
      createOscillator: vi.fn().mockReturnValue({
        type: 'sine',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn()
      }),
      createGain: vi.fn().mockReturnValue({
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        connect: vi.fn()
      }),
      destination: {},
      currentTime: 0
    }));
  });

  it('should play a sound without errors', () => {
    expect(() => playSound('pop')).not.toThrow();
  });
});
