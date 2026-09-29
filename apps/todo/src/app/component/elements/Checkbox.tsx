type Props = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

function Checkbox({ id, checked, onChange, label }: Props) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="checkbox-check relative h-5 w-5 shrink-0 cursor-pointer rounded border-2 border-default bg-surface transition-colors after:absolute after:left-[5px] after:top-[1px] after:h-[10px] after:w-[6px] after:rotate-45 after:border-b-2 after:border-r-2 after:opacity-0 after:content-[''] peer-checked:after:opacity-100 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
      />
      <label
        htmlFor={id}
        className="text-sm text-muted cursor-pointer select-none"
      >
        {label}
      </label>
    </div>
  );
}

export default Checkbox;
