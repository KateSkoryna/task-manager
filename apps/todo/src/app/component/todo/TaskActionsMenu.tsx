import { Archive, MoreHorizontal, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Dropdown, { DropdownOption } from '../elements/Dropdown';
import { TRIGGER_CLASSES } from './SortMenu';

type TaskAction = 'archive' | 'delete';

interface TaskActionsMenuProps {
  todoId: string;
  onArchive?: () => void;
  onDelete: () => void;
}

const MENU_CLASSES =
  'z-50 w-max min-w-[10rem] list-none overflow-hidden rounded-inner border border-default bg-surface p-0 shadow-menu';

// The 44px tap area: the box stays the header-action size, a transparent
// pseudo-element pads the hit area, as IconButton does.
const TRIGGER = `${TRIGGER_CLASSES} before:absolute before:inset-touch-target-inset before:content-['']`;

/** The task card's one actions button: archive and delete. */
function TaskActionsMenu({
  todoId,
  onArchive,
  onDelete,
}: TaskActionsMenuProps) {
  const { t } = useTranslation();
  const icon = 'size-4 shrink-0';

  const actions: Array<DropdownOption<TaskAction> & { run: () => void }> = [];
  if (onArchive) {
    actions.push({
      value: 'archive',
      label: t('tasks.archive'),
      icon: <Archive className={icon} />,
      testId: 'archive-todo-button-' + todoId,
      run: onArchive,
    });
  }
  actions.push({
    value: 'delete',
    label: t('tasks.delete'),
    icon: <Trash2 className={icon} />,
    testId: 'delete-todo-button-' + todoId,
    run: onDelete,
  });

  return (
    <Dropdown<TaskAction>
      value={null}
      onChange={(value) => actions.find((a) => a.value === value)?.run()}
      options={actions}
      placeholder={t('tasks.moreActions')}
      ariaLabel={t('tasks.moreActions')}
      triggerIcon={<MoreHorizontal className="size-4" />}
      data-testid={'task-actions-' + todoId}
      fixedPosition
      alignEnd
      className={TRIGGER}
      menuClassName={MENU_CLASSES}
      optionClassName="px-3 py-2 text-body"
    />
  );
}

export default TaskActionsMenu;
