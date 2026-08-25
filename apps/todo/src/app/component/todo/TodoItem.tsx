import { useEffect } from 'react';
import { Check, Pencil, ChevronUp, ChevronDown } from 'lucide-react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import {
  TodoItem as TodoItemType,
  TodoStatus,
  TodoListPriority,
} from '@shared/types';
import Card from '../elements/Card';
import Badge from '../elements/Badge';
import MoveToListSelect, { AvailableList } from './MoveToListSelect';
import { isDueWithinHours } from '../../lib/urgency';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface TodoItemProps {
  todo: TodoItemType;
  listPriority?: TodoListPriority;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  currentListId?: string | null;
  availableLists?: AvailableList[];
  onMoveToList?: (todolistId: string | null) => void;
}

// `todo.status` values map onto the redesign's status roles: 'pending' is
// shown to users as "in progress", 'successful' as "completed", and
// 'failed' as "not started" — see tasks.status_* translation strings.
const STATUS_MARKER: Record<TodoStatus, string> = {
  pending: 'border-2 border-status-progress bg-transparent',
  successful: 'bg-status-complete ring-2 ring-inset ring-surface',
  failed: 'border border-dashed border-status-open bg-transparent',
};

const STATUS_LABEL_KEYS: Record<TodoStatus, string> = {
  pending: 'tasks.status_pending',
  successful: 'tasks.status_successful',
  failed: 'tasks.status_failed',
};

const STATUS_TEXT: Record<TodoStatus, string> = {
  pending: 'text-status-progress',
  successful: 'text-status-complete',
  failed: 'text-status-open',
};

function TodoItem({
  todo,
  listPriority,
  isSelected,
  onSelect,
  onEdit,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  currentListId,
  availableLists,
  onMoveToList,
}: TodoItemProps) {
  const { t } = useTranslation();
  const statusLabel = t(STATUS_LABEL_KEYS[todo.status]);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isUrgent = todo.status === 'pending' && isDueWithinHours(todo.dueDate);

  useEffect(() => {
    // auto-fail overdue items is handled server-side / via edit panel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todo.id]);

  return (
    <Card
      selected={isSelected}
      className="cursor-pointer overflow-hidden transition-colors"
      dataTestId={'todo-item-' + todo.id}
      onClick={() => onSelect?.()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect?.();
      }}
    >
      <div className="flex flex-col gap-2">
        {/* Row 1: status marker + name + edit btn */}
        <div className="flex items-center gap-3">
          <div
            role="img"
            aria-label={statusLabel}
            className={`flex size-status-marker items-center justify-center rounded-full shrink-0 ${
              STATUS_MARKER[todo.status]
            }`}
          >
            {todo.status === 'successful' && (
              <Check className="h-3.5 w-3.5 text-surface" strokeWidth={3} />
            )}
          </div>
          <p
            className={`flex-1 min-w-0 font-semibold text-primary leading-snug ${
              todo.status === 'successful' ? 'line-through text-muted' : ''
            }`}
          >
            {todo.name}
          </p>
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="shrink-0 p-1 text-muted hover:text-primary transition-colors rounded"
              aria-label="Edit task"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>

        {/* Row 2: image */}
        {todo.image && (
          <div className="flex justify-end mt-2">
            <img
              src={todo.image}
              alt="Attached"
              className="h-16 w-16 object-cover rounded"
            />
          </div>
        )}

        {/* Row 3: priority, status, due date */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
          {listPriority && (
            <Badge tone={`priority-${listPriority}`}>
              {listPriority.charAt(0).toUpperCase() + listPriority.slice(1)}
            </Badge>
          )}
          <span className="text-xs text-muted">
            {t('tasks.status')}:{' '}
            <span className={`font-medium ${STATUS_TEXT[todo.status]}`}>
              {statusLabel}
            </span>
          </span>
          {todo.dueDate && (
            <span
              className={`flex items-center gap-1 text-xs ml-auto ${
                isUrgent ? 'text-danger font-semibold' : 'text-muted'
              }`}
            >
              {isUrgent && (
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full bg-danger ${
                    prefersReducedMotion ? '' : 'animate-pulse'
                  }`}
                />
              )}
              Due: {dayjs(todo.dueDate).format('DD/MM/YYYY')}
              {isUrgent && (
                <span className="rounded-full bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-danger">
                  {t('tasks.dueSoon')}
                </span>
              )}
            </span>
          )}
        </div>

        {/* Row 4: reorder + move-to-list controls */}
        {(onMoveUp || onMoveDown || onMoveToList) && (
          <div
            className="flex items-center gap-2 mt-1"
            onClick={(e) => e.stopPropagation()}
          >
            {(onMoveUp || onMoveDown) && (
              <div className="flex items-center border border-default rounded-inner overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={onMoveUp}
                  disabled={!canMoveUp}
                  aria-label={t('tasks.moveUp')}
                  className="p-1 text-muted hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={onMoveDown}
                  disabled={!canMoveDown}
                  aria-label={t('tasks.moveDown')}
                  className="p-1 text-muted hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors border-l border-default"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            )}
            {onMoveToList && (
              <MoveToListSelect
                value={currentListId ?? null}
                availableLists={availableLists ?? []}
                onChange={onMoveToList}
              />
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export default TodoItem;
