import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  usePomodoroTimer,
  WORK_SECONDS,
  PomodoroPhase,
} from '../../hooks/usePomodoroTimer';
import Button from '../elements/Button';

const MIN_TOTAL_SECONDS = 60;
const MAX_MINUTES = 180;
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
  const { phase, status, secondsLeft, start, pause, reset } = usePomodoroTimer(
    workSeconds,
    onPhaseComplete
  );

  function openEditor() {
    if (status !== 'idle') return;
    setDraftMinutes(Math.floor(workSeconds / 60));
    setDraftSeconds(workSeconds % 60);
    setIsEditingDuration(true);
  }

  function commitEditor() {
    const minutes = clamp(draftMinutes, 0, MAX_MINUTES);
    const seconds = clamp(draftSeconds, 0, MAX_SECONDS_PART);
    const total = Math.max(MIN_TOTAL_SECONDS, minutes * 60 + seconds);
    setWorkSeconds(total);
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
        className={`h-14 flex items-center justify-center my-2 ${
          !isEditingDuration && status === 'idle'
            ? 'cursor-pointer hover:opacity-70 transition-opacity'
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
              setDraftMinutes(Number(e.target.value.replace(/\D/g, '')) || 0)
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
              setDraftSeconds(Number(e.target.value.replace(/\D/g, '')) || 0)
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
            onClick={start}
            className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-accent text-dark-bg hover:opacity-90 transition-opacity"
          >
            {t('pomodoro.start')}
          </Button>
        )}
        <Button
          onClick={reset}
          className="px-4 py-1.5 text-sm font-semibold rounded-lg border border-secondary-bg text-dark-bg hover:border-triadic-orange hover:text-triadic-orange transition-colors"
        >
          {t('pomodoro.reset')}
        </Button>
      </div>
    </div>
  );
}

export default PomodoroTimer;
