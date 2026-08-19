import { Flame, Check } from 'lucide-react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { TodoItem, TodoList } from '@shared/types';

export type VitalTodoEntry = { todo: TodoItem; list: TodoList };

interface VitalTaskHeroProps {
  entries: VitalTodoEntry[];
  totalVitalCount: number;
  selectedTodoId?: string | null;
  onSelect: (todo: TodoItem, list: TodoList) => void;
  onToggleComplete: (id: string) => void;
}

function formatDueDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = dayjs(iso);
  return d.isValid() ? d.format('MMM D, YYYY') : null;
}

function VitalTaskHero({
  entries,
  totalVitalCount,
  selectedTodoId,
  onSelect,
  onToggleComplete,
}: VitalTaskHeroProps) {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return null;
  }

  const showFocusWarning = totalVitalCount > 5;

  return (
    <div className="mb-6" data-testid="vital-task-hero">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-triadic-orange" />
        <h2 className="text-sm font-bold uppercase tracking-wide text-dark-bg">
          {t('vitalTask.ruleOfThreeTitle')}
        </h2>
      </div>

      {showFocusWarning && (
        <p
          role="status"
          className="mb-3 rounded-lg border border-triadic-orange/40 bg-triadic-orange/10 px-3 py-2 text-xs text-dark-bg"
          data-testid="vital-focus-warning"
        >
          {t('vitalTask.focusWarning', { count: totalVitalCount })}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {entries.map(({ todo, list }) => {
          const due = formatDueDate(todo.dueDate);
          return (
            <div
              key={todo.id}
              className={`flex flex-col gap-3 rounded-xl border bg-white p-4 cursor-pointer transition-shadow ${
                selectedTodoId === todo.id
                  ? 'shadow-md border-triadic-orange'
                  : 'border-secondary-bg'
              }`}
              onClick={() => onSelect(todo, list)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSelect(todo, list);
              }}
              data-testid={'vital-task-card-' + todo.id}
            >
              <span className="inline-flex w-fit items-center rounded-full bg-triadic-orange/10 px-2 py-0.5 text-[11px] font-semibold text-triadic-orange">
                {t('vitalTask.goalLabel', { list: list.name })}
              </span>
              <p className="font-semibold text-dark-bg leading-snug">
                {todo.name}
              </p>
              {todo.notes && (
                <p className="text-xs text-secondary-dark-bg line-clamp-2">
                  {todo.notes}
                </p>
              )}
              {due && (
                <p className="text-xs text-secondary-dark-bg mt-auto">
                  {t('todoList.due')} {due}
                </p>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleComplete(todo.id);
                }}
                className="flex items-center justify-center gap-1 self-start rounded-lg border border-secondary-bg px-2.5 py-1 text-xs font-medium text-dark-bg hover:border-triadic-orange hover:text-triadic-orange transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                {t('vitalTask.markDone')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VitalTaskHero;
