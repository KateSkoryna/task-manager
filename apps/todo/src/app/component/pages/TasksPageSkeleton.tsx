import Skeleton from '../elements/Skeleton';
import { TodoListCardSkeleton } from '../todo/TodoListsSkeleton';
import TodoListsSkeleton from '../todo/TodoListsSkeleton';
import SelectTaskPlaceholder from '../todo/SelectTaskPlaceholder';

function TasksPageSkeleton() {
  return (
    <div className="-m-6 grid min-h-full grid-cols-1 md:grid-cols-[1.08fr_0.92fr] lg:grid-cols-[1.2fr_0.8fr]">
      <div className="flex flex-col border-default md:border-r">
        <div className="p-6 pb-4">
          <Skeleton className="h-6 w-32 mb-1.5" />
          <Skeleton className="h-0.5 w-14" />
        </div>

        <div className="flex-1 px-6 pb-6 space-y-4">
          <TodoListCardSkeleton />
          <TodoListsSkeleton />
        </div>
      </div>

      <div className="hidden flex-col md:flex">
        <SelectTaskPlaceholder />
      </div>
    </div>
  );
}

export default TasksPageSkeleton;
