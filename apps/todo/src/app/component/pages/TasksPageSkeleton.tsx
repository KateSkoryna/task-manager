import Skeleton from '../elements/Skeleton';
import TodoListsSkeleton from '../todo/TodoListsSkeleton';
import SelectTaskPlaceholder from '../todo/SelectTaskPlaceholder';

function TasksPageSkeleton() {
  return (
    <div className="-mx-content-mobile -mb-content-mobile grid min-h-full grid-cols-1 gap-6 md:-mx-content-tablet md:-mb-content-tablet lg:-mx-content-desktop lg:-mb-content-desktop md:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="flex flex-col pl-content-mobile pr-content-mobile pb-content-mobile md:pl-content-tablet md:pr-0 md:pb-content-tablet lg:pl-content-desktop lg:pb-content-desktop">
        <Skeleton className="mb-4 h-6 w-32" />
        <TodoListsSkeleton count={2} />
      </div>

      <div className="hidden flex-col pl-content-mobile pr-content-mobile pb-content-mobile md:flex md:pl-0 md:pr-content-tablet md:pb-content-tablet lg:pr-content-desktop lg:pb-content-desktop">
        <SelectTaskPlaceholder />
      </div>
    </div>
  );
}

export default TasksPageSkeleton;
