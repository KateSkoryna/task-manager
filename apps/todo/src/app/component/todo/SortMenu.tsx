import { ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Dropdown, { DropdownOption } from '../elements/Dropdown';

// The trigger is a <summary> styled to match IconButton, which is a <button>
// and so can't be used as a <details> trigger.
const TRIGGER_CLASSES =
  'relative inline-flex size-header-action shrink-0 cursor-pointer list-none items-center justify-center rounded-control border border-default bg-surface text-muted transition-colors hover:bg-surface-subtle focus-visible:bg-surface-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-priority-high-bg [&::-webkit-details-marker]:hidden';
const MENU_CLASSES =
  'absolute right-0 z-20 mt-1 w-max min-w-[10rem] list-none overflow-hidden rounded-inner border-2 border-default bg-surface p-0 shadow-menu';

interface SortMenuProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
}

/** Icon-only sort control: click it to pick how the list below is ordered. */
function SortMenu<T extends string>({
  value,
  onChange,
  options,
}: SortMenuProps<T>) {
  const { t } = useTranslation();
  return (
    <Dropdown
      triggerIcon={<ArrowUpDown className="size-4" />}
      value={value}
      onChange={(next) => next && onChange(next)}
      options={options}
      placeholder={t('tasks.sortBy')}
      ariaLabel={t('tasks.sortBy')}
      className={TRIGGER_CLASSES}
      menuClassName={MENU_CLASSES}
      data-testid="sort-select"
    />
  );
}

export default SortMenu;
