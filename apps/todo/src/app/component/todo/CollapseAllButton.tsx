import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TodoList } from '@shared/types';
import { isListExpanded, useListViewStore } from '../../store/listViewStore';
import IconButton from '../elements/IconButton';

interface CollapseAllButtonProps {
  /** The lists currently on the page; only these are affected. */
  lists: Pick<TodoList, 'id' | 'todos'>[];
}

/** Collapses every list; once all are collapsed, the same button expands them. */
function CollapseAllButton({ lists }: CollapseAllButtonProps) {
  const { t } = useTranslation();
  const expandedByList = useListViewStore((state) => state.expandedByList);
  const setListsExpanded = useListViewStore((state) => state.setListsExpanded);

  const allCollapsed =
    lists.length > 0 &&
    lists.every((list) => !isListExpanded(expandedByList, list));

  return (
    <IconButton
      ariaLabel={allCollapsed ? t('tasks.expandAll') : t('tasks.collapseAll')}
      onClick={() =>
        setListsExpanded(
          lists.map((list) => list.id),
          allCollapsed
        )
      }
      dataTestId="toggle-all-lists"
    >
      {allCollapsed ? (
        <ChevronsUpDown className="size-4" />
      ) : (
        <ChevronsDownUp className="size-4" />
      )}
    </IconButton>
  );
}

export default CollapseAllButton;
