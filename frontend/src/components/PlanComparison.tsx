'use client';

import { PLAN_LIMITS, PLAN_FEATURES, PlanType } from '../lib/plans';
import { useTheme } from '../hooks/useTheme';
import { AlertCircle, CheckCircle2, Crown, Sparkles } from 'lucide-react';

interface UsageLimitIndicatorProps {
  plan: PlanType;
  limitKey: keyof typeof PLAN_LIMITS[PlanType];
  currentCount: number;
  label: string;
}

export function UsageLimitIndicator({
  plan,
  limitKey,
  currentCount,
  label,
}: UsageLimitIndicatorProps) {
  const { themeClasses } = useTheme();
  const limit = PLAN_LIMITS[plan][limitKey] as number;
  const percentage = (currentCount / limit) * 100;
  const isNearLimit = percentage > 80;
  const isAtLimit = currentCount >= limit;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`text-sm font-semibold ${themeClasses.text.primary}`}>
          {label}
        </p>

        <p
          className={`text-sm font-bold ${
            isAtLimit
              ? 'text-red-400'
              : isNearLimit
                ? 'text-amber-400'
                : themeClasses.text.secondary
          }`}
        >
          {currentCount} / {limit}
        </p>
      </div>

      <div className={`h-2.5 overflow-hidden rounded-full ${themeClasses.bg.tertiary}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isAtLimit
              ? 'bg-red-500'
              : isNearLimit
                ? 'bg-amber-500'
                : 'bg-emerald-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {isAtLimit && (
        <div className="flex items-center gap-2 text-xs font-medium text-red-400">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Limite atingido</span>
        </div>
      )}
    </div>
  );
}

interface PlanComparisonProps {
  currentPlan: PlanType;
}

export function PlanComparison({ currentPlan }: PlanComparisonProps) {
  const { themeClasses } = useTheme();

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        {/* Free Plan */}
        <div className={`relative flex min-w-0 flex-col rounded-3xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-5 sm:p-6 transition-all duration-200 hover:shadow-lg`}>
          {currentPlan === 'free' && (
            <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Seu plano atual
            </div>
          )}

          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-500/10 ring-1 ring-white/5">
                <Sparkles className="h-5 w-5 text-zinc-400" />
              </div>
              <div className="min-w-0">
                <h3 className={`text-xl font-bold tracking-tight ${themeClasses.text.primary}`}>
                  Plano Gratuito
                </h3>
                <p className={`mt-0.5 text-xs ${themeClasses.text.tertiary}`}>
                  Perfeito para começar
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {PLAN_FEATURES.free.map((feature: any, idx: number) => (
              <div
                key={idx}
                className={`flex min-w-0 items-start gap-3 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} px-4 py-3 transition-all duration-200 hover:border-zinc-500/30`}
              >
                <span className="mt-0.5 flex-shrink-0 text-lg leading-none">
                  {feature.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`break-words text-sm font-semibold ${themeClasses.text.primary}`}>
                    {feature.name}
                  </p>
                  <p className={`mt-0.5 break-words text-xs ${themeClasses.text.tertiary}`}>
                    {feature.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pro Plan */}
        <div className={`relative flex min-w-0 flex-col overflow-hidden rounded-3xl border-2 border-violet-500/40 bg-gradient-to-br from-violet-500/5 to-indigo-500/5 p-5 pt-14 sm:p-6 sm:pt-16 shadow-lg shadow-violet-500/10 transition-all duration-200 hover:shadow-xl hover:shadow-violet-500/20`}>
          {/* Recommended Badge */}
          <div className="absolute right-0 top-0 rounded-bl-2xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
            Pro
          </div>

          {currentPlan === 'pro' && (
            <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Seu plano atual
            </div>
          )}

          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
                <Crown className="h-5 w-5 text-violet-400" />
              </div>
              <div className="min-w-0">
                <h3 className={`text-xl font-bold tracking-tight ${themeClasses.text.primary}`}>
                  Plano Pro
                </h3>
                <p className={`mt-0.5 text-xs ${themeClasses.text.tertiary}`}>
                  Para profissionais e equipes
                </p>
              </div>
            </div>
          </div>

          {currentPlan === 'pro' && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-400">
                  Período de avaliação
                </p>
                <p className={`mt-1 text-xs leading-relaxed ${themeClasses.text.secondary}`}>
                  Durante o trial de 14 dias, acesso à API e suporte 24/7 não estarão disponíveis.
                </p>
              </div>
            </div>
          )}

          <div className="flex-1 space-y-2">
            {PLAN_FEATURES.pro.map((feature: any, idx: number) => (
              <div
                key={idx}
                className={`flex min-w-0 items-start gap-3 rounded-xl border px-4 py-3 transition-all duration-200 ${
                  feature.highlight
                    ? 'border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20'
                    : `${themeClasses.border.primary} ${themeClasses.bg.primary} hover:border-violet-500/20`
                }`}
              >
                <span className="mt-0.5 flex-shrink-0 text-lg leading-none">
                  {feature.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`break-words text-sm font-semibold ${themeClasses.text.primary}`}>
                    {feature.name}
                  </p>
                  <p className={`mt-0.5 break-words text-xs ${
                    feature.highlight
                      ? 'text-violet-400 font-medium'
                      : themeClasses.text.tertiary
                  }`}>
                    {feature.value}
                  </p>
                </div>
                {feature.highlight && (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}