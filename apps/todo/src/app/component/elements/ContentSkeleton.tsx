import Skeleton from './Skeleton';

function ContentSkeleton() {
  return (
    <div
      className="h-full space-y-4"
      role="status"
      aria-label="Loading content"
    >
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default ContentSkeleton;
