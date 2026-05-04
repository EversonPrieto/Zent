'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '../../hooks/useTheme';
import { CheckCircle2, Zap, Users, Infinity, Star } from 'lucide-react';

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

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    description: 'Perfeito para começar',
    price: 0,
    period: 'sempre',
    features: [
      '1 Workspace',
      'Até 5 membros',
      'Projetos ilimitados',
      'Tasks ilimitadas',
      'Comentários e atividades',
      'Suporte por email',
    ],
    cta: 'Começar Agora',
    limits: {
      workspaces: '1',
      members: '5',
      projects: 'Ilimitados',
      storage: '1GB',
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para equipes crescentes',
    price: 29,
    period: 'mês',
    highlight: true,
    features: [
      'Workspaces ilimitadas',
      'Membros ilimitados',
      'Projetos ilimitados',
      'Tasks ilimitadas',
      'Comentários e atividades avançadas',
      'Integração com Slack',
      'Webhooks customizados',
      'Suporte prioritário 24/7',
      'Advanced analytics',
      'Custom branding',
    ],
    cta: 'Começar Trial Gratuito',
    limits: {
      workspaces: 'Ilimitadas',
      members: 'Ilimitados',
      projects: 'Ilimitados',
      storage: '100GB',
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
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-4">
            Planos Simples e Transparentes
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Escolha o plano perfeito para sua equipe. Sem taxas ocultas.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl transition-all ${
                plan.highlight
                  ? 'border-2 border-violet-500 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 scale-105 md:scale-105'
                  : 'border border-white/10 bg-white/5'
              } p-8 hover:border-violet-500/50`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-1.5 text-sm font-semibold text-white">
                  <Star className="h-4 w-4" />
                  Mais Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-zinc-400 text-sm">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    {plan.price === 0 ? 'Gratuito' : `R$ ${plan.price}`}
                  </span>
                  {plan.period && plan.price > 0 && (
                    <span className="text-zinc-400">/{plan.period}</span>
                  )}
                </div>
              </div>

              {plan.limits && (
                <div className="mb-8 rounded-lg bg-white/5 p-4 space-y-3">
                  <p className="text-xs font-semibold text-zinc-300 uppercase">Limites</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-zinc-400">Workspaces</p>
                      <p className="text-white font-semibold">{plan.limits.workspaces}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400">Membros</p>
                      <p className="text-white font-semibold">{plan.limits.members}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400">Projetos</p>
                      <p className="text-white font-semibold">{plan.limits.projects}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400">Storage</p>
                      <p className="text-white font-semibold">{plan.limits.storage}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => handleUpgrade(plan.id)}
                className={`w-full rounded-lg py-3 font-semibold transition-all mb-8 ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:scale-105 shadow-lg shadow-violet-500/25'
                    : 'border border-white/10 text-white hover:border-white/20 hover:bg-white/5'
                }`}
              >
                {plan.cta}
              </button>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-zinc-300 uppercase">Incluso</p>
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Perguntas Frequentes</h2>
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
                className="rounded-lg border border-white/10 bg-white/5 p-4 cursor-pointer hover:border-white/20 transition-colors"
              >
                <summary className="font-semibold text-white flex items-center justify-between">
                  {item.q}
                  <span className="text-zinc-400">+</span>
                </summary>
                <p className="mt-3 text-zinc-400">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-zinc-400 mb-4">Pronto para começar?</p>
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
