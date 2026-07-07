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
        <p className={`text-sm font-medium ${themeClasses.text.primary}`}>
          {label}
        </p>

        <p
          className={`text-sm ${
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

      <div className={`h-2 overflow-hidden rounded-full ${themeClasses.bg.tertiary}`}>
        <div
          className={`h-full transition-all ${
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
        <div className="flex items-center gap-2 text-xs text-red-400">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <div
          className={`relative flex min-w-0 flex-col rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-4 sm:p-6`}
        >
          {currentPlan === 'free' && (
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Seu plano atual
            </div>
          )}

          <div className="mb-5">
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.primary}`}
              >
                <Sparkles className="h-5 w-5 text-zinc-400" />
              </div>

              <div className="min-w-0">
                <h3
                  className={`text-xl font-bold leading-tight sm:text-2xl ${themeClasses.text.primary}`}
                >
                  Plano Gratuito
                </h3>
                <p className={`mt-1 text-sm ${themeClasses.text.secondary}`}>
                  Perfeito para começar
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-2.5">
            {PLAN_FEATURES.free.map((feature: any, idx: number) => (
              <div
                key={idx}
                className={`flex min-w-0 items-start gap-3 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} p-3`}
              >
                <span className="mt-0.5 flex-shrink-0 text-lg leading-none">
                  {feature.icon}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={`break-words text-sm font-medium ${themeClasses.text.primary}`}
                  >
                    {feature.name}
                  </p>

                  <p
                    className={`mt-0.5 break-words text-xs leading-relaxed ${themeClasses.text.secondary}`}
                  >
                    {feature.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`relative flex min-w-0 flex-col overflow-hidden rounded-2xl border-2 border-violet-500/30 ${themeClasses.bg.secondary} p-4 pt-12 sm:p-6 sm:pt-14`}>
          <div className="absolute right-0 top-0 rounded-bl-2xl bg-gradient-to-r from-violet-500 to-indigo-500 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white sm:px-4 sm:text-xs">
            Recomendado
          </div>

          {currentPlan === 'pro' && (
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Seu plano atual
            </div>
          )}

          <div className="mb-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/10">
                <Crown className="h-5 w-5 text-violet-400" />
              </div>

              <div className="min-w-0">
                <h3
                  className={`text-xl font-bold leading-tight sm:text-2xl ${themeClasses.text.primary}`}
                >
                  Plano Pro
                </h3>
                <p className={`mt-1 text-sm ${themeClasses.text.secondary}`}>
                  Para profissionais e equipes
                </p>
              </div>
            </div>
          </div>

          {currentPlan === 'pro' && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 sm:p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />

              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-300">
                  Aviso do Trial de 14 dias
                </p>

                <p
                  className={`mt-1 break-words text-sm leading-relaxed ${themeClasses.text.secondary}`}
                >
                  No trial gratuito de 14 dias, não haverá acesso à API e
                  suporte 24/7.
                </p>
              </div>
            </div>
          )}

          <div className="flex-1 space-y-2.5">
            {PLAN_FEATURES.pro.map((feature: any, idx: number) => (
              <div
                key={idx}
                className={`flex min-w-0 items-start gap-3 rounded-xl border p-3 ${
                  feature.highlight
                    ? 'border-violet-500/30 bg-violet-500/10'
                    : `${themeClasses.border.primary} ${themeClasses.bg.primary}`
                }`}
              >
                <span className="mt-0.5 flex-shrink-0 text-lg leading-none">
                  {feature.icon}
                </span>

                <div className="min-w-0 flex-1">
                  <p
                    className={`break-words text-sm font-medium ${themeClasses.text.primary}`}
                  >
                    {feature.name}
                  </p>

                  <p
                    className={`mt-0.5 break-words text-xs leading-relaxed ${
                      feature.highlight
                        ? 'text-violet-400'
                        : themeClasses.text.secondary
                    }`}
                  >
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