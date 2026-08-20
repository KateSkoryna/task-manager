import Skeleton from '../elements/Skeleton';

function PanelSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-white rounded-xl border border-secondary-bg p-5 ${className}`}
    >
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div
      className="flex flex-col gap-6 h-full"
      role="status"
      aria-label="Loading dashboard"
    >
      <div className="bg-white rounded-xl border border-secondary-bg p-5 flex items-center gap-5">
        <Skeleton className="h-14 flex-1" />
      </div>

      <PanelSkeleton />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <PanelSkeleton className="h-full" />
        <div className="space-y-6">
          <PanelSkeleton />
          <PanelSkeleton />
        </div>
      </div>
    </div>
  );
}

export default DashboardSkeleton;
