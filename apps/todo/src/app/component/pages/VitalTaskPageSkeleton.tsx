import Skeleton from '../elements/Skeleton';
import TodoListsSkeleton from '../todo/TodoListsSkeleton';
import SelectTaskPlaceholder from '../todo/SelectTaskPlaceholder';

function VitalTaskPageSkeleton() {
  return (
    <div className="-mx-content-mobile -mb-content-mobile grid min-h-full grid-cols-1 pt-6 md:-mx-content-tablet md:-mb-content-tablet lg:-mx-content-desktop lg:-mb-content-desktop md:grid-cols-[1.08fr_0.92fr] lg:grid-cols-[1.2fr_0.8fr]">
      <div className="flex flex-col overflow-y-auto border-default pl-content-mobile pr-content-mobile pb-content-mobile md:border-r md:pl-content-tablet md:pr-0 md:pb-content-tablet lg:pl-content-desktop lg:pb-content-desktop">
        <Skeleton className="h-4 w-64 mb-4" />
        <TodoListsSkeleton />
      </div>

      <div className="hidden flex-col pl-content-mobile pr-content-mobile pb-content-mobile md:flex md:pl-0 md:pr-content-tablet md:pb-content-tablet lg:pr-content-desktop lg:pb-content-desktop">
        <SelectTaskPlaceholder />
      </div>
    </div>
  );
}

export default VitalTaskPageSkeleton;
