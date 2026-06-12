'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '../../hooks/useTheme';
import { PlanComparison } from '../../components/PlanComparison';
import { CheckCircle2, Zap, Star } from 'lucide-react';

type Plan = {
  id: 'free' | 'pro';
  name: string;
  description: string;
  price: number;
  period: string;
  features: string[];
  cta: string;
  highlight?: boolean;
  limits?: {
    workspaces: string;
    members: string;
    projects: string;
    storage: string;
  };
};

import { PLAN_FEATURES, PLAN_LIMITS, PlanType } from '../../lib/plans';

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    description: 'Para começar e validar sua rotina de projetos.',
    price: 0,
    period: 'sempre',
    features: PLAN_FEATURES.free.map((f) => f.name + (f.value ? `: ${f.value}` : '')),
    cta: 'Começar Agora',
    limits: {
      workspaces: String(PLAN_LIMITS.free.workspaces),
      members: String(PLAN_LIMITS.free.teamMembers),
      projects: `até ${PLAN_LIMITS.free.projectsPerWorkspace}`,
      storage: `${PLAN_LIMITS.free.storageGB}GB`,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para times que precisam escalar e trabalhar com mais autonomia.',
    price: 29,
    period: 'mês',
    highlight: true,
    features: PLAN_FEATURES.pro.map((f) => f.name + (f.value ? `: ${f.value}` : '')),
    cta: 'Começar Trial Gratuito',
    limits: {
      workspaces: `até ${PLAN_LIMITS.pro.workspaces}`,
      members: `até ${PLAN_LIMITS.pro.teamMembers}`,
      projects: `até ${PLAN_LIMITS.pro.projectsPerWorkspace}`,
      storage: `${PLAN_LIMITS.pro.storageGB}GB`,
    },
  },
];


export default function PricingPage() {
  const router = useRouter();
  const { themeClasses } = useTheme();

  const handleUpgrade = (planId: string) => {
    if (planId === 'free') {
      router.push('/dashboard');
    } else {
      router.push('/billing/checkout?plan=pro');
    }
  };

  return (
    <main className={`min-h-screen ${themeClasses.bg.primary}`}>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className={`group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${themeClasses.bg.subtle} ${themeClasses.border.primary} border hover:${themeClasses.bg.hover}`}
        >
          <span className="transition-transform group-hover:-translate-x-0.5">←</span>
          <span>Voltar</span>
        </button>
      </div>


      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className={`text-4xl sm:text-5xl font-bold mb-4 ${themeClasses.text.primary}`}>
            Planos Simples e Transparentes
          </h1>
          <p className={`text-xl max-w-2xl mx-auto ${themeClasses.text.tertiary}`}>
            Escolha o plano perfeito para sua equipe. Sem taxas ocultas.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl transition-all ${
                plan.highlight
                  ? `border-2 border-violet-500 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 scale-105 md:scale-105 ${themeClasses.border.primary}`
                  : `border ${themeClasses.border.primary} ${themeClasses.bg.tertiary}`
              } p-8 hover:border-violet-500/50`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-1.5 text-sm font-semibold text-white">
                  <Star className="h-4 w-4" />
                  Mais Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-2xl font-bold ${themeClasses.text.primary} mb-2`}>{plan.name}</h3>
                <p className={`${themeClasses.text.tertiary} text-sm`}>{plan.description}</p>
              </div>


              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-bold ${themeClasses.text.primary}`}>
                    {plan.price === 0 ? 'Gratuito' : `R$ ${plan.price}`}
                  </span>
                  {plan.period && plan.price > 0 && (
                    <span className={themeClasses.text.tertiary}>/{plan.period}</span>
                  )}
                </div>
              </div>

              {plan.limits && (
                <div className={`mb-6 rounded-lg ${themeClasses.bg.subtle} p-4 space-y-3`}>
                  <p className={`text-xs font-semibold uppercase ${themeClasses.text.secondary}`}>Limites</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">

                    <div>
                      <p className={themeClasses.text.tertiary}>Workspaces</p>
                      <p className={`${themeClasses.text.primary} font-semibold`}>{plan.limits.workspaces}</p>
                    </div>
                    <div>
                      <p className={themeClasses.text.tertiary}>Membros</p>
                      <p className={`${themeClasses.text.primary} font-semibold`}>{plan.limits.members}</p>
                    </div>
                    <div>
                      <p className={themeClasses.text.tertiary}>Projetos</p>
                      <p className={`${themeClasses.text.primary} font-semibold`}>{plan.limits.projects}</p>
                    </div>
                    <div>
                      <p className={themeClasses.text.tertiary}>Storage</p>
                      <p className={`${themeClasses.text.primary} font-semibold`}>{plan.limits.storage}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => handleUpgrade(plan.id)}
                className={`w-full rounded-lg py-3 font-semibold transition-all mb-8 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:ring-offset-0 group ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/25 hover:scale-105 hover:shadow-violet-500/35'
                    : `border ${themeClasses.border.primary} ${themeClasses.text.primary} bg-transparent hover:border-violet-500/40 hover:bg-violet-500/10` 
                }`}
              >
                {plan.cta}
              </button>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <p className={`text-xs font-semibold uppercase ${themeClasses.text.secondary}`}>Incluso</p>
                  <div className={`h-px flex-1 ${themeClasses.border.primary} opacity-60`} />
                </div>

                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div
                      key={index}
                      className="group flex items-start gap-3 rounded-xl border border-white/0 bg-white/0 transition-colors hover:bg-white/5 hover:border-violet-500/25 px-3 py-2"
                    >
                      <div className="mt-0.5">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      </div>

                      <div className="flex-1">
                        {/* Destaque visual do texto e do valor (ex: "Projetos por workspace: até 3") */}
                        <p className={`text-[14px] leading-relaxed ${themeClasses.text.secondary}`}>
                          {feature.includes(':') ? (
                            (() => {
                              const [label, value] = feature.split(':').map((s) => s.trim());
                              return (
                                <span>
                                  <span className="text-[14px] opacity-80">{label}:</span>{' '}
                                  <span className={`text-[14px] font-semibold text-white/95 px-2 py-0.5 rounded-md border ${themeClasses.border.primary} border-opacity-20 bg-white/5`}>
                                    {value}
                                  </span>
                                </span>
                              );
                            })()
                          ) : (
                            feature
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto mt-16">
          <h2 className={`text-3xl font-bold mb-8 text-center ${themeClasses.text.primary}`}>Perguntas Frequentes</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Posso cancelar a qualquer momento?',
                a: 'Sim, sem penalidades. Cancele sua assinatura a qualquer momento no painel de configurações.',
              },
              {
                q: 'Qual é o período de avaliação do plano Pro?',
                a: '14 dias grátis. Sem necessidade de cartão de crédito para começar.',
              },
              {
                q: 'Vocês oferecem descontos para equipes grandes?',
                a: 'Sim! Entre em contato conosco para um orçamento personalizado.',
              },
              {
                q: 'Os dados são seguros?',
                a: 'Sim, todos os dados são criptografados em trânsito e em repouso com os melhores padrões de segurança.',
              },
            ].map((item, index) => (
              <details
                key={index}
                className={`rounded-lg border p-4 cursor-pointer transition-colors ${themeClasses.border.primary} ${themeClasses.bg.tertiary} hover:border-violet-500/30`}
              >
                <summary className={`font-semibold flex items-center justify-between ${themeClasses.text.primary}`}>
                  {item.q}
                  <span className={themeClasses.text.tertiary}>+</span>
                </summary>
                <p className={`mt-3 ${themeClasses.text.tertiary}`}>{item.a}</p>
              </details>
            ))}
          </div>
        </div>


        <div className="mt-16 text-center">
          <p className={`mb-4 ${themeClasses.text.tertiary}`}>Pronto para começar?</p>
          <button
            onClick={() => router.push('/signup')}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-8 py-3 font-semibold text-white hover:scale-105 transition-transform shadow-lg shadow-violet-500/25"
          >
            <Zap className="h-5 w-5" />
            Criar Conta Grátis
          </button>
        </div>
      </div>
    </main>
  );
}
