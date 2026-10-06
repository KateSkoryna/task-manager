import { Inbox as InboxIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TodoItem as TodoItemType } from '@shared/types';
import TodoItem from './TodoItem';
import { AvailableList } from './MoveToListSelect';
import QuickCaptureInput from './QuickCaptureInput';
import Text from '../elements/Text';
import { sortByOrder } from '../../lib/reorder';

interface InboxSectionProps {
  todos: TodoItemType[];
  selectedTodoId?: string | null;
  onSelectTodo?: (todo: TodoItemType) => void;
  onEditTodo?: (todo: TodoItemType) => void;
  onDeleteTodo?: (todo: TodoItemType) => void;
  availableLists?: AvailableList[];
  onReorderTodo?: (id: string, direction: 'up' | 'down') => void;
  onMoveTodo?: (id: string, todolistId: string | null) => void;
}

function InboxSection({
  todos,
  selectedTodoId,
  onSelectTodo,
  onEditTodo,
  onDeleteTodo,
  availableLists,
  onReorderTodo,
  onMoveTodo,
}: InboxSectionProps) {
  const { t } = useTranslation();
  const sortedTodos = sortByOrder(todos);

  return (
    <div
      className="bg-surface rounded-card border border-default overflow-hidden"
      data-testid="inbox-section"
    >
      <div className="px-4 py-3 bg-surface-subtle border-b border-default flex items-center gap-3">
        <InboxIcon className="w-4 h-4 text-notification-dot shrink-0" />
        <h3 className="flex-1 min-w-0 truncate text-primary font-bold">
          {t('tasks.inbox')}
        </h3>
        <span className="text-muted text-xs shrink-0">{todos.length}</span>
      </div>

      <div className="p-4 space-y-3 bg-surface">
        <QuickCaptureInput
          inputTestId="inbox-quick-capture-input"
          submitTestId="inbox-quick-capture-submit"
          noticeTestId="inbox-enrichment-notice"
          undoTestId="inbox-enrichment-undo"
        />

        {todos.length === 0 ? (
          <Text
            as="p"
            className="text-center text-muted py-6 text-sm"
            dataTestId="empty-inbox-message"
          >
            {t('tasks.emptyInbox')}
          </Text>
        ) : (
          sortedTodos.map((todo, index) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              isSelected={selectedTodoId === todo.id}
              onSelect={onSelectTodo ? () => onSelectTodo(todo) : undefined}
              onEdit={onEditTodo ? () => onEditTodo(todo) : undefined}
              onDelete={onDeleteTodo ? () => onDeleteTodo(todo) : undefined}
              onMoveUp={
                onReorderTodo ? () => onReorderTodo(todo.id, 'up') : undefined
              }
              onMoveDown={
                onReorderTodo ? () => onReorderTodo(todo.id, 'down') : undefined
              }
              canMoveUp={index > 0}
              canMoveDown={index < sortedTodos.length - 1}
              currentListId={null}
              availableLists={availableLists}
              onMoveToList={
                onMoveTodo
                  ? (todolistId) => onMoveTodo(todo.id, todolistId)
                  : undefined
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

export default InboxSection;
