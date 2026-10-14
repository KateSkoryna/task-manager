import { Inbox as InboxIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TodoItem as TodoItemType } from '@shared/types';
import TodoItem from './TodoItem';
import SortableTaskList from './SortableTaskList';
import { AvailableList } from './MoveToListSelect';
import QuickCaptureInput from './QuickCaptureInput';
import Text from '../elements/Text';
import { sortByOrder } from '../../lib/reorder';

interface InboxSectionProps {
  todos: TodoItemType[];
  selectedTodoId?: string | null;
  onSelectTodo?: (todo: TodoItemType) => void;
  onToggleTodo?: (id: string) => void;
  availableLists?: AvailableList[];
  onReorderTodo?: (activeId: string, overId: string) => void;
  onMoveTodo?: (id: string, todolistId: string | null) => void;
}

function InboxSection({
  todos,
  selectedTodoId,
  onSelectTodo,
  onToggleTodo,
  availableLists,
  onReorderTodo,
  onMoveTodo,
}: InboxSectionProps) {
  const { t } = useTranslation();
  const sortedTodos = sortByOrder(todos);

  return (
    <div
      className="bg-surface rounded-card border border-default"
      data-testid="inbox-section"
    >
      <div className="px-4 py-3 bg-surface border-b border-default flex items-center gap-3">
        <InboxIcon className="w-4 h-4 text-notification-dot shrink-0" />
        <h3 className="flex-1 min-w-0 truncate text-primary font-bold">
          {t('tasks.inbox')}
        </h3>
        <span className="text-muted text-small shrink-0">{todos.length}</span>
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
            className="text-center text-muted py-6 text-body"
            dataTestId="empty-inbox-message"
          >
            {t('tasks.emptyInbox')}
          </Text>
        ) : (
          <SortableTaskList
            items={sortedTodos}
            onReorder={onReorderTodo}
            renderItem={(todo) => (
              <TodoItem
                todo={todo}
                isSelected={selectedTodoId === todo.id}
                onSelect={onSelectTodo ? () => onSelectTodo(todo) : undefined}
                onToggleComplete={
                  onToggleTodo ? () => onToggleTodo(todo.id) : undefined
                }
                currentListId={null}
                availableLists={availableLists}
                onMoveToList={
                  onMoveTodo
                    ? (todolistId) => onMoveTodo(todo.id, todolistId)
                    : undefined
                }
              />
            )}
          />
        )}
      </div>
    </div>
  );
}

export default InboxSection;
