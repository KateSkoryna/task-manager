import Skeleton from '../elements/Skeleton';
import TodoListsSkeleton from '../todo/TodoListsSkeleton';
import SelectTaskPlaceholder from '../todo/SelectTaskPlaceholder';

function VitalTaskPageSkeleton() {
  return (
    <div className="-m-6 grid min-h-full grid-cols-1 md:grid-cols-[1.08fr_0.92fr] lg:grid-cols-[1.2fr_0.8fr]">
      <div className="flex flex-col overflow-y-auto border-default p-6 md:border-r">
        <Skeleton className="h-4 w-64 mb-4" />
        <TodoListsSkeleton />
      </div>

      <div className="hidden flex-col md:flex">
        <SelectTaskPlaceholder />
      </div>
    </div>
  );
}

export default VitalTaskPageSkeleton;
