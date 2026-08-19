import Skeleton from '../elements/Skeleton';

export function TodoListCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-secondary-bg overflow-hidden">
      <div className="px-4 py-3 bg-dark-bg">
        <Skeleton className="h-4 w-40 bg-secondary-dark-bg" />
      </div>
      <div className="p-4 space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </div>
    </div>
  );
}

function TodoListsSkeleton() {
  return (
    <div
      className="space-y-4 mt-2"
      role="status"
      aria-label="Loading todo lists"
    >
      <TodoListCardSkeleton />
      <TodoListCardSkeleton />
      <TodoListCardSkeleton />
    </div>
  );
}

export default TodoListsSkeleton;
