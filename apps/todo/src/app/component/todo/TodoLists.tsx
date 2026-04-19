import { useTranslation } from 'react-i18next';
import TodoList from './TodoList';
import Loader from '../elements/Loader';
import ErrorFallback from '../elements/ErrorFallback';
import { TodoList as TodoListType, TodoItem } from '@shared/types';

type NewTodoOpts = {
  dueDate?: string;
  location?: string;
  notes?: string;
};

interface TodoListsProps {
  todoLists: TodoListType[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  handleDeleteList: (id: string) => void;
  handleAddTodo: (todolistId: string, name: string, opts?: NewTodoOpts) => void;
  selectedTodoId?: string | null;
  onSelectTodo?: (todo: TodoItem, list: TodoListType) => void;
  onEditTodo?: (todo: TodoItem, list: TodoListType) => void;
}

function TodoLists({
  todoLists,
  isLoading,
  isError,
  error,
  refetch,
  handleDeleteList,
  handleAddTodo,
  selectedTodoId,
  onSelectTodo,
  onEditTodo,
}: TodoListsProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <Loader message={t('todoLists.loading')} />;
  }

  if (isError) {
    return (
      <ErrorFallback
        error={error as Error}
        resetErrorBoundary={() => refetch()}
        className="max-w-md mx-auto"
      />
    );
  }

  const lists = todoLists ?? [];

  if (lists.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-secondary-bg p-12 text-center mt-4">
        <p
          className="text-dark-bg text-base"
          data-testid="empty-todolists-message"
        >
          {t('todoLists.emptyBefore')}{' '}
          <span className="font-semibold text-triadic-orange">
            {t('todoLists.emptyNewList')}
          </span>{' '}
          {t('todoLists.emptyAfter')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-2">
      {lists.map((list) => (
        <TodoList
          key={list.id}
          todoList={list}
          onAddTodo={handleAddTodo}
          onDeleteList={handleDeleteList}
          selectedTodoId={selectedTodoId ?? null}
          onSelectTodo={
            onSelectTodo ? (todo) => onSelectTodo(todo, list) : undefined
          }
          onEditTodo={onEditTodo ? (todo) => onEditTodo(todo, list) : undefined}
          dataTestId={'todolist-item-' + list.id}
        />
      ))}
    </div>
  );
}

export default TodoLists;
