import Skeleton from '../elements/Skeleton';
import { TodoListCardSkeleton } from '../todo/TodoListsSkeleton';
import TodoListsSkeleton from '../todo/TodoListsSkeleton';
import SelectTaskPlaceholder from '../todo/SelectTaskPlaceholder';

function TasksPageSkeleton() {
  return (
    <div className="flex min-h-full -m-6">
      <div className="flex flex-col w-1/2 border-r border-secondary-bg">
        <div className="p-6 pb-4">
          <Skeleton className="h-6 w-32 mb-1.5" />
          <Skeleton className="h-0.5 w-14" />
        </div>

        <div className="flex-1 px-6 pb-6 space-y-4">
          <TodoListCardSkeleton />
          <TodoListsSkeleton />
        </div>
      </div>

      <div className="flex flex-col w-1/2">
        <SelectTaskPlaceholder />
      </div>
    </div>
  );
}

export default TasksPageSkeleton;
