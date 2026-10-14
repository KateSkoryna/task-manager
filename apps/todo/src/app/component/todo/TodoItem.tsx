import { useTranslation } from 'react-i18next';
import { TodoItem as TodoItemType, TodoStatus } from '@shared/types';
import Card from '../elements/Card';
import Badge from '../elements/Badge';
import CompletionCheckbox from '../elements/CompletionCheckbox';
import MoveToListSelect, { AvailableList } from './MoveToListSelect';
import { formatDueDate } from '../../lib/formatDueDate';
import { resolveLocale } from '../../lib/locale';

interface TodoItemProps {
  todo: TodoItemType;
  isSelected?: boolean;
  onSelect?: () => void;
  /** Completes the task, or undoes it, without opening the edit panel. */
  onToggleComplete?: () => void;
  currentListId?: string | null;
  availableLists?: AvailableList[];
  onMoveToList?: (todolistId: string | null) => void;
  hideDueDate?: boolean;
}

// `todo.status` values map onto the redesign's status roles: 'pending' is
// shown to users as "in progress", 'successful' as "completed", and
// 'failed' as "not started" — see tasks.status_* translation strings.
export const STATUS_LABEL_KEYS: Record<TodoStatus, string> = {
  pending: 'tasks.status_pending',
  successful: 'tasks.status_successful',
  failed: 'tasks.status_failed',
};

export const STATUS_TEXT: Record<TodoStatus, string> = {
  pending: 'text-status-progress',
  successful: 'text-status-complete',
  failed: 'text-status-open',
};

function TodoItem({
  todo,
  isSelected,
  onSelect,
  onToggleComplete,
  currentListId,
  availableLists,
  onMoveToList,
  hideDueDate,
}: TodoItemProps) {
  const { t, i18n } = useTranslation();

  return (
    <Card
      variant="nested"
      selected={isSelected}
      className="cursor-pointer overflow-hidden"
      dataTestId={'todo-item-' + todo.id}
      // A click anywhere on the card opens the task. Keyboard and screen
      // reader users get the title button below, whose click bubbles up here.
      onClick={() => onSelect?.()}
      role="presentation"
    >
      <div className="flex flex-col gap-2">
        {/* Row 1: name + selected pill + priority */}
        <div className="flex items-center gap-3">
          {onToggleComplete && (
            <CompletionCheckbox
              completed={todo.status === 'successful'}
              label={t(
                todo.status === 'successful'
                  ? 'dashboard.markNotCompleted'
                  : 'dashboard.markCompleted',
                { name: todo.name }
              )}
              onToggle={onToggleComplete}
            />
          )}
          <button
            type="button"
            className={`flex-1 min-w-0 line-clamp-2 break-words text-left text-card-mobile font-bold leading-snug focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              todo.status === 'successful' ? 'text-muted' : 'text-primary'
            }`}
          >
            {todo.name}
          </button>
          {isSelected && (
            <span className="shrink-0 inline-flex items-center rounded-full bg-action text-on-action text-metadata font-bold uppercase tracking-wide px-2.5 py-1">
              {t('tasks.selected')}
            </span>
          )}
          <Badge tone={`priority-${todo.priority}`} className="shrink-0">
            {t(`tasks.priority_${todo.priority}`)}
          </Badge>
        </div>

        {todo.notes && (
          <p className="text-body text-muted truncate">{todo.notes}</p>
        )}

        {/* Row 2: image */}
        {todo.image && (
          <div className="flex justify-end">
            <img
              src={todo.image}
              alt="Attached"
              className="h-16 w-16 object-cover rounded-control"
            />
          </div>
        )}

        {/* Row 4: move-to-list control, due date */}
        <div className="flex flex-nowrap items-center gap-x-1.5 xl:gap-x-3">
          {onMoveToList && (
            <div
              className="w-40 shrink-0 md:w-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <MoveToListSelect
                value={currentListId ?? null}
                availableLists={availableLists ?? []}
                onChange={onMoveToList}
              />
            </div>
          )}
          <div className="ml-auto flex min-w-0 items-center gap-2 text-small text-muted">
            {todo.dueDate && !hideDueDate && (
              <span className="flex shrink-0 items-center gap-1">
                <span className="hidden xl:inline">{t('tasks.due')} </span>
                <span className="tabular-nums">
                  {formatDueDate(
                    todo.dueDate,
                    new Date(),
                    resolveLocale(i18n.language),
                    t
                  )}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default TodoItem;
