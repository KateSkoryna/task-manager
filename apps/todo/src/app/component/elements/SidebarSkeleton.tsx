import Skeleton from './Skeleton';

const NAV_ITEM_COUNT = 6;

function SidebarSkeleton() {
  return (
    <div
      className="w-64 bg-dark-bg flex flex-col h-full shrink-0 rounded-tr-lg"
      role="status"
      aria-label="Loading navigation"
    >
      <div className="flex flex-col items-center gap-2 px-6 py-8 border-b border-white/10">
        <Skeleton className="w-14 h-14 rounded-full bg-white/20" />
        <Skeleton className="h-4 w-32 bg-white/20" />
        <Skeleton className="h-3 w-24 bg-white/20" />
      </div>

      <div className="flex-1 px-3 py-4 space-y-1">
        {Array.from({ length: NAV_ITEM_COUNT }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full bg-white/10" />
        ))}
      </div>

      <div className="px-3 pb-6">
        <Skeleton className="h-11 w-full bg-white/10" />
      </div>
    </div>
  );
}

export default SidebarSkeleton;
