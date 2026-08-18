import { useTranslation } from 'react-i18next';
import { TodoItem as TodoItemType } from '@shared/types';
import TodoItem from './TodoItem';
import { AvailableList } from './MoveToListSelect';
import Text from '../elements/Text';

export interface FlatEntry {
  todo: TodoItemType;
  listId: string | null;
}

interface FlatTaskListProps {
  entries: FlatEntry[];
  selectedTodoId?: string | null;
  onSelectTodo?: (todo: TodoItemType, listId: string | null) => void;
  onEditTodo?: (todo: TodoItemType, listId: string | null) => void;
  availableLists: AvailableList[];
  onMoveTodo?: (id: string, todolistId: string | null) => void;
}

function FlatTaskList({
  entries,
  selectedTodoId,
  onSelectTodo,
  onEditTodo,
  availableLists,
  onMoveTodo,
}: FlatTaskListProps) {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return (
      <Text
        as="p"
        className="text-center text-secondary-dark-bg py-6 text-sm"
        dataTestId="empty-flat-tasks-message"
      >
        {t('tasks.emptyFlatView')}
      </Text>
    );
  }

  return (
    <div className="space-y-3" data-testid="flat-task-list">
      {entries.map(({ todo, listId }) => {
        const listName =
          (listId && availableLists.find((l) => l.id === listId)?.name) ||
          t('tasks.inbox');
        return (
          <div key={todo.id}>
            <span className="text-xs font-medium text-triadic-blue ml-1">
              {listName}
            </span>
            <TodoItem
              todo={todo}
              isSelected={selectedTodoId === todo.id}
              onSelect={
                onSelectTodo ? () => onSelectTodo(todo, listId) : undefined
              }
              onEdit={onEditTodo ? () => onEditTodo(todo, listId) : undefined}
              currentListId={listId}
              availableLists={availableLists}
              onMoveToList={
                onMoveTodo
                  ? (todolistId) => onMoveTodo(todo.id, todolistId)
                  : undefined
              }
            />
          </div>
        );
      })}
    </div>
  );
}

export default FlatTaskList;
