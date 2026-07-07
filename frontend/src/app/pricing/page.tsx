'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '../../hooks/useTheme';
import { CheckCircle2, Zap, Star, AlertCircle, ArrowLeft, Sparkles, Shield, Users, FolderKanban, HardDrive } from 'lucide-react';

import { PLAN_FEATURES, PLAN_LIMITS } from '../../lib/plans';

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
    description: 'Para começar e validar sua rotina de projetos.',
    price: 0,
    period: 'sempre',
    features: PLAN_FEATURES.free.map((f) =>
      f.value ? `${f.name}: ${f.value}` : f.name,
    ),
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
    features: PLAN_FEATURES.pro.map((f) =>
      f.value ? `${f.name}: ${f.value}` : f.name,
    ),
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

  function handleBack() {
    const token = localStorage.getItem('zent_token');
    if (!token) {
      router.push('/');
      return;
    }
    router.back();
  }

  function handleUpgrade(planId: string) {
    if (planId === 'free') {
      router.push('/dashboard');
      return;
    }
    router.push('/billing/checkout?plan=pro');
  }

  const faqItems = [
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
  ];

  const limitIcons = {
    workspaces: FolderKanban,
    members: Users,
    projects: FolderKanban,
    storage: HardDrive,
  };

  return (
    <main className={`relative min-h-screen overflow-x-hidden ${themeClasses.bg.primary}`}>
      {/* Background Decorativo */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/5 blur-[80px]" />
      </div>

      <div className="relative z-10">
        {/* Back Button */}
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleBack}
            className={`group inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${themeClasses.bg.subtle} ${themeClasses.border.primary} ${themeClasses.text.secondary} hover:border-violet-500/30 hover:text-violet-400 hover:shadow-md`}
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
            <span>Voltar</span>
          </button>
        </div>

        {/* Hero Section */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-16 lg:mb-20">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm font-semibold text-violet-400 shadow-lg shadow-violet-500/10">
              <Sparkles className="h-4 w-4" />
              Planos e preços
            </div>

            {/* Title */}
            <h1 className={`text-4xl font-bold leading-tight tracking-tight sm:text-6xl ${themeClasses.text.primary}`}>
              Planos simples e{' '}
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                transparentes
              </span>
            </h1>

            {/* Description */}
            <p className={`mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg ${themeClasses.text.tertiary}`}>
              Escolha o plano perfeito para sua equipe. Sem taxas ocultas, sem surpresas.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="mx-auto mb-16 grid max-w-5xl grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex min-w-0 flex-col rounded-3xl p-6 transition-all duration-300 sm:p-8 ${
                  plan.highlight
                    ? 'border-2 border-violet-500 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 shadow-2xl shadow-violet-500/20 hover:shadow-violet-500/30'
                    : `border ${themeClasses.border.primary} ${themeClasses.bg.subtle} hover:border-violet-500/30 hover:shadow-xl`
                }`}
              >
                {/* Popular Badge */}
                {plan.highlight && (
                  <div className="absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-2 text-sm font-bold text-white shadow-xl shadow-violet-500/30">
                    <Star className="h-4 w-4 fill-white" />
                    Mais popular
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-5 pt-3">
                  <h3 className={`text-2xl font-bold ${themeClasses.text.primary} sm:text-3xl`}>
                    {plan.name}
                  </h3>
                  <p className={`mt-2 text-sm leading-relaxed ${themeClasses.text.tertiary}`}>
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-5">
                  <div className="flex items-end gap-2">
                    <span className={`text-5xl font-bold leading-none tracking-tight sm:text-6xl ${themeClasses.text.primary}`}>
                      {plan.price === 0 ? 'Grátis' : `R$${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className={`pb-1.5 text-base sm:text-lg ${themeClasses.text.tertiary}`}>
                        /{plan.period}
                      </span>
                    )}
                  </div>
                  {plan.id === 'pro' && (
                    <p className={`mt-2 text-sm font-medium text-violet-400`}>
                      ✨ Trial gratuito de 14 dias
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  className={`mb-5 w-full rounded-2xl px-6 py-4 text-base font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/40 active:scale-[0.98] ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02]'
                      : `border-2 ${themeClasses.border.primary} ${themeClasses.text.primary} hover:border-violet-500/40 hover:bg-violet-500/5`
                  }`}
                >
                  {plan.cta}
                </button>

                {/* Trial Warning - só Pro */}
                {plan.id === 'pro' && (
                  <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-amber-400">
                        Período de avaliação
                      </p>
                      <p className={`mt-1 text-sm leading-relaxed ${themeClasses.text.secondary}`}>
                        Durante o trial de 14 dias, o acesso à API e suporte 24/7 não estarão disponíveis.
                      </p>
                    </div>
                  </div>
                )}

                {/* Features - AGORA mais próximas do botão */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <p className={`text-xs font-semibold uppercase tracking-wider ${themeClasses.text.secondary}`}>
                      Incluso no plano
                    </p>
                    <div className={`h-px flex-1 bg-gradient-to-r ${themeClasses.border.primary} to-transparent`} />
                  </div>

                  <div className="space-y-2">
                    {plan.features.map((feature, index) => {
                      const [label, ...rest] = feature.split(':');
                      const value = rest.join(':').trim();
                      const hasValue = value.length > 0;

                      return (
                        <div
                          key={index}
                          className={`flex min-w-0 items-start gap-3 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 transition-all duration-200 hover:border-violet-500/25 hover:bg-violet-500/5`}
                        >
                          <div className="rounded-full bg-emerald-500/10 p-1 mt-0.5">
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                          </div>

                          <div className="min-w-0 flex-1">
                            {hasValue ? (
                              <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                                <span className={`break-words text-sm font-medium ${themeClasses.text.secondary}`}>
                                  {label.trim()}
                                </span>
                                <span className={`w-fit max-w-full break-words rounded-lg border ${themeClasses.border.primary} ${themeClasses.bg.primary} px-2.5 py-1 text-sm font-bold text-violet-400`}>
                                  {value}
                                </span>
                              </div>
                            ) : (
                              <p className={`break-words text-sm font-medium leading-relaxed ${themeClasses.text.secondary}`}>
                                {feature}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Limits - no final */}
                {plan.limits && (
                  <div className={`mt-6 rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.primary}/50 p-4 sm:p-5`}>
                    <p className={`mb-4 text-xs font-semibold uppercase tracking-wider ${themeClasses.text.secondary}`}>
                      Limites do plano
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(plan.limits).map(([key, value]) => {
                        const Icon = limitIcons[key as keyof typeof limitIcons] || HardDrive;
                        return (
                          <div
                            key={key}
                            className={`rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-3.5 transition-all duration-200 hover:border-violet-500/20`}
                          >
                            <Icon className="h-4 w-4 text-violet-400 mb-2" />
                            <p className={`text-[11px] font-medium uppercase tracking-wider ${themeClasses.text.tertiary}`}>
                              {key === 'workspaces' ? 'Workspaces' : key === 'members' ? 'Membros' : key === 'projects' ? 'Projetos' : 'Storage'}
                            </p>
                            <p className={`mt-1 text-base font-bold ${themeClasses.text.primary}`}>
                              {value}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <h2 className={`text-3xl font-bold tracking-tight sm:text-4xl ${themeClasses.text.primary}`}>
                Perguntas frequentes
              </h2>
              <p className={`mt-3 text-sm sm:text-base ${themeClasses.text.tertiary}`}>
                Tudo que você precisa saber sobre nossos planos
              </p>
            </div>

            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <details
                  key={index}
                  className={`group cursor-pointer rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} transition-all duration-200 hover:border-violet-500/30 [&[open]]:border-violet-500/40 [&[open]]:bg-violet-500/5`}
                >
                  <summary className={`flex items-center justify-between gap-4 px-5 py-4 font-semibold ${themeClasses.text.primary} list-none`}>
                    <span className="text-sm leading-relaxed sm:text-base">{item.q}</span>
                    <span className={`flex-shrink-0 text-lg transition-transform duration-200 group-[&[open]]:rotate-45 ${themeClasses.text.tertiary}`}>
                      +
                    </span>
                  </summary>
                  <div className={`px-5 pb-5 text-sm leading-relaxed ${themeClasses.text.tertiary}`}>
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* CTA Final */}
          <div className="mt-16 text-center sm:mt-20">
            <div className={`mx-auto max-w-2xl rounded-3xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-8 sm:p-12`}>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
                <Zap className="h-8 w-8 text-violet-400" />
              </div>
              <h3 className={`text-2xl font-bold sm:text-3xl ${themeClasses.text.primary}`}>
                Pronto para começar?
              </h3>
              <p className={`mt-3 text-sm sm:text-base ${themeClasses.text.tertiary}`}>
                Crie sua conta gratuita e comece a organizar seus projetos hoje mesmo.
              </p>
              <button
                onClick={() => router.push('/signup')}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-violet-500/30 transition-all duration-200 hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="h-5 w-5" />
                Criar conta grátis
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}