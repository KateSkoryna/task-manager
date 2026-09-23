import Skeleton from '../elements/Skeleton';

function ReportsPageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading reports">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-64" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>

      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default ReportsPageSkeleton;
