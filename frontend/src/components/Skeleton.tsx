'use client';

import { useTheme } from '../hooks/useTheme';

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

export function Skeleton({
  variant = 'line',
  width,
  height,
  count = 1,
  className = '',
  animate = true,
}: SkeletonProps) {
  const { themeClasses } = useTheme();

  const isDark = !themeClasses.bg.subtle?.includes('bg-zinc-100') && 
                 !themeClasses.bg.subtle?.includes('bg-white') &&
                 !themeClasses.bg.subtle?.includes('bg-gray-100');
  
  const shimmerFrom = isDark
    ? 'from-zinc-800 via-zinc-700 to-zinc-800'
    : 'from-zinc-200 via-zinc-100 to-zinc-200';

  const baseClasses = `relative overflow-hidden bg-gradient-to-r ${shimmerFrom} bg-[length:200%_100%]`;

  const getVariantClasses = (v: SkeletonVariant): string => {
    switch (v) {
      case 'avatar':
        return `${baseClasses} h-10 w-10 rounded-full`;
      case 'button':
        return `${baseClasses} h-10 w-24 rounded-xl`;
      case 'input':
        return `${baseClasses} h-11 w-full rounded-xl`;
      case 'heading':
        return `${baseClasses} h-7 w-3/4 rounded-lg`;
      case 'text':
        return `${baseClasses} h-4 w-full rounded-md`;
      case 'badge':
        return `${baseClasses} h-6 w-16 rounded-full`;
      case 'icon':
        return `${baseClasses} h-8 w-8 rounded-lg`;
      case 'kanban':
        return `${baseClasses} h-32 w-full rounded-xl`;
      case 'project':
        return `${baseClasses} h-40 w-full rounded-xl`;
      case 'activity':
        return `${baseClasses} h-20 w-full rounded-xl`;
      case 'line':
      case 'card':
      default:
        return `${baseClasses} h-32 w-full rounded-xl`;
    }
  };

  const variantClasses = getVariantClasses(variant);
  const widthStyle = width ? (typeof width === 'number' ? `${width}px` : width) : undefined;
  const heightStyle = height ? (typeof height === 'number' ? `${height}px` : height) : undefined;
  
  const style: React.CSSProperties = {
    ...(widthStyle ? { width: widthStyle } : {}),
    ...(heightStyle ? { height: heightStyle } : {}),
  };

  const animationClass = animate ? 'animate-shimmer' : '';
  const combinedClasses = `${variantClasses} ${animationClass} ${className}`.trim();

  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={combinedClasses} style={style}>
            {animate && (
              <div className={`absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent ${isDark ? 'via-white/5' : 'via-white/40'} to-transparent`} />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={combinedClasses} style={style}>
      {animate && (
        <div className={`absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent ${isDark ? 'via-white/5' : 'via-white/40'} to-transparent`} />
      )}
    </div>
  );
}

export function SkeletonCard() {
  const { themeClasses } = useTheme();
  return (
    <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-5 space-y-4`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton variant="heading" width="60%" />
          <Skeleton variant="text" width="80%" />
        </div>
        <Skeleton variant="badge" />
      </div>
      <Skeleton variant="line" count={2} />
      <div className="flex gap-2 pt-2">
        <Skeleton variant="button" />
        <Skeleton variant="button" width="90px" />
      </div>
    </div>
  );
}

export function SkeletonMember() {
  const { themeClasses } = useTheme();
  return (
    <div className={`group rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-4`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Skeleton variant="avatar" />
          <div className="space-y-2">
            <Skeleton variant="text" width="140px" height="16px" />
            <Skeleton variant="text" width="200px" height="14px" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton variant="button" width="120px" />
          <Skeleton variant="button" width="80px" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTask() {
  const { themeClasses } = useTheme();
  return (
    <div className={`group rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-3.5 space-y-2.5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1">
          <Skeleton variant="icon" width="16px" height="16px" className="mt-0.5" />
          <Skeleton variant="text" width="70%" height="16px" />
        </div>
        <Skeleton variant="badge" width="60px" />
      </div>
      <div className="flex items-center gap-3 pl-7">
        <Skeleton variant="text" width="80px" height="12px" />
        <Skeleton variant="text" width="60px" height="12px" />
      </div>
    </div>
  );
}

export function SkeletonKanbanColumn() {
  const { themeClasses } = useTheme();
  return (
    <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-4`}>
      <div className="mb-4 flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <Skeleton variant="icon" width="24px" height="24px" className="rounded-lg" />
          <Skeleton variant="heading" width="100px" height="20px" />
        </div>
        <Skeleton variant="badge" width="32px" height="24px" />
      </div>
      <div className="space-y-2.5">
        <SkeletonTask />
        <SkeletonTask />
        <SkeletonTask />
      </div>
      <Skeleton variant="button" width="100%" height="40px" className="mt-4 rounded-xl" />
    </div>
  );
}

export function SkeletonProject() {
  const { themeClasses } = useTheme();
  return (
    <div className={`group rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-5 space-y-4`}>
      <div className="flex items-start justify-between">
        <Skeleton variant="icon" width="40px" height="40px" className="rounded-xl" />
        <Skeleton variant="badge" width="70px" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="heading" width="75%" />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="60%" />
      </div>
      <div className={`flex items-center justify-between pt-3 border-t ${themeClasses.border.primary}`}>
        <Skeleton variant="text" width="100px" height="12px" />
        <Skeleton variant="text" width="50px" height="12px" />
      </div>
    </div>
  );
}

export function SkeletonActivity() {
  const { themeClasses } = useTheme();
  return (
    <div className={`group rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-3.5`}>
      <div className="flex items-start gap-3">
        <Skeleton variant="icon" width="32px" height="32px" className="rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="80%" />
          <div className="flex items-center gap-2">
            <Skeleton variant="text" width="60px" height="12px" />
            <Skeleton variant="text" width="100px" height="12px" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonModalHeader() {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <Skeleton variant="icon" width="40px" height="40px" className="rounded-xl" />
        <div className="space-y-2">
          <Skeleton variant="heading" width="200px" height="24px" />
          <Skeleton variant="text" width="280px" height="14px" />
        </div>
      </div>
      <Skeleton variant="icon" width="32px" height="32px" className="rounded-lg" />
    </div>
  );
}

export function SkeletonDashboardHeader() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <Skeleton variant="badge" width="80px" />
        <Skeleton variant="heading" width="280px" height="36px" />
        <Skeleton variant="text" width="320px" />
      </div>
      <Skeleton variant="button" width="140px" height="44px" className="rounded-xl" />
    </div>
  );
}

export function SkeletonStats() {
  const { themeClasses } = useTheme();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-5`}>
          <div className="flex items-start justify-between">
            <Skeleton variant="icon" width="40px" height="40px" className="rounded-xl" />
            <Skeleton variant="heading" width="50px" height="32px" />
          </div>
          <Skeleton variant="text" width="80px" className="mt-3" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonComments() {
  const { themeClasses } = useTheme();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton variant="heading" width="120px" height="24px" />
        <Skeleton variant="badge" width="32px" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={`rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-4`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Skeleton variant="avatar" width="36px" height="36px" />
              <div>
                <Skeleton variant="text" width="100px" height="16px" />
                <Skeleton variant="text" width="80px" height="12px" className="mt-1" />
              </div>
            </div>
            <Skeleton variant="icon" width="16px" height="16px" />
          </div>
          <Skeleton variant="text" count={2} className="mt-3" />
        </div>
      ))}
    </div>
  );
}