import { Inbox as InboxIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Dropdown from '../elements/Dropdown';

export interface AvailableList {
  id: string;
  name: string;
}

interface MoveToListSelectProps {
  value: string | null;
  availableLists: AvailableList[];
  onChange: (todolistId: string | null) => void;
}

function MoveToListSelect({
  value,
  availableLists,
  onChange,
}: MoveToListSelectProps) {
  const { t } = useTranslation();

  return (
    <Dropdown
      value={value}
      onChange={onChange}
      options={availableLists.map((list) => ({
        value: list.id,
        label: list.name,
      }))}
      nullOption={{
        label: t('tasks.inbox'),
        icon: <InboxIcon className="w-3 h-3 shrink-0" />,
      }}
      placeholder={t('tasks.inbox')}
      ariaLabel={t('tasks.moveToList')}
      fixedPosition
      className="flex flex-1 min-w-0 justify-between items-center gap-1 px-2 py-1 rounded-lg border border-secondary-bg bg-white text-dark-bg text-xs cursor-pointer focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent select-none"
      menuClassName="z-50 w-max max-w-[220px] bg-white border border-secondary-bg rounded-lg shadow-lg overflow-hidden list-none p-0"
      optionClassName="px-3 py-1.5 text-xs"
    />
  );
}

export default MoveToListSelect;
