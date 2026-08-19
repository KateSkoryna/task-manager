import { ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function SelectTaskPlaceholder() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center h-full text-secondary-dark-bg gap-3 p-6">
      <ClipboardList className="w-16 h-16 opacity-20" />
      <p className="text-base font-medium opacity-40">
        {t('tasks.selectTask')}
      </p>
    </div>
  );
}

export default SelectTaskPlaceholder;
