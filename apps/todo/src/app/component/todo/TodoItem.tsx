import { useEffect } from 'react';
import { ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { TodoItem as TodoItemType, TodoStatus } from '@shared/types';
import Card from '../elements/Card';
import Badge from '../elements/Badge';
import MoveToListSelect, { AvailableList } from './MoveToListSelect';
import { isDueWithinHours } from '../../lib/urgency';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface TodoItemProps {
  todo: TodoItemType;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  currentListId?: string | null;
  availableLists?: AvailableList[];
  onMoveToList?: (todolistId: string | null) => void;
  hideDueDate?: boolean;
}

// `todo.status` values map onto the redesign's status roles: 'pending' is
// shown to users as "in progress", 'successful' as "completed", and
// 'failed' as "not started" — see tasks.status_* translation strings.
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
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  currentListId,
  availableLists,
  onMoveToList,
  hideDueDate,
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
      variant="nested"
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
        {/* Row 1: name + selected pill + edit btn */}
        <div className="flex items-center gap-3">
          <p
            className={`flex-1 min-w-0 truncate font-semibold text-primary leading-snug ${
              todo.status === 'successful' ? 'line-through text-muted' : ''
            }`}
          >
            {todo.name}
          </p>
          {isSelected && (
            <span className="shrink-0 inline-flex items-center rounded-full bg-accent text-on-accent text-[0.625rem] font-bold uppercase tracking-wide px-2.5 py-1">
              {t('tasks.selected')}
            </span>
          )}
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1 lg:gap-3 shrink-0">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  aria-label={t('tasks.edit')}
                  className="flex items-center justify-center p-1.5 text-muted border border-default rounded-md hover:text-primary hover:border-primary transition-colors shrink-0"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  aria-label={t('tasks.delete')}
                  className="flex items-center justify-center p-1.5 text-muted border border-default rounded-md hover:text-danger hover:border-danger transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-sm text-muted truncate">{todo.notes || ' '}</p>

        {/* Row 2: image */}
        {todo.image && (
          <div className="flex justify-end">
            <img
              src={todo.image}
              alt="Attached"
              className="h-16 w-16 object-cover rounded"
            />
          </div>
        )}

        {/* Row 3: priority, status, reorder + move-to-list controls, due date */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Badge tone={`priority-${todo.priority}`}>
            {t(`tasks.priority_${todo.priority}`)}
          </Badge>
          <span className="hidden sm:inline text-xs text-muted">
            {t('tasks.status')}{' '}
            <span className={`font-medium ${STATUS_TEXT[todo.status]}`}>
              {statusLabel}
            </span>
          </span>
          {(onMoveUp || onMoveDown) && (
            <div
              className="flex items-center border border-default rounded-inner overflow-hidden shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
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
            <div onClick={(e) => e.stopPropagation()}>
              <MoveToListSelect
                value={currentListId ?? null}
                availableLists={availableLists ?? []}
                onChange={onMoveToList}
              />
            </div>
          )}
          {todo.dueDate && !hideDueDate && (
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
                <span className="rounded-full bg-danger/10 px-1.5 py-0.5 text-[0.625rem] font-semibold text-danger">
                  {t('tasks.dueSoon')}
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

export default TodoItem;
