'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import {
  Activity,
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Flag,
  FolderKanban,
  Layers,
  Lock,
  MessageSquare,
  Moon,
  Paperclip,
  Shield,
  Sparkles,
  Star,
  Sun,
  Tag,
  Users,
  Zap,
} from 'lucide-react';

type ThemeName = 'dark' | 'light';

export default function HomePage() {
  const router = useRouter();
  const { theme, themeClasses } = useTheme();
  const [activeTheme, setActiveTheme] = useState<ThemeName>('dark');
  const isLightTheme = theme === 'light' || themeClasses.bg.primary === 'bg-white';

  function getCurrentTheme(): ThemeName {
    if (typeof window === 'undefined') return 'dark';

    const storedTheme = localStorage.getItem('zent_theme');

    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }

    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  useEffect(() => {
    const token = localStorage.getItem('zent_token');
    if (token) {
      router.push('/dashboard');
      return;
    }

    function syncTheme() {
      setActiveTheme(getCurrentTheme());
    }

    syncTheme();

    const observer = new MutationObserver(syncTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    window.addEventListener('theme-changed', syncTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener('theme-changed', syncTheme);
    };
  }, [router]);

  function toggleTheme() {
    const currentTheme = getCurrentTheme();
    const nextTheme: ThemeName = currentTheme === 'dark' ? 'light' : 'dark';

    localStorage.setItem('zent_theme', nextTheme);
    setActiveTheme(nextTheme);

    window.dispatchEvent(
      new CustomEvent('theme-changed', { detail: { theme: nextTheme } }),
    );
  }

  const features = [
    {
      icon: Layers,
      title: 'Workspaces separados',
      description:
        'Separe empresas, clientes ou times em ambientes isolados, com projetos, membros e permissões próprias.',
    },
    {
      icon: FolderKanban,
      title: 'Kanban completo',
      description:
        'Mova tasks por status, filtre prioridades, acompanhe responsáveis e organize entregas sem planilhas soltas.',
    },
    {
      icon: MessageSquare,
      title: 'Comentários e anexos',
      description:
        'Centralize conversas, arquivos e contexto dentro da task, sem perder informação em chats paralelos.',
    },
    {
      icon: Activity,
      title: 'Activity log',
      description:
        'Veja quem criou, editou, moveu, comentou ou excluiu algo com histórico claro para todo o time.',
    },
    {
      icon: Shield,
      title: 'Permissões por função',
      description:
        'Controle quem pode criar, editar, deletar ou gerenciar membros com papéis como owner, admin e member.',
    },
    {
      icon: Bell,
      title: 'Prioridade e foco',
      description:
        'Use baixa, média, alta e urgente para ordenar o que realmente importa no fluxo do projeto.',
    },
  ];

  const kanbanColumns = [
    {
      title: 'A fazer',
      icon: Clock,
      dot: 'bg-zinc-400',
      tasks: [
        { title: 'Planejar sprint semanal', tag: 'Baixa', color: 'bg-blue-500/15 text-blue-300' },
        { title: 'Criar labels do projeto', tag: 'Média', color: 'bg-amber-500/15 text-amber-300' },
        { title: 'Revisar permissões', tag: 'Alta', color: 'bg-orange-500/15 text-orange-300' },
      ],
    },
    {
      title: 'Em progresso',
      icon: Zap,
      dot: 'bg-blue-400',
      tasks: [
        { title: 'Implementar modal de task', tag: 'Urgente', color: 'bg-red-500/15 text-red-300' },
        { title: 'Ajustar responsivo mobile', tag: 'Alta', color: 'bg-orange-500/15 text-orange-300' },
      ],
    },
    {
      title: 'Em revisão',
      icon: Flag,
      dot: 'bg-amber-400',
      tasks: [
        { title: 'Validar upload de anexos', tag: 'Média', color: 'bg-amber-500/15 text-amber-300' },
        { title: 'Conferir activity log', tag: 'Baixa', color: 'bg-blue-500/15 text-blue-300' },
      ],
    },
    {
      title: 'Concluído',
      icon: CheckCircle2,
      dot: 'bg-emerald-400',
      tasks: [
        { title: 'Criar workspace inicial', tag: 'Done', color: 'bg-emerald-500/15 text-emerald-300' },
        { title: 'Configurar membros', tag: 'Done', color: 'bg-emerald-500/15 text-emerald-300' },
      ],
    },
  ];

  const workflow = [
    {
      title: 'Crie seu workspace',
      description:
        'Separe o ambiente do time e mantenha membros, projetos e permissões organizados.',
    },
    {
      title: 'Monte os projetos',
      description:
        'Transforme objetivos em tasks com status, prazos, labels, responsáveis e prioridades.',
    },
    {
      title: 'Acompanhe tudo',
      description:
        'Use comentários, anexos e activity log para manter o contexto vivo até a entrega final.',
    },
  ];

  return (
    <main className={`min-h-screen overflow-x-hidden ${themeClasses.bg.primary} ${themeClasses.text.primary}`}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="absolute left-1/3 top-1/4 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
      </div>

      <header className={`fixed left-0 right-0 top-0 z-50 border-b ${themeClasses.border.primary} ${themeClasses.bg.primary}/95 backdrop-blur-xl`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-3 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <img src="/logo.png" alt="Zent" className="h-9 w-9 flex-shrink-0 rounded-xl" />
            <div className="min-w-0">
              <h1 className={`text-xl font-bold leading-tight sm:text-2xl ${themeClasses.text.primary}`}>
                Zent
              </h1>
              <p className={`hidden text-xs sm:block ${themeClasses.text.secondary}`}>
                Gestão para times modernos
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <a href="#features" className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${themeClasses.text.secondary} hover:text-violet-400`}>
              Recursos
            </a>
            <a href="#workflow" className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${themeClasses.text.secondary} hover:text-violet-400`}>
              Como funciona
            </a>
            <Link href="/pricing" className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${themeClasses.text.secondary} hover:text-violet-400`}>
              Planos
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={`inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${themeClasses.border.primary} ${themeClasses.bg.subtle} ${themeClasses.text.secondary} hover:border-violet-500/40 hover:text-violet-400 sm:border-0 sm:bg-transparent`}
            >
              Login
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} ${themeClasses.text.secondary} transition-colors hover:border-violet-500/40 hover:text-violet-400`}
              aria-label="Alternar tema"
              title="Alternar tema"
            >
              {activeTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <Link href="/signup" className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 sm:px-5">
              <span className="hidden sm:inline">Criar conta grátis</span>
              <span className="sm:hidden">Começar</span>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-3 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-36 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
          <div className="min-w-0">
            <div className={`inline-flex items-center rounded-full border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-3 py-1.5 text-xs font-medium backdrop-blur-sm sm:text-sm`}>
              <span className="relative mr-2 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Plataforma SaaS para organizar trabalho em equipe
            </div>

            <h2 className={`mt-7 max-w-4xl text-4xl font-black leading-[1.03] tracking-tight sm:text-6xl lg:text-7xl ${themeClasses.text.primary}`}>
              Projetos, Tasks e Time
              <span className="block bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                no mesmo Fluxo
              </span>
            </h2>

            <p className={`mt-6 max-w-2xl text-base leading-relaxed sm:text-lg ${themeClasses.text.tertiary}`}>
              O Zent junta Kanban, responsáveis, prioridades, comentários, anexos e histórico de atividades em uma experiência limpa para times que precisam sair do improviso.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/signup" className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-3.5 font-semibold text-white shadow-xl shadow-violet-500/25 transition-all hover:shadow-violet-500/40 sm:w-auto">
                Criar conta grátis
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link href="/pricing" className={`inline-flex w-full items-center justify-center rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-6 py-3.5 font-semibold ${themeClasses.text.primary} transition-all hover:border-violet-500/40 hover:bg-violet-500/10 sm:w-auto`}>
                Ver planos
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { value: '5', label: 'status de task' },
                { value: '5', label: 'níveis de prioridade' },
                { value: '24/7', label: 'histórico do time' },
              ].map((metric) => (
                <div key={metric.label} className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 backdrop-blur-sm`}>
                  <p className="text-2xl font-black text-violet-400">{metric.value}</p>
                  <p className={`mt-1 text-xs ${themeClasses.text.tertiary}`}>
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
              {['Multi-workspace', 'Kanban com drag and drop', 'Comentários e atividade'].map((item) => (
                <div key={item} className={`flex items-center gap-2 text-sm ${themeClasses.text.tertiary}`}>
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-w-0">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-r from-violet-500/25 to-indigo-500/25 blur-2xl" />

            <div className={`relative overflow-hidden rounded-[2rem] border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-3 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-4`}>
              <div className={`mb-3 flex items-center justify-between rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3`}>
                <div className="min-w-0">
                  <p className={`truncate text-sm font-semibold ${themeClasses.text.primary}`}>
                    Workspace Zent
                  </p>
                  <p className={`truncate text-xs ${themeClasses.text.tertiary}`}>
                    12 tasks ativas • última atividade há 2 min
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 sm:inline-flex">
                    Online
                  </span>
                  <div className="flex -space-x-2">
                    {['E', 'M', 'L'].map((name) => (
                      <div
                        key={name}
                        className={`relative isolate flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border text-xs font-black shadow-sm shadow-violet-500/10 ${
                          isLightTheme
                            ? 'border-violet-500/40 bg-white text-black'
                            : 'border-violet-500/30 bg-violet-500/20 text-white'
                        }`}
                      >
                        <span className="relative z-10 leading-none">
                          {name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 overflow-x-auto pb-1 lg:grid-cols-4">
                {kanbanColumns.map((column) => {
                  const Icon = column.icon;

                  return (
                    <div key={column.title} className={`min-w-[235px] rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.tertiary} p-3`}>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${column.dot}`} />
                          <h3 className={`truncate text-sm font-semibold ${themeClasses.text.primary}`}>
                            {column.title}
                          </h3>
                        </div>
                        <span className={`rounded-full ${themeClasses.bg.subtle} px-2 py-0.5 text-xs ${themeClasses.text.tertiary}`}>
                          {column.tasks.length}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {column.tasks.map((task, index) => (
                          <div key={task.title} className={`group rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-3 transition-all hover:border-violet-500/40 hover:bg-violet-500/5`}>
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <p className={`line-clamp-2 text-sm font-medium ${themeClasses.text.primary}`}>
                                {task.title}
                              </p>
                              {index === 0 && <Icon className="h-4 w-4 flex-shrink-0 text-violet-400" />}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${task.color}`}>
                                {task.tag}
                              </span>
                              <span className={`inline-flex items-center gap-1 text-[11px] ${themeClasses.text.muted}`}>
                                <MessageSquare className="h-3 w-3" />
                                {index + 1}
                              </span>
                              <span className={`inline-flex items-center gap-1 text-[11px] ${themeClasses.text.muted}`}>
                                <Paperclip className="h-3 w-3" />
                                {index}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: Tag, label: 'Labels' },
                  { icon: Calendar, label: 'Prazos' },
                  { icon: Users, label: 'Membros' },
                  { icon: Activity, label: 'Logs' },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.label} className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-3 py-2`}>
                      <Icon className="mb-1 h-4 w-4 text-violet-400" />
                      <p className={`text-xs font-medium ${themeClasses.text.secondary}`}>
                        {item.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className={`relative z-10 border-y ${themeClasses.border.primary}`}>
        <div className="mx-auto max-w-7xl px-3 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-400">
              <Sparkles className="h-3.5 w-3.5" />
              Feito para o fluxo real do time
            </div>

            <h3 className={`text-3xl font-black tracking-tight sm:text-5xl ${themeClasses.text.primary}`}>
              Menos planilha solta.
              <span className="block bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Mais execução.
              </span>
            </h3>

            <p className={`mt-4 text-sm leading-relaxed sm:text-lg ${themeClasses.text.tertiary}`}>
              Cada recurso foi pensado para diminuir ruído: quem faz, quando entrega, em qual status está e o que mudou.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div key={feature.title} className={`group relative overflow-hidden rounded-3xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-5 transition-all hover:border-violet-500/40 hover:shadow-2xl hover:shadow-violet-500/10 sm:p-6`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-indigo-500/0 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <div className="mb-5 inline-flex rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-3">
                      <Icon className="h-6 w-6 text-violet-400" />
                    </div>
                    <h4 className={`mb-2 text-xl font-bold ${themeClasses.text.primary}`}>
                      {feature.title}
                    </h4>
                    <p className={`text-sm leading-relaxed ${themeClasses.text.tertiary}`}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="workflow" className="relative z-10 mx-auto max-w-7xl px-3 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Processo simples
            </div>

            <h3 className={`text-3xl font-black tracking-tight sm:text-5xl ${themeClasses.text.primary}`}>
              Do planejamento ao deploy sem perder contexto.
            </h3>

            <p className={`mt-4 text-sm leading-relaxed sm:text-lg ${themeClasses.text.tertiary}`}>
              Uma ferramenta para tarefa, comentário, anexo e histórico. O Zent concentra tudo dentro da task.
            </p>
          </div>

          <div className="grid gap-4">
            {workflow.map((step, index) => (
              <div key={step.title} className={`relative rounded-3xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-5 sm:p-6`}>
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-lg font-black text-violet-400">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className={`text-lg font-bold ${themeClasses.text.primary}`}>
                      {step.title}
                    </h4>
                    <p className={`mt-1 text-sm leading-relaxed ${themeClasses.text.tertiary}`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`relative z-10 border-y ${themeClasses.border.primary}`}>
        <div className="mx-auto max-w-7xl px-3 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
              <Star className="h-3.5 w-3.5" />
              Comece pequeno, escale quando precisar
            </div>

            <h3 className={`text-3xl font-black tracking-tight sm:text-5xl ${themeClasses.text.primary}`}>
              Plano gratuito para começar.
              <span className="block bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Pro para crescer.
              </span>
            </h3>
          </div>

          <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
            {[
              {
                name: 'Gratuito',
                price: 'R$ 0',
                description: 'Para testar, estudar e organizar projetos pequenos.',
                items: ['1 workspace', 'Até 3 projetos', 'Até 5 membros'],
                href: '/signup',
              },
              {
                name: 'Pro',
                price: 'R$ 29',
                description: 'Para times que precisam escalar com mais controle.',
                items: ['Até 10 workspaces', 'Até 50 membros', 'Relatórios e suporte'],
                href: '/pricing',
              },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-3xl border ${plan.name === 'Pro' ? 'border-violet-500/40 bg-violet-500/10' : `${themeClasses.border.primary} ${themeClasses.bg.secondary}`} p-6`}>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h4 className={`text-2xl font-bold ${themeClasses.text.primary}`}>
                      {plan.name}
                    </h4>
                    <p className={`mt-2 text-sm leading-relaxed ${themeClasses.text.tertiary}`}>
                      {plan.description}
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-2xl font-black text-violet-400">
                    {plan.price}
                  </p>
                </div>

                <div className="space-y-2">
                  {plan.items.map((item) => (
                    <div key={item} className={`flex items-center gap-2 text-sm ${themeClasses.text.secondary}`}>
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                      {item}
                    </div>
                  ))}
                </div>

                <Link href={plan.href} className={`mt-6 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 font-semibold transition-all ${
                  plan.name === 'Pro'
                    ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40'
                    : `border ${themeClasses.border.primary} ${themeClasses.text.primary} hover:border-violet-500/40 hover:bg-violet-500/10`
                }`}>
                  {plan.name === 'Pro' ? 'Ver Pro' : 'Começar grátis'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-5xl px-3 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/20 blur-3xl" />

        <div className={`relative overflow-hidden rounded-[2rem] border ${themeClasses.border.primary} ${themeClasses.bg.secondary} px-5 py-10 shadow-2xl shadow-black/10 sm:px-10 sm:py-14`}>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15">
            <Lock className="h-7 w-7 text-violet-400" />
          </div>

          <h3 className={`text-3xl font-black leading-tight tracking-tight sm:text-5xl ${themeClasses.text.primary}`}>
            Organize seu time com mais clareza hoje.
          </h3>

          <p className={`mx-auto mt-5 max-w-2xl text-sm leading-relaxed sm:text-lg ${themeClasses.text.tertiary}`}>
            Crie uma conta, monte seu workspace e comece a acompanhar projetos, tasks, comentários e atividades em poucos minutos.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 px-8 py-4 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40">
              Criar conta gratuita
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link href="/pricing" className={`inline-flex items-center justify-center rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-8 py-4 font-semibold ${themeClasses.text.primary} transition-all hover:border-violet-500/40 hover:bg-violet-500/10`}>
              Comparar planos
            </Link>
          </div>

          <p className={`mt-6 text-xs sm:text-sm ${themeClasses.text.secondary}`}>
            • Cancelamento a qualquer momento • Feito para times pequenos e médios
          </p>
        </div>
      </section>

      <footer className={`relative z-10 border-t ${themeClasses.border.primary}`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-3 py-8 text-sm sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Zent" className="h-8 w-8 rounded-lg" />
              <div>
                <span className={`block font-semibold ${themeClasses.text.primary}`}>
                  Zent
                </span>
                <span className={`text-xs ${themeClasses.text.tertiary}`}>
                  Gestão para times modernos
                </span>
              </div>
            </div>

            <div className={`flex flex-wrap gap-4 ${themeClasses.text.tertiary}`}>
              <Link href="/pricing" className="transition-colors hover:text-violet-400">
                Planos
              </Link>
              <Link href="/login" className="transition-colors hover:text-violet-400">
                Entrar
              </Link>
              <Link href="/signup" className="transition-colors hover:text-violet-400">
                Criar conta
              </Link>
            </div>
          </div>

          <div className={`flex flex-col gap-2 border-t pt-5 text-xs sm:flex-row sm:items-center sm:justify-between ${themeClasses.border.primary} ${themeClasses.text.tertiary}`}>
            <p>
              © {new Date().getFullYear()} Everson Prieto. Todos os direitos reservados.
            </p>
            <p>
              Desenvolvido por Everson Prieto.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
