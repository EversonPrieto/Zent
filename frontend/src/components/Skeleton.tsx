'use client';

type SkeletonVariant = 
  | 'card' 
  | 'line' 
  | 'avatar' 
  | 'button' 
  | 'input' 
  | 'heading' 
  | 'text'
  | 'badge'
  | 'icon'
  | 'kanban'
  | 'project'
  | 'activity';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
  animate?: boolean;
}

function getVariantClasses(variant: SkeletonVariant): string {
  const baseClasses = 'bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%] animate-shimmer rounded';
  
  switch (variant) {
    case 'avatar':
      return `${baseClasses} h-10 w-10 rounded-full`;
    case 'button':
      return `${baseClasses} h-9 w-20 rounded-lg`;
    case 'input':
      return `${baseClasses} h-10 w-full rounded-lg`;
    case 'heading':
      return `${baseClasses} h-8 w-3/4 rounded-lg`;
    case 'text':
      return `${baseClasses} h-4 w-full rounded`;
    case 'badge':
      return `${baseClasses} h-6 w-16 rounded-full`;
    case 'icon':
      return `${baseClasses} h-8 w-8 rounded-lg`;
    case 'kanban':
      return `${baseClasses} h-32 w-full rounded-xl`;
    case 'project':
      return `${baseClasses} h-40 w-full rounded-xl`;
    case 'activity':
      return `${baseClasses} h-20 w-full rounded-lg`;
    case 'line':
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
  animate = true,
}: SkeletonProps) {
  const variantClasses = getVariantClasses(variant);
  const widthStyle = width ? (typeof width === 'number' ? `${width}px` : width) : '';
  const heightStyle = height ? (typeof height === 'number' ? `${height}px` : height) : '';
  const styleClasses = `${widthStyle ? `w-[${widthStyle}]` : ''} ${heightStyle ? `h-[${heightStyle}]` : ''}`.trim();
  const animationClass = animate ? 'animate-shimmer' : '';
  const combinedClasses = `${variantClasses} ${styleClasses} ${animationClass} ${className}`.trim();

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

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton variant="heading" width="60%" />
          <Skeleton variant="text" width="80%" />
        </div>
        <Skeleton variant="badge" />
      </div>
      <Skeleton variant="line" count={2} />
      <div className="flex gap-2 pt-2">
        <Skeleton variant="button" width="80px" />
        <Skeleton variant="button" width="80px" />
      </div>
    </div>
  );
}

export function SkeletonMember() {
  return (
    <div className="group rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 transition-all">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Skeleton variant="avatar" />
          <div className="space-y-2">
            <Skeleton variant="text" width="150px" height="18px" />
            <Skeleton variant="text" width="200px" height="14px" />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton variant="button" width="100px" />
          <Skeleton variant="button" width="80px" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTask() {
  return (
    <div className="group rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1">
          <Skeleton variant="icon" width="16px" height="16px" />
          <Skeleton variant="text" width="70%" height="16px" />
        </div>
        <Skeleton variant="badge" width="60px" />
      </div>
      <Skeleton variant="text" width="90%" />
      <div className="flex items-center gap-2 pt-2">
        <Skeleton variant="icon" width="12px" height="12px" />
        <Skeleton variant="text" width="100px" height="12px" />
      </div>
    </div>
  );
}

export function SkeletonKanbanColumn() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton variant="icon" width="20px" height="20px" />
          <Skeleton variant="heading" width="80px" height="20px" />
        </div>
        <Skeleton variant="badge" width="32px" height="20px" />
      </div>
      <div className="space-y-3">
        <SkeletonTask />
        <SkeletonTask />
        <SkeletonTask />
      </div>
      <Skeleton variant="button" width="100%" height="36px" className="mt-3" />
    </div>
  );
}

export function SkeletonProject() {
  return (
    <div className="group rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
          <Skeleton variant="icon" width="20px" height="20px" />
        </div>
        <Skeleton variant="badge" width="60px" />
      </div>
      <Skeleton variant="heading" width="80%" />
      <Skeleton variant="text" count={2} />
      <div className="mt-2 flex items-center justify-between pt-2 border-t border-white/10">
        <div className="flex items-center gap-1.5">
          <Skeleton variant="icon" width="12px" height="12px" />
          <Skeleton variant="text" width="80px" height="12px" />
        </div>
        <Skeleton variant="text" width="40px" height="12px" />
      </div>
    </div>
  );
}

export function SkeletonActivity() {
  return (
    <div className="group rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-4">
      <div className="flex items-start gap-3">
        <Skeleton variant="avatar" width="32px" height="32px" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="80%" />
          <div className="flex items-center gap-2">
            <Skeleton variant="icon" width="12px" height="12px" />
            <Skeleton variant="text" width="100px" height="12px" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonModalHeader() {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="icon" width="40px" height="40px" className="rounded-lg" />
        <div className="space-y-2">
          <Skeleton variant="heading" width="200px" height="24px" />
          <Skeleton variant="text" width="300px" height="14px" />
        </div>
      </div>
      <Skeleton variant="button" width="80px" />
    </div>
  );
}

export function SkeletonDashboardHeader() {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <Skeleton variant="badge" width="100px" />
        <Skeleton variant="heading" width="250px" height="36px" />
        <Skeleton variant="text" width="300px" />
      </div>
      <Skeleton variant="button" width="140px" height="44px" className="rounded-xl" />
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <Skeleton variant="icon" width="20px" height="20px" />
            <Skeleton variant="heading" width="40px" height="28px" />
          </div>
          <Skeleton variant="text" width="80px" className="mt-2" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonComments() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton variant="heading" width="120px" height="24px" />
        <Skeleton variant="badge" width="40px" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Skeleton variant="avatar" width="32px" height="32px" />
              <div>
                <Skeleton variant="text" width="120px" height="16px" />
                <Skeleton variant="text" width="80px" height="12px" className="mt-1" />
              </div>
            </div>
            <Skeleton variant="icon" width="16px" height="16px" />
          </div>
          <Skeleton variant="text" count={2} className="mt-2" />
        </div>
      ))}
    </div>
  );
}
