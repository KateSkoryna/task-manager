import { useTranslation } from 'react-i18next';
import { TodoItem, TodoPriority } from '@shared/types';
import { STATUS_LABEL_KEYS, STATUS_TEXT } from '../todo/TodoItem';
import { mergeClassNames } from '../../lib/classNames';

// The left edge keeps its priority colour while the rest of the border
// lights up. That happens on hover and on keyboard focus: `focus-visible`
// when the item is itself the button, `has-[:focus-visible]` when the
// focused control sits inside it.
export const PRIORITY_BORDER: Record<TodoPriority, string> = {
  high: 'border-l-priority-low hover:border-l-priority-low focus-visible:border-l-priority-low has-[:focus-visible]:border-l-priority-low',
  medium:
    'border-l-priority-high-bg hover:border-l-priority-high-bg focus-visible:border-l-priority-high-bg has-[:focus-visible]:border-l-priority-high-bg',
  low: 'border-l-priority-high-bg/50 hover:border-l-priority-high-bg/50 focus-visible:border-l-priority-high-bg/50 has-[:focus-visible]:border-l-priority-high-bg/50',
};

interface TaskCardProps {
  item: TodoItem;
  onOpen: (item: TodoItem) => void;
}

/** A task as a clickable card: its name, its status, its priority edge. */
function TaskCard({ item, onOpen }: TaskCardProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={mergeClassNames(
        'min-w-0 rounded-card border border-l-4 border-transparent bg-surface-subtle p-3 text-left transition focus-visible:border-accent focus-visible:outline-none motion-safe:[@media(hover:hover)]:hover:scale-[1.02] motion-safe:focus-visible:scale-[1.02]',
        PRIORITY_BORDER[item.priority]
      )}
    >
      <p className="truncate text-body font-bold leading-snug text-primary">
        {item.name}
      </p>
      <p className="mt-1.5 text-small text-muted">
        {t('dashboard.status')}{' '}
        <span className={`font-medium ${STATUS_TEXT[item.status]}`}>
          {t(STATUS_LABEL_KEYS[item.status])}
        </span>
      </p>
    </button>
  );
}

export default TaskCard;
