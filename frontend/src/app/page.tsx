'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { ArrowRight, CheckCircle2, Layers, MessageSquare, Activity, Briefcase } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { themeClasses } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem('zent_token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);
  const features = [
    {
      icon: Layers,
      title: 'Workspaces',
      description: 'Separe empresas, times e ambientes com isolamento completo por workspace.',
      color: 'from-violet-500/20 to-violet-500/5',
    },
    {
      icon: Briefcase,
      title: 'Projetos e Tasks',
      description: 'Estruture o trabalho em projetos, cards e colunas Kanban com arrastar e soltar.',
      color: 'from-blue-500/20 to-blue-500/5',
    },
    {
      icon: MessageSquare,
      title: 'Comentários',
      description: 'Centralize discussões dentro de cada task com contexto completo e menções.',
      color: 'from-emerald-500/20 to-emerald-500/5',
    },
    {
      icon: Activity,
      title: 'Activity Log',
      description: 'Acompanhe tudo o que aconteceu no projeto com histórico de ações em tempo real.',
      color: 'from-amber-500/20 to-amber-500/5',
    },
  ];

  const kanbanColumns = [
    { title: 'A fazer', items: ['Landing page', 'Setup do projeto', 'Design system'], color: 'border-l-2 border-l-zinc-500' },
    { title: 'Em progresso', items: ['Kanban frontend'], color: 'border-l-2 border-l-blue-500' },
    { title: 'Em revisão', items: ['Activity timeline'], color: 'border-l-2 border-l-amber-500' },
    { title: 'Concluído', items: ['Auth JWT', 'Comments UI'], color: 'border-l-2 border-l-emerald-500' },
  ];

  return (
    <main className={`min-h-screen ${themeClasses.bg.primary}`}>
      <header className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl ${themeClasses.border.primary} ${themeClasses.bg.primary}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Zent" className="h-8 w-8 rounded-lg" />
            <div>
              <h1 className={`text-2xl font-bold ${themeClasses.text.primary}`}>
                Zent
              </h1>
              <p className="text-xs text-zinc-500">
                Gestão para times modernos
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="group relative rounded-xl px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:text-white"
            >
              Planos
              <span className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 bg-white transition-all group-hover:w-1/2" />
            </Link>

            <Link
              href="/login"
              className="group relative rounded-xl px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:text-white"
            >
              Entrar
              <span className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 bg-white transition-all group-hover:w-1/2" />
            </Link>

            <Link
              href="/signup"
              className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40"
            >
              Criar conta grátis
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-6 pt-32 pb-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
        </div>

        <div className="relative grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Plataforma SaaS para equipes
            </div>

            <h2 className="mt-8 text-5xl font-bold leading-tight md:text-6xl">
              Organize projetos,
              <span className="block bg-gradient-to-r from-violet-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                tarefas e colaboração
              </span>
              em um só lugar.
            </h2>

            <p className="mt-6 max-w-xl text-lg text-zinc-400">
              O Zent ajuda equipes a planejar projetos, acompanhar tarefas,
              comentar, mover cards no Kanban e centralizar a operação do time
              em uma experiência simples e moderna.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40"
              >
                Começar agora
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 font-medium text-white transition-all hover:bg-white/10"
              >
                Já tenho conta
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-6">
              {['Multi-workspace', 'Kanban com drag and drop', 'Comentários e atividade'].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-zinc-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-violet-500/20 to-indigo-500/20 blur-2xl" />
            <div className="relative rounded-3xl border border-white/10 bg-zinc-900/50 p-6 backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Workspace Zent</h3>
                  <p className="text-xs text-zinc-500">Última atividade há 2 minutos</p>
                </div>
                <span className="rounded-full bg-gradient-to-r from-violet-500/20 to-indigo-500/20 px-3 py-1 text-xs font-medium text-violet-300">
                  Demo interativa
                </span>
              </div>

              <div className="grid gap-4 overflow-x-auto pb-2 md:grid-cols-4">
                {kanbanColumns.map((column) => (
                  <div
                    key={column.title}
                    className="min-w-[200px] rounded-2xl border border-white/10 bg-zinc-950/50 p-3 backdrop-blur-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className={`text-sm font-semibold ${column.color.split(' ')[1]}`}>
                        {column.title}
                      </h4>
                      <span className="text-xs text-zinc-500">
                        {column.items.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {column.items.map((item) => (
                        <div
                          key={item}
                          className="group relative rounded-xl border border-white/10 bg-zinc-900/80 p-3 text-sm text-zinc-300 transition-all hover:border-white/20 hover:bg-zinc-800/80"
                        >
                          {item}
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent to-white/5 opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 bg-gradient-to-b from-zinc-900/50 to-zinc-950">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mb-16 text-center">
            <h3 className="text-4xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Tudo que seu time precisa
            </h3>
            <p className="mt-4 text-lg text-zinc-400">
              Uma base moderna para gestão de trabalho em equipe.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 transition-all hover:border-white/20 hover:scale-105"
                >
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 transition-opacity group-hover:opacity-100`} />
                  <div className="relative">
                    <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-3">
                      <Icon className="h-6 w-6 text-violet-400" />
                    </div>
                    <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-5xl px-6 py-24 text-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-500/20 to-indigo-500/20 blur-3xl" />
        </div>
        
        <div className="relative">
          <h3 className="text-4xl font-bold leading-tight">
            Comece a organizar o trabalho
            <span className="block bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              do seu time hoje
            </span>
          </h3>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            Crie sua conta, monte seu workspace e acompanhe projetos com mais
            clareza e produtividade. 14 dias grátis, sem compromisso.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-8 py-4 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40"
            >
              Criar conta gratuita
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-8 py-4 font-medium text-white transition-all hover:bg-white/10"
            >
              Já tenho conta
            </Link>
          </div>

          <p className="mt-8 text-sm text-zinc-500">
            ✓ Sem cartão de crédito • ✓ Cancelamento a qualquer momento
          </p>
        </div>
      </section>
    </main>
  );
}