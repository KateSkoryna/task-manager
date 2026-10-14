import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  TodoList as TodoListType,
  TodoItem as TodoItemType,
  UpdateTodoList,
} from '@shared/types';
import TodoItem from './TodoItem';
import ListActionsMenu from './ListActionsMenu';
import SortableTaskList from './SortableTaskList';
import { AvailableList } from './MoveToListSelect';
import TodoForm from './TodoForm';
import TodoListForm, { TodoListFormOpts } from './TodoListForm';
import Text from '../elements/Text';
import Badge from '../elements/Badge';
import Card from '../elements/Card';
import { sortByOrder } from '../../lib/reorder';
import { isListExpanded, useListViewStore } from '../../store/listViewStore';
import dayjs from 'dayjs';

type NewTodoOpts = {
  dueDate?: string;
  location?: string;
  notes?: string;
};

interface TodoListProps {
  todoList: TodoListType;
  onAddTodo: (todolistId: string, name: string, opts?: NewTodoOpts) => void;
  onDeleteList: (id: string) => void;
  onEditList?: (id: string, updates: UpdateTodoList) => void;
  selectedTodoId?: string | null;
  onSelectTodo?: (todo: TodoItemType) => void;
  onToggleTodo?: (id: string) => void;
  dataTestId?: string;
  availableLists?: AvailableList[];
  onReorderTodo?: (activeId: string, overId: string) => void;
  onMoveTodo?: (id: string, todolistId: string | null) => void;
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = dayjs(iso);
  return d.isValid() ? d.format('MMM D, YYYY') : null;
}

function TodoList({
  todoList,
  onAddTodo,
  onDeleteList,
  onEditList,
  selectedTodoId,
  onSelectTodo,
  onToggleTodo,
  dataTestId,
  availableLists,
  onReorderTodo,
  onMoveTodo,
}: TodoListProps) {
  const { t } = useTranslation();
  // Remembered across page switches; a list nobody toggled yet starts
  // expanded only if it has tasks (so empty default lists start collapsed).
  const isExpanded = useListViewStore((state) =>
    isListExpanded(state.expandedByList, todoList)
  );
  const setListExpanded = useListViewStore((state) => state.setListExpanded);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const sortedTodos = sortByOrder(todoList.todos);
  const completedCount = todoList.todos.filter(
    (t) => t.status === 'successful'
  ).length;
  const formattedDate = formatDate(todoList.dueDate);

  function handleAddTodo(name: string, opts?: NewTodoOpts) {
    onAddTodo(todoList.id, name, opts);
    setShowAddForm(false);
  }

  function handleEditListSubmit(name: string, opts?: TodoListFormOpts) {
    onEditList?.(todoList.id, { ...opts, name });
    setShowEditForm(false);
  }

  return (
    <div
      className="bg-surface rounded-card border border-default"
      data-testid={dataTestId}
    >
      {/* List header */}
      <div className="px-4 py-3 bg-surface border-b border-default">
        {/* The buttons wrap below the name when the column is too narrow to
            leave it a readable width. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <button
            onClick={() => setListExpanded(todoList.id, !isExpanded)}
            className="flex items-center justify-center p-1.5 text-notification-dot hover:text-primary transition-colors shrink-0"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>

          <div className="flex items-center gap-3 min-w-[7rem] flex-1">
            <h3
              className="min-w-0 truncate text-primary font-bold"
              data-testid="todolist-title"
            >
              {todoList.name}
            </h3>
            <span className="hidden text-muted text-small shrink-0 lg:inline">
              {completedCount}/{todoList.todos.length}
            </span>
            {todoList.priority && (
              <Badge tone={`priority-${todoList.priority}`}>
                {t(`tasks.priority_${todoList.priority}`)}
              </Badge>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <ListActionsMenu
              listId={todoList.id}
              onAddTask={() => {
                if (!isExpanded) setListExpanded(todoList.id, true);
                setShowAddForm((v) => !v);
              }}
              onEdit={onEditList ? () => setShowEditForm((v) => !v) : undefined}
              onDelete={
                todoList.isDefault ? undefined : () => onDeleteList(todoList.id)
              }
            />
          </div>
        </div>

        {(todoList.category || formattedDate) && (
          <div className="hidden items-center gap-4 text-small text-muted mt-1.5 ml-11 sm:flex">
            {todoList.category && (
              <span>
                {t('tasks.category')} {t(`tasks.category_${todoList.category}`)}
              </span>
            )}
            {formattedDate && (
              <span className="ml-auto">
                {t('todoList.due')} {formattedDate}
              </span>
            )}
          </div>
        )}

        {todoList.notes && (
          <p className="hidden mt-1.5 ml-11 text-small text-muted truncate sm:block">
            {todoList.notes}
          </p>
        )}
      </div>

      {showEditForm && (
        <div className="p-4 bg-surface">
          <TodoListForm todoList={todoList} onSubmit={handleEditListSubmit} />
        </div>
      )}

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 space-y-3 bg-surface">
          {showAddForm && (
            <Card variant="nested">
              <TodoForm onAddTodo={handleAddTodo} />
            </Card>
          )}

          {todoList.todos.length === 0 && !showAddForm ? (
            <Text
              as="p"
              className="text-center text-muted py-6 text-body"
              dataTestId="empty-todos-message"
            >
              {t('todoList.noTasksBefore')}{' '}
              <button
                onClick={() => setShowAddForm(true)}
                className="font-bold text-primary hover:underline focus:outline-none"
              >
                {t('todoList.addTask')}
              </button>{' '}
              {t('todoList.noTasksAfter')}
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
                  currentListId={todoList.id}
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
      )}
    </div>
  );
}

export default TodoList;
