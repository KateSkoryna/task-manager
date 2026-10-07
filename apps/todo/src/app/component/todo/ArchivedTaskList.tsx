import dayjs from 'dayjs';
import { ArchiveRestore, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TodoItem } from '@shared/types';
import Card from '../elements/Card';
import IconButton from '../elements/IconButton';
import Text from '../elements/Text';
import { AvailableList } from './MoveToListSelect';
import { FlatEntry } from './FlatTaskList';

interface ArchivedTaskListProps {
  entries: FlatEntry[];
  availableLists: AvailableList[];
  onRestore: (id: string) => void;
  onDelete: (todo: TodoItem) => void;
}

/** Archived tasks, newest first, with the list each one came from. */
function ArchivedTaskList({
  entries,
  availableLists,
  onRestore,
  onDelete,
}: ArchivedTaskListProps) {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return (
      <Text
        as="p"
        className="text-center text-muted py-6 text-sm"
        dataTestId="empty-archive-message"
      >
        {t('tasks.emptyArchive')}
      </Text>
    );
  }

  return (
    <div className="space-y-3" data-testid="archived-task-list">
      {entries.map(({ todo, listId }) => {
        const listName =
          (listId && availableLists.find((l) => l.id === listId)?.name) ||
          t('tasks.inbox');
        const archivedOn = todo.archivedAt
          ? dayjs(todo.archivedAt).format('MMM D, YYYY')
          : null;
        return (
          <Card
            key={todo.id}
            variant="nested"
            dataTestId={'archived-item-' + todo.id}
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-primary">
                  {todo.name}
                </p>
                <p className="truncate text-xs text-muted">
                  {listName}
                  {archivedOn &&
                    ` · ${t('tasks.archivedOn', { date: archivedOn })}`}
                </p>
              </div>
              <IconButton
                ariaLabel={t('tasks.restore')}
                onClick={() => onRestore(todo.id)}
                dataTestId={'restore-todo-button-' + todo.id}
              >
                <ArchiveRestore className="size-4" />
              </IconButton>
              <IconButton
                ariaLabel={t('tasks.delete')}
                onClick={() => onDelete(todo)}
                dataTestId={'archived-delete-button-' + todo.id}
              >
                <Trash2 className="size-4" />
              </IconButton>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default ArchivedTaskList;
