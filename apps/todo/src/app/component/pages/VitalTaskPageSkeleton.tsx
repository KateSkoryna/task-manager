import Skeleton from '../elements/Skeleton';
import TodoListsSkeleton from '../todo/TodoListsSkeleton';
import SelectTaskPlaceholder from '../todo/SelectTaskPlaceholder';

function VitalTaskPageSkeleton() {
  return (
    <div className="flex min-h-full -m-6">
      <div className="flex flex-col w-1/2 border-r border-secondary-bg p-6 overflow-y-auto">
        <Skeleton className="h-4 w-64 mb-4" />
        <TodoListsSkeleton />
      </div>

      <div className="flex flex-col w-1/2">
        <SelectTaskPlaceholder />
      </div>
    </div>
  );
}

export default VitalTaskPageSkeleton;
