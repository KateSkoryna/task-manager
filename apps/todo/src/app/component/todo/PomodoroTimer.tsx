import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import {
  usePomodoroTimer,
  WORK_SECONDS,
  PomodoroPhase,
} from '../../hooks/usePomodoroTimer';
import { playChime } from '../../lib/pomodoroSound';
import {
  requestNotificationPermission,
  showOsNotification,
} from '../../lib/pomodoroNotifications';
import Button from '../elements/Button';

const BANNER_DISMISS_MS = 6000;

interface PhaseCompleteBanner {
  title: string;
  body: string;
}

const MIN_TOTAL_SECONDS = 10;
const MAX_MINUTES = 99;
const MAX_SECONDS_PART = 59;

interface PomodoroTimerProps {
  taskName: string;
  onPhaseComplete?: (completedPhase: PomodoroPhase) => void;
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function PomodoroTimer({ taskName, onPhaseComplete }: PomodoroTimerProps) {
  const { t } = useTranslation();
  const [workSeconds, setWorkSeconds] = useState(WORK_SECONDS);
  const [isEditingDuration, setIsEditingDuration] = useState(false);
  const [draftMinutes, setDraftMinutes] = useState(
    Math.floor(WORK_SECONDS / 60)
  );
  const [draftSeconds, setDraftSeconds] = useState(WORK_SECONDS % 60);
  const [banner, setBanner] = useState<PhaseCompleteBanner | null>(null);

  function handlePhaseComplete(completedPhase: PomodoroPhase) {
    playChime();
    const title =
      completedPhase === 'work'
        ? t('pomodoro.notifyWorkDoneTitle')
        : t('pomodoro.notifyBreakDoneTitle');
    const body =
      completedPhase === 'work'
        ? t('pomodoro.notifyWorkDoneBody', { taskName })
        : t('pomodoro.notifyBreakDoneBody', { taskName });

    // The OS can silently swallow a granted notification (Do Not Disturb,
    // system-level notification settings for the browser, etc.), so the
    // in-app banner always shows too rather than only as a fallback.
    showOsNotification(title, body);
    setBanner({ title, body });
    onPhaseComplete?.(completedPhase);
  }

  const { phase, status, secondsLeft, start, pause, reset } = usePomodoroTimer(
    workSeconds,
    handlePhaseComplete
  );

  useEffect(() => {
    if (!banner) return;
    const id = setTimeout(() => setBanner(null), BANNER_DISMISS_MS);
    return () => clearTimeout(id);
  }, [banner]);

  // While the duration editor is open, validity is based on what's currently
  // typed — not the last committed value — so the Start button reacts as the
  // user types instead of waiting for Enter/blur to commit.
  const currentDurationSeconds = isEditingDuration
    ? draftMinutes * 60 + draftSeconds
    : workSeconds;
  const isBelowMinDuration = currentDurationSeconds < MIN_TOTAL_SECONDS;

  const [pendingStart, setPendingStart] = useState(false);

  // Starting mid-edit commits the draft first; secondsLeft only syncs to the
  // newly committed workSeconds once idle, so starting is deferred until
  // that sync has happened rather than racing it in the same update.
  useEffect(() => {
    if (!pendingStart) return;
    if (status !== 'idle' || secondsLeft !== workSeconds) return;
    setPendingStart(false);
    requestNotificationPermission();
    start();
  }, [pendingStart, status, secondsLeft, workSeconds, start]);

  function handleStart() {
    if (isBelowMinDuration) return;
    if (isEditingDuration) {
      commitEditor();
      setPendingStart(true);
    } else {
      requestNotificationPermission();
      start();
    }
  }

  function handleReset() {
    setIsEditingDuration(false);
    setPendingStart(false);
    setWorkSeconds(WORK_SECONDS);
    reset();
  }

  function openEditor() {
    if (status !== 'idle') return;
    setDraftMinutes(Math.floor(workSeconds / 60));
    setDraftSeconds(workSeconds % 60);
    setIsEditingDuration(true);
  }

  function commitEditor() {
    const minutes = clamp(draftMinutes, 0, MAX_MINUTES);
    const seconds = clamp(draftSeconds, 0, MAX_SECONDS_PART);
    setWorkSeconds(minutes * 60 + seconds);
    setIsEditingDuration(false);
  }

  function handleEditorKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEditor();
    } else if (e.key === 'Escape') {
      setIsEditingDuration(false);
    }
  }

  function handleEditorBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      commitEditor();
    }
  }

  return (
    <div
      className="rounded-xl border border-secondary-bg bg-white p-4 mb-4"
      data-testid="pomodoro-timer"
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <span
          className={`text-xs font-bold uppercase tracking-wide ${
            phase === 'work' ? 'text-triadic-orange' : 'text-triadic-blue'
          }`}
        >
          {phase === 'work'
            ? t('pomodoro.workPhase')
            : t('pomodoro.breakPhase')}
        </span>
        <span
          className="text-xs text-secondary-dark-bg truncate"
          title={taskName}
        >
          {taskName}
        </span>
      </div>

      <div
        className={`h-14 flex items-center justify-center my-2 rounded-lg transition-colors ${
          !isEditingDuration && status === 'idle'
            ? 'cursor-pointer hover:bg-accent/10'
            : ''
        }`}
        onClick={!isEditingDuration ? openEditor : undefined}
        onBlur={isEditingDuration ? handleEditorBlur : undefined}
        data-testid="pomodoro-time"
        title={
          !isEditingDuration && status === 'idle'
            ? t('pomodoro.editHint')
            : undefined
        }
      >
        {isEditingDuration ? (
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={draftMinutes.toString().padStart(2, '0')}
            onChange={(e) =>
              setDraftMinutes(
                clamp(
                  Number(e.target.value.replace(/\D/g, '')) || 0,
                  0,
                  MAX_MINUTES
                )
              )
            }
            onKeyDown={handleEditorKeyDown}
            autoFocus
            className="w-14 px-0 text-4xl font-bold text-dark-bg text-center tabular-nums focus:outline-none"
            data-testid="pomodoro-minutes-input"
            aria-label={t('pomodoro.minutesLabel')}
          />
        ) : (
          <span className="w-14 text-4xl font-bold text-dark-bg text-center tabular-nums">
            {Math.floor(secondsLeft / 60)
              .toString()
              .padStart(2, '0')}
          </span>
        )}
        <span className="text-4xl font-bold text-dark-bg -translate-y-0.5">
          :
        </span>
        {isEditingDuration ? (
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={draftSeconds.toString().padStart(2, '0')}
            onChange={(e) =>
              setDraftSeconds(
                clamp(
                  Number(e.target.value.replace(/\D/g, '')) || 0,
                  0,
                  MAX_SECONDS_PART
                )
              )
            }
            onKeyDown={handleEditorKeyDown}
            className="w-14 px-0 text-4xl font-bold text-dark-bg text-center tabular-nums focus:outline-none"
            data-testid="pomodoro-seconds-input"
            aria-label={t('pomodoro.secondsLabel')}
          />
        ) : (
          <span className="w-14 text-4xl font-bold text-dark-bg text-center tabular-nums">
            {(secondsLeft % 60).toString().padStart(2, '0')}
          </span>
        )}
      </div>

      <div className="flex items-center justify-center gap-2">
        {status === 'running' ? (
          <Button
            onClick={pause}
            className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-accent text-dark-bg hover:opacity-90 transition-opacity"
          >
            {t('pomodoro.pause')}
          </Button>
        ) : (
          <Button
            onClick={handleStart}
            disabled={isBelowMinDuration}
            dataTestId="pomodoro-start"
            className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-accent text-dark-bg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40"
          >
            {t('pomodoro.start')}
          </Button>
        )}
        <Button
          onClick={handleReset}
          className="px-4 py-1.5 text-sm font-semibold rounded-lg border border-secondary-bg text-dark-bg hover:border-triadic-orange hover:text-triadic-orange transition-colors"
        >
          {t('pomodoro.reset')}
        </Button>
      </div>

      {isBelowMinDuration && status === 'idle' && (
        <p className="mt-2 text-center text-xs text-triadic-orange">
          {t('pomodoro.minDurationHint', { seconds: MIN_TOTAL_SECONDS })}
        </p>
      )}

      {banner && (
        <div
          role="status"
          data-testid="pomodoro-banner"
          className="mt-3 flex items-start justify-between gap-2 rounded-lg bg-accent px-3 py-2 text-sm text-dark-bg"
        >
          <div>
            <p className="font-semibold">{banner.title}</p>
            <p>{banner.body}</p>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            aria-label={t('pomodoro.dismiss')}
            className="shrink-0 hover:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default PomodoroTimer;
