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
        className="w-5 h-5 rounded border-2 border-default accent-accent cursor-pointer"
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
