import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import IconButton from '../elements/IconButton';
import TaskActionsMenu from './TaskActionsMenu';

interface TaskPanelBarProps {
  todoId: string;
  onBack: () => void;
  onArchive?: () => void;
  onDelete: () => void;
}

/** Top bar of the task card: Back (phones only) and the actions menu. */
function TaskPanelBar({
  todoId,
  onBack,
  onArchive,
  onDelete,
}: TaskPanelBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between border-b border-default p-3">
      <IconButton
        ariaLabel={t('tasks.backToList')}
        onClick={onBack}
        className="md:hidden"
      >
        <ArrowLeft className="size-4" />
      </IconButton>
      <div className="ml-auto">
        <TaskActionsMenu
          todoId={todoId}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

export default TaskPanelBar;
