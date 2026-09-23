import { Search } from 'lucide-react';
import { mergeClassNames } from '../../lib/classNames';
import Input from './Input';

type SearchInputProps = {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  ariaLabel?: string;
  inputTestId?: string;
  className?: string;
};

function SearchInput({
  value,
  onChange,
  onKeyDown,
  placeholder,
  ariaLabel,
  inputTestId,
  className,
}: SearchInputProps) {
  return (
    <div className={mergeClassNames('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <Input
        type="text"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        ariaLabel={ariaLabel}
        inputTestId={inputTestId}
        className="w-full rounded-inner border border-default bg-surface-subtle py-2 pl-9 pr-3 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  );
}

export default SearchInput;
