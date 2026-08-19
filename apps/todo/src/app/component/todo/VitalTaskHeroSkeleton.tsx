import Skeleton from '../elements/Skeleton';

function VitalTaskCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-secondary-bg bg-white p-4">
      <Skeleton className="h-4 w-20 rounded-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-6 w-20 mt-auto" />
    </div>
  );
}

function VitalTaskHeroSkeleton() {
  return (
    <div className="mb-6" role="status" aria-label="Loading vital tasks">
      <Skeleton className="h-4 w-40 mb-3" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <VitalTaskCardSkeleton />
        <VitalTaskCardSkeleton />
        <VitalTaskCardSkeleton />
      </div>
    </div>
  );
}

export default VitalTaskHeroSkeleton;
