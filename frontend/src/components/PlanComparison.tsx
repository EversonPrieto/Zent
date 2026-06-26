'use client';

import { PLAN_LIMITS, PLAN_FEATURES, PlanType } from '../lib/plans';
import { useTheme } from '../hooks/useTheme';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

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
      <div className="flex items-center justify-between">
        <p className={`text-sm font-medium ${themeClasses.text.primary}`}>{label}</p>
        <p className={`text-sm ${isAtLimit ? 'text-red-400' : isNearLimit ? 'text-amber-400' : themeClasses.text.secondary}`}>
          {currentCount} / {limit}
        </p>
      </div>
      <div className={`h-2 rounded-full overflow-hidden ${themeClasses.bg.tertiary}`}>
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
          <AlertCircle className="h-3 w-3" />
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
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-6`}>
          <div className="mb-6">
            <h3 className={`text-2xl font-bold ${themeClasses.text.primary}`}>Plano Gratuito</h3>
            <p className={`text-sm ${themeClasses.text.secondary} mt-2`}>
              Perfeito para começar
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {PLAN_FEATURES.free.map((feature: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-lg">{feature.icon}</span>
                <div>
                  <p className={`text-sm font-medium ${themeClasses.text.primary}`}>{feature.name}</p>
                  <p className={`text-xs ${themeClasses.text.secondary}`}>{feature.value}</p>
                </div>
              </div>
            ))}
          </div>

          {currentPlan === 'free' && (
            <div className={`rounded-lg border ${themeClasses.border.primary} bg-emerald-500/10 p-3 text-center`}>
              <p className="text-sm font-medium text-emerald-400">✓ Seu plano atual</p>
            </div>
          )}
        </div>

        {/* Pro Plan */}
        <div className={`rounded-2xl border-2 border-violet-500/30 ${themeClasses.bg.secondary} p-6 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-xs font-bold">
            RECOMENDADO
          </div>

          <div className="mb-6">
            <h3 className={`text-2xl font-bold ${themeClasses.text.primary}`}>Plano Pro</h3>
            <p className={`text-sm ${themeClasses.text.secondary} mt-2`}>
              Para profissionais e equipes
            </p>
          </div>

          {currentPlan === 'pro' && (
            <div className={`mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3`}>
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-300">Aviso do Trial (14 dias)</p>
                <p className={`text-sm ${themeClasses.text.secondary}`}>
                  No trial gratuito de 14 dias, não haverá acesso à API e suporte 24/7.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3 mb-6">
            {PLAN_FEATURES.pro.map((feature: any, idx: number) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-2 rounded-lg ${
                  feature.highlight ? 'bg-violet-500/10' : ''
                }`}
              >
                <span className="text-lg">{feature.icon}</span>
                <div>
                  <p className={`text-sm font-medium ${themeClasses.text.primary}`}>{feature.name}</p>
                  <p className={`text-xs ${feature.highlight ? 'text-violet-400' : themeClasses.text.secondary}`}>
                    {feature.value}
                  </p>
                </div>
                {feature.highlight && (
                  <CheckCircle2 className="h-4 w-4 text-violet-400 ml-auto flex-shrink-0 mt-0.5" />
                )}
              </div>
            ))}
          </div>

          {currentPlan === 'pro' && (
            <div className={`rounded-lg border border-violet-500/30 bg-violet-500/10 p-3 text-center`}>
              <p className="text-sm font-medium text-violet-400">✓ Seu plano atual</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
