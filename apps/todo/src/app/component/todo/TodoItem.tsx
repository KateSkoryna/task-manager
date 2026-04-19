import { useEffect } from 'react';
import { Pencil } from 'lucide-react';
import dayjs from 'dayjs';
import {
  TodoItem as TodoItemType,
  TodoStatus,
  TodoListPriority,
} from '@shared/types';

interface TodoItemProps {
  todo: TodoItemType;
  listPriority?: TodoListPriority;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
}

const STATUS_DOT: Record<TodoStatus, string> = {
  pending: 'border-2 border-triadic-orange bg-transparent',
  successful: 'bg-green-500 border-2 border-green-500',
  failed: 'bg-triadic-purple border-2 border-triadic-purple',
};

const STATUS_LABELS: Record<TodoStatus, string> = {
  pending: 'In Progress',
  successful: 'Completed',
  failed: 'Not Started',
};

const STATUS_TEXT: Record<TodoStatus, string> = {
  pending: 'text-triadic-orange',
  successful: 'text-green-600',
  failed: 'text-triadic-purple',
};

const STATUS_BORDER: Record<TodoStatus, string> = {
  pending: 'border-triadic-orange',
  successful: 'border-green-500',
  failed: 'border-triadic-purple',
};

function TodoItem({
  todo,
  listPriority,
  isSelected,
  onSelect,
  onEdit,
}: TodoItemProps) {
  useEffect(() => {
    // auto-fail overdue items is handled server-side / via edit panel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todo.id]);

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-colors bg-white ${
        isSelected ? 'shadow-md' : ''
      } ${STATUS_BORDER[todo.status]}`}
      data-testid={'todo-item-' + todo.id}
      onClick={() => onSelect?.()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect?.();
      }}
    >
      <div className="flex flex-col p-4 cursor-pointer gap-2">
        {/* Row 1: status dot + name + edit btn */}
        <div className="flex items-center gap-3">
          <div
            className={`w-5 h-5 rounded-full shrink-0 ${
              STATUS_DOT[todo.status]
            }`}
          />
          <p
            className={`flex-1 min-w-0 font-semibold text-dark-bg leading-snug ${
              todo.status === 'successful'
                ? 'line-through text-secondary-dark-bg'
                : ''
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
              className="shrink-0 p-1 text-secondary-dark-bg hover:text-triadic-orange transition-colors rounded"
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
            <span className="text-xs text-secondary-dark-bg">
              Priority:{' '}
              <span
                className={`font-medium ${
                  listPriority === 'high'
                    ? 'text-triadic-orange'
                    : listPriority === 'medium'
                    ? 'text-triadic-blue'
                    : 'text-triadic-purple'
                }`}
              >
                {listPriority.charAt(0).toUpperCase() + listPriority.slice(1)}
              </span>
            </span>
          )}
          <span className="text-xs text-secondary-dark-bg">
            Status:{' '}
            <span className={`font-medium ${STATUS_TEXT[todo.status]}`}>
              {STATUS_LABELS[todo.status]}
            </span>
          </span>
          {todo.dueDate && (
            <span className="text-xs text-secondary-dark-bg ml-auto">
              Due: {dayjs(todo.dueDate).format('DD/MM/YYYY')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default TodoItem;
