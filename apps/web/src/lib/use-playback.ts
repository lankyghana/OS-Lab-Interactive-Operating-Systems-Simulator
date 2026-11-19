'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'finished';

export const SPEEDS = [0.5, 1, 2, 4, 8] as const;

/**
 * Drives a visual simulation through `frameCount` precomputed frames.
 * Frame 0 is the initial state; the last frame is the final state.
 * Changing `resetKey` (e.g. the simulation result object) rewinds the player.
 */
export function usePlayback(frameCount: number, resetKey: unknown, onStart?: () => void) {
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<PlaybackStatus>('idle');
  const [speed, setSpeed] = useState<number>(1);
  const last = Math.max(0, frameCount - 1);
  const started = useRef(false);

  // A new simulation (different frame count / inputs) resets the player.
  useEffect(() => {
    setIndex(0);
    setStatus('idle');
    started.current = false;
  }, [frameCount, resetKey]);

  useEffect(() => {
    if (status !== 'playing') return;
    const id = window.setInterval(() => {
      setIndex((i) => {
        if (i >= last) {
          setStatus('finished');
          return i;
        }
        return i + 1;
      });
    }, 900 / speed);
    return () => window.clearInterval(id);
  }, [status, speed, last]);

  useEffect(() => {
    if (status === 'playing' && index >= last) setStatus('finished');
  }, [index, last, status]);

  const markStarted = useCallback(() => {
    if (!started.current) {
      started.current = true;
      onStart?.();
    }
  }, [onStart]);

  return {
    index,
    status,
    speed,
    last,
    setSpeed,
    start: () => {
      markStarted();
      if (index >= last) setIndex(0);
      setStatus('playing');
    },
    pause: () => setStatus('paused'),
    resume: () => setStatus(index >= last ? 'finished' : 'playing'),
    step: () => {
      markStarted();
      setIndex((i) => Math.min(last, i + 1));
      setStatus(index + 1 >= last ? 'finished' : 'paused');
    },
    back: () => {
      setIndex((i) => Math.max(0, i - 1));
      setStatus('paused');
    },
    reset: () => {
      setIndex(0);
      setStatus('idle');
    },
    seek: (i: number) => {
      setIndex(Math.max(0, Math.min(last, i)));
      setStatus(i >= last ? 'finished' : 'paused');
    },
  };
}

export type Playback = ReturnType<typeof usePlayback>;
