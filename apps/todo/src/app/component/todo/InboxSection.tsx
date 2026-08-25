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
      <div className="px-4 py-3 bg-sidebar flex items-center justify-between">
        <div className="flex items-center gap-3">
          <InboxIcon className="w-4 h-4 text-accent" />
          <h3 className="text-sidebar-text font-bold">{t('tasks.inbox')}</h3>
          <span className="text-sidebar-text text-xs">{todos.length}</span>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-on-accent bg-accent rounded hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3 h-3" />
          {t('todoList.addTask')}
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
