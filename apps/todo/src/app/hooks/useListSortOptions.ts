import { useTranslation } from 'react-i18next';
import { ListSort } from '../lib/sortTasks';

/** The sort choices for lists, shared by every page that orders lists. */
export const useListSortOptions = (): { value: ListSort; label: string }[] => {
  const { t } = useTranslation();
  return [
    { value: 'name', label: t('tasks.sortListName') },
    { value: 'created', label: t('tasks.sortCreated') },
    { value: 'dueDate', label: t('tasks.sortListDueDate') },
    { value: 'priority', label: t('tasks.sortListPriority') },
  ];
};
