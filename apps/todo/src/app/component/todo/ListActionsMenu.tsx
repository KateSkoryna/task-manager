import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Dropdown, { DropdownOption } from '../elements/Dropdown';
import { TRIGGER_CLASSES } from './SortMenu';

type ListAction = 'add' | 'edit' | 'delete';

interface ListActionsMenuProps {
  listId: string;
  onAddTask: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const MENU_CLASSES =
  'z-50 w-max min-w-[10rem] list-none overflow-hidden rounded-inner border border-default bg-surface p-0 shadow-menu';

/** The list card's one actions button: add a task, edit the list, delete it. */
function ListActionsMenu({
  listId,
  onAddTask,
  onEdit,
  onDelete,
}: ListActionsMenuProps) {
  const { t } = useTranslation();
  const icon = 'size-4 shrink-0';

  const actions: Array<DropdownOption<ListAction> & { run: () => void }> = [
    {
      value: 'add',
      label: t('todoList.addTask'),
      icon: <Plus className={icon} />,
      testId: 'todolist-add-task-' + listId,
      run: onAddTask,
    },
  ];
  if (onEdit) {
    actions.push({
      value: 'edit',
      label: t('todoListForm.editList'),
      icon: <Pencil className={icon} />,
      testId: 'todolist-edit-' + listId,
      run: onEdit,
    });
  }
  if (onDelete) {
    actions.push({
      value: 'delete',
      label: t('todoList.deleteList'),
      icon: <Trash2 className={icon} />,
      testId: 'todolist-item-delete-button',
      run: onDelete,
    });
  }

  return (
    <Dropdown<ListAction>
      value={null}
      onChange={(value) => actions.find((a) => a.value === value)?.run()}
      options={actions}
      placeholder={t('tasks.moreActions')}
      ariaLabel={t('tasks.moreActions')}
      triggerIcon={<MoreHorizontal className="size-4" />}
      data-testid={'todolist-actions-' + listId}
      fixedPosition
      alignEnd
      className={`${TRIGGER_CLASSES} before:absolute before:inset-touch-target-inset before:content-['']`}
      menuClassName={MENU_CLASSES}
      optionClassName="px-3 py-2 text-body"
    />
  );
}

export default ListActionsMenu;
