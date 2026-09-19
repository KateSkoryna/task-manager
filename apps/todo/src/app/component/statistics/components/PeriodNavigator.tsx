import { ChevronLeft, ChevronRight } from 'lucide-react';
import IconButton from '../../elements/IconButton';

interface PeriodNavigatorProps {
  rangeLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  previousLabel: string;
  nextLabel: string;
}

export default function PeriodNavigator({
  rangeLabel,
  onPrevious,
  onNext,
  nextDisabled,
  previousLabel,
  nextLabel,
}: PeriodNavigatorProps) {
  return (
    <div className="flex items-center gap-2">
      <IconButton ariaLabel={previousLabel} onClick={onPrevious}>
        <ChevronLeft size={18} />
      </IconButton>
      <span className="text-sm text-muted min-w-[9rem] text-center">
        {rangeLabel}
      </span>
      <IconButton
        ariaLabel={nextLabel}
        onClick={onNext}
        disabled={nextDisabled}
      >
        <ChevronRight size={18} />
      </IconButton>
    </div>
  );
}
