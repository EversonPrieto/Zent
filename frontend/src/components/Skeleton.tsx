'use client';

type SkeletonVariant = 'card' | 'line' | 'avatar' | 'button' | 'input' | 'heading' | 'text';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string;
  height?: string;
  count?: number;
  className?: string;
}

function getVariantClasses(variant: SkeletonVariant): string {
  const baseClasses = 'bg-zinc-800 rounded animate-pulse';
  
  switch (variant) {
    case 'avatar':
      return `${baseClasses} h-10 w-10 rounded-full`;
    case 'button':
      return `${baseClasses} h-9 w-20 rounded-lg`;
    case 'input':
      return `${baseClasses} h-10 w-full rounded-lg`;
    case 'heading':
      return `${baseClasses} h-6 w-3/4 rounded`;
    case 'text':
      return `${baseClasses} h-4 w-full rounded`;
    case 'line':
      return `${baseClasses} h-4 w-full rounded`;
    case 'card':
    default:
      return `${baseClasses} h-32 w-full rounded-lg`;
  }
}

export function Skeleton({
  variant = 'line',
  width,
  height,
  count = 1,
  className = '',
}: SkeletonProps) {
  const variantClasses = getVariantClasses(variant);
  const styleClasses = `${width ? `w-[${width}]` : ''} ${height ? `h-[${height}]` : ''}`.trim();
  const combinedClasses = `${variantClasses} ${styleClasses} ${className}`.trim();

  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={combinedClasses} />
        ))}
      </div>
    );
  }

  return <div className={combinedClasses} />;
}

// Compostos úteis
export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-3">
      <Skeleton variant="heading" width="60%" />
      <Skeleton variant="line" />
      <Skeleton variant="line" width="80%" />
    </div>
  );
}

export function SkeletonMember() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="avatar" />
        <div className="space-y-2">
          <Skeleton variant="text" width="150px" />
          <Skeleton variant="text" width="200px" height="12px" />
        </div>
      </div>
      <Skeleton variant="button" />
    </div>
  );
}

export function SkeletonTask() {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-2">
      <Skeleton variant="text" width="70%" />
      <div className="flex gap-2">
        <Skeleton variant="button" width="60px" />
        <Skeleton variant="button" width="60px" />
      </div>
    </div>
  );
}

export function SkeletonModalHeader() {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="space-y-2">
        <Skeleton variant="heading" width="40%" />
        <Skeleton variant="text" width="80%" height="12px" />
      </div>
      <Skeleton variant="button" width="80px" />
    </div>
  );
}
