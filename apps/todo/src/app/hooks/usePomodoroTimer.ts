import { useEffect, useState } from 'react';

export type PomodoroPhase = 'work' | 'break';
export type PomodoroStatus = 'idle' | 'running' | 'paused';

export const DEFAULT_WORK_MINUTES = 25;
export const WORK_SECONDS = DEFAULT_WORK_MINUTES * 60;
export const BREAK_SECONDS = 5 * 60;

interface UsePomodoroTimerResult {
  phase: PomodoroPhase;
  status: PomodoroStatus;
  secondsLeft: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

export function usePomodoroTimer(
  workSeconds: number = WORK_SECONDS,
  onPhaseComplete?: (completedPhase: PomodoroPhase) => void
): UsePomodoroTimerResult {
  const [phase, setPhase] = useState<PomodoroPhase>('work');
  const [status, setStatus] = useState<PomodoroStatus>('idle');
  const [secondsLeft, setSecondsLeft] = useState(workSeconds);

  // Pure countdown: only ever decrements, never triggers side effects itself.
  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  // Phase transition runs as its own effect (not inside the tick updater)
  // so the completion callback fires exactly once per phase, even under
  // StrictMode's double-invoke.
  useEffect(() => {
    if (status !== 'running' || secondsLeft !== 0) return;
    const completedPhase = phase;
    const nextPhase: PomodoroPhase = phase === 'work' ? 'break' : 'work';
    onPhaseComplete?.(completedPhase);
    setPhase(nextPhase);
    setSecondsLeft(nextPhase === 'work' ? workSeconds : BREAK_SECONDS);
  }, [secondsLeft, status, phase, onPhaseComplete, workSeconds]);

  // Before the first start (or after a reset), keep the displayed duration
  // in sync with the chosen work length rather than only applying it on the
  // next reset.
  useEffect(() => {
    if (status !== 'idle') return;
    setSecondsLeft(workSeconds);
  }, [workSeconds, status]);

  function start() {
    setStatus('running');
  }

  function pause() {
    setStatus('paused');
  }

  function reset() {
    setStatus('idle');
    setPhase('work');
    setSecondsLeft(workSeconds);
  }

  return { phase, status, secondsLeft, start, pause, reset };
}
