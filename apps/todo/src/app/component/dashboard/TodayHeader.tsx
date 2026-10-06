import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { mergeClassNames } from '../../lib/classNames';

type Mood = 'empty' | 'overdue' | 'progress' | 'done';

interface TodayHeaderProps {
  done: number;
  total: number;
  overdue: number;
  onAddTask: () => void;
}

function moodFor({
  done,
  total,
  overdue,
}: Pick<TodayHeaderProps, 'done' | 'total' | 'overdue'>): Mood {
  if (overdue > 0) return 'overdue';
  if (total === 0) return 'empty';
  return done === total ? 'done' : 'progress';
}

// The band is the page's mood: dark while there is work left, accent once
// everything due today is completed.
type BandPart = 'band' | 'message' | 'track' | 'fill' | 'button';

const BAND_CLASSES: Record<'working' | 'done', Record<BandPart, string>> = {
  working: {
    band: 'bg-sidebar text-sidebar-text',
    message: 'text-sidebar-muted',
    track: 'bg-sidebar-text/20',
    fill: 'bg-accent',
    button: 'bg-accent text-on-accent',
  },
  done: {
    band: 'bg-accent text-on-accent',
    message: 'text-on-accent/80',
    track: 'bg-on-accent/20',
    fill: 'bg-on-accent',
    button: 'bg-on-accent text-accent',
  },
};

function TodayHeader({ done, total, overdue, onAddTask }: TodayHeaderProps) {
  const { t } = useTranslation();
  const mood = moodFor({ done, total, overdue });
  const classes = BAND_CLASSES[mood === 'done' ? 'done' : 'working'];
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const messages: Record<Mood, string> = {
    empty: t('dashboard.moodEmpty'),
    overdue: t('dashboard.moodOverdue', { count: overdue }),
    progress: t('dashboard.moodProgress', { count: total - done }),
    done: t('dashboard.moodDone'),
  };

  return (
    <section
      className={mergeClassNames(
        'flex flex-col gap-4 rounded-xl p-5 transition-colors sm:flex-row sm:items-center',
        classes.band
      )}
      data-testid="today-header"
      data-mood={mood}
    >
      <div className="min-w-0 flex-1">
        <h3 className="text-2xl font-bold leading-none">
          {t('dashboard.todayTitle')}
        </h3>
        <p className={mergeClassNames('mt-2 text-sm', classes.message)}>
          {messages[mood]}
        </p>
        {total > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={done}
              aria-label={t('dashboard.progressLine', { done, total })}
              className={mergeClassNames(
                'h-2 flex-1 overflow-hidden rounded-full',
                classes.track
              )}
            >
              <div
                className={mergeClassNames(
                  'h-full rounded-full transition-all',
                  classes.fill
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="shrink-0 text-sm font-semibold">
              {t('dashboard.progressLine', { done, total })}
            </span>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onAddTask}
        data-testid="today-add-task-button"
        className={mergeClassNames(
          'inline-flex shrink-0 items-center justify-center gap-2 rounded-control px-4 py-2 font-bold transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          classes.button
        )}
      >
        <Plus className="h-4 w-4" />
        {t('todoList.addTask')}
      </button>
    </section>
  );
}

export default TodayHeader;
