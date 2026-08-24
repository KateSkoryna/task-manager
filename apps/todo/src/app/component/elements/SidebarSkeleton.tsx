import Skeleton from './Skeleton';

const NAV_ITEM_COUNT = 6;

function SidebarSkeleton() {
  return (
    <div
      className="hidden h-full w-sidebar-tablet shrink-0 flex-col bg-sidebar md:flex lg:w-sidebar-desktop"
      role="status"
      aria-label="Loading navigation"
    >
      <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-5">
        <Skeleton className="size-avatar rounded-full bg-sidebar-text/20" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-32 bg-sidebar-text/20" />
          <Skeleton className="h-3 w-24 bg-sidebar-text/20" />
        </div>
      </div>

      <div className="flex-1 space-y-1 px-3 py-4">
        {Array.from({ length: NAV_ITEM_COUNT }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full bg-sidebar-text/10" />
        ))}
      </div>

      <div className="px-3 pb-6">
        <Skeleton className="h-11 w-full bg-sidebar-text/10" />
      </div>
    </div>
  );
}

export default SidebarSkeleton;
