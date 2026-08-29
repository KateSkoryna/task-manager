import { useState } from 'react';
import { Plus, Inbox as InboxIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TodoItem as TodoItemType } from '@shared/types';
import TodoItem from './TodoItem';
import { AvailableList } from './MoveToListSelect';
import TodoForm from './TodoForm';
import Text from '../elements/Text';
import Card from '../elements/Card';
import { sortByOrder } from '../../lib/reorder';

type NewTodoOpts = {
  dueDate?: string;
  location?: string;
  notes?: string;
};

interface InboxSectionProps {
  todos: TodoItemType[];
  onAddTodo: (name: string, opts?: NewTodoOpts) => void;
  selectedTodoId?: string | null;
  onSelectTodo?: (todo: TodoItemType) => void;
  onEditTodo?: (todo: TodoItemType) => void;
  availableLists?: AvailableList[];
  onReorderTodo?: (id: string, direction: 'up' | 'down') => void;
  onMoveTodo?: (id: string, todolistId: string | null) => void;
}

function InboxSection({
  todos,
  onAddTodo,
  selectedTodoId,
  onSelectTodo,
  onEditTodo,
  availableLists,
  onReorderTodo,
  onMoveTodo,
}: InboxSectionProps) {
  const { t } = useTranslation();
  const [showAddForm, setShowAddForm] = useState(false);
  const sortedTodos = sortByOrder(todos);

  function handleAddTodo(name: string, opts?: NewTodoOpts) {
    onAddTodo(name, opts);
    setShowAddForm(false);
  }

  return (
    <div
      className="bg-surface rounded-card border border-default overflow-hidden"
      data-testid="inbox-section"
    >
      <div className="px-4 py-3 bg-surface-subtle border-b border-default flex items-center gap-3">
        <InboxIcon className="w-4 h-4 text-accent shrink-0" />
        <h3 className="flex-1 min-w-0 truncate text-primary font-bold">
          {t('tasks.inbox')}
        </h3>
        <span className="text-muted text-xs shrink-0">{todos.length}</span>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          aria-label={t('todoList.addTask')}
          className="flex items-center justify-center p-1.5 text-muted border border-default rounded-md hover:text-primary hover:border-primary transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-3 bg-surface">
        {showAddForm && (
          <Card variant="nested">
            <TodoForm onAddTodo={handleAddTodo} />
          </Card>
        )}

        {todos.length === 0 && !showAddForm ? (
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
