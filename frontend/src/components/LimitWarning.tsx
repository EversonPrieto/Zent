'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '../hooks/useTheme';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface LimitWarningProps {
  title: string;
  description: string;
  current: number;
  limit: number;
  itemName: string;
  showUpgradeButton?: boolean;
}

export function LimitWarning({
  title,
  description,
  current,
  limit,
  itemName,
  showUpgradeButton = true,
}: LimitWarningProps) {
  const router = useRouter();
  const { themeClasses } = useTheme();
  const percentage = (current / limit) * 100;
  const isNearLimit = percentage > 80;
  const isAtLimit = current >= limit;

  if (!isNearLimit && !isAtLimit) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border p-4 flex items-start gap-4 ${
        isAtLimit
          ? 'border-red-500/30 bg-red-500/10'
          : 'border-amber-500/30 bg-amber-500/10'
      }`}
    >
      <AlertCircle
        className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
          isAtLimit ? 'text-red-400' : 'text-amber-400'
        }`}
      />
      <div className="flex-1 min-w-0">
        <h3
          className={`font-semibold ${
            isAtLimit ? 'text-red-400' : 'text-amber-400'
          }`}
        >
          {title}
        </h3>
        <p
          className={`text-sm mt-1 ${
            isAtLimit ? 'text-red-300' : 'text-amber-300'
          }`}
        >
          {description}
        </p>
        <div className="mt-2 text-xs">
          <p className={isAtLimit ? 'text-red-300' : 'text-amber-300'}>
            Você está usando <span className="font-semibold">{current}</span> de{' '}
            <span className="font-semibold">{limit}</span> {itemName}
          </p>
        </div>
      </div>

      {showUpgradeButton && isAtLimit && (
        <button
          onClick={() => router.push('/pricing')}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap"
        >
          Atualizar
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
