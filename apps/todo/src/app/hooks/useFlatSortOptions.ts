import { useTranslation } from 'react-i18next';
import { FlatSort } from '../lib/sortTasks';

/** The sort choices for flat task lists. */
export const useFlatSortOptions = (): { value: FlatSort; label: string }[] => {
  const { t } = useTranslation();
  return [
    { value: 'dueDate', label: t('tasks.sortDueDate') },
    { value: 'name', label: t('tasks.sortName') },
    { value: 'listName', label: t('tasks.sortListName') },
    { value: 'priority', label: t('tasks.sortPriority') },
    { value: 'status', label: t('tasks.sortStatus') },
  ];
};
