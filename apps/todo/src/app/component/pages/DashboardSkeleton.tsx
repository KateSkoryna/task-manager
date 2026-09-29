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
      className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto"
      role="status"
      aria-label="Loading dashboard"
    >
      <div className="bg-surface rounded-xl border border-default p-3 flex items-center gap-4">
        <Skeleton className="h-10 flex-1" />
      </div>

      <PanelSkeleton />

      <div className="grid min-h-0 grid-cols-1 lg:grid-cols-5 gap-3 flex-1">
        <div className="flex min-h-0 flex-col gap-3 lg:col-span-2">
          <PanelSkeleton />
          <PanelSkeleton className="min-h-0 flex-1" />
        </div>
        <PanelSkeleton className="min-h-0 h-full lg:col-span-3" />
      </div>
    </div>
  );
}

export default DashboardSkeleton;
