import Skeleton from '../elements/Skeleton';

function PanelSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-surface rounded-xl border border-default p-4 ${className}`}
    >
      <Skeleton className="h-4 w-32 mb-3" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-2/3" />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div
      className="flex flex-col gap-4"
      role="status"
      aria-label="Loading dashboard"
    >
      <div className="bg-surface rounded-xl border border-default p-5">
        <Skeleton className="h-6 w-24 mb-3" />
        <Skeleton className="h-2 w-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <PanelSkeleton className="lg:col-span-3" />
        <div className="flex flex-col gap-4 lg:col-span-2">
          <PanelSkeleton />
          <PanelSkeleton />
        </div>
      </div>
    </div>
  );
}

export default DashboardSkeleton;
