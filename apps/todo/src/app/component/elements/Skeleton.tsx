import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={`rounded-md bg-secondary-bg ${
        prefersReducedMotion ? '' : 'animate-pulse'
      } ${className}`}
    />
  );
};

export default Skeleton;
