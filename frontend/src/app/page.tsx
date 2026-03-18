'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">Zent</h1>
            <p className="text-sm text-zinc-400">
              Gestão de projetos e tarefas para times modernos
            </p>
          </div>

          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              Entrar
            </Link>

            <Link
              href="/signup"
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
            >
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
              Plataforma SaaS para equipes
            </span>

            <h2 className="mt-6 text-4xl font-bold leading-tight md:text-5xl">
              Organize projetos, tarefas e colaboração em um só lugar.
            </h2>

            <p className="mt-6 max-w-xl text-lg text-zinc-400">
              O Zent ajuda equipes a planejar projetos, acompanhar tarefas,
              comentar, mover cards no Kanban e centralizar a operação do time
              em uma experiência simples e moderna.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-xl bg-white px-5 py-3 font-medium text-black"
              >
                Começar agora
              </Link>

              <Link
                href="/login"
                className="rounded-xl border border-zinc-700 px-5 py-3 font-medium text-white hover:bg-zinc-900"
              >
                Já tenho conta
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-zinc-400">
              <span>✓ Multi-workspace</span>
              <span>✓ Kanban com drag and drop</span>
              <span>✓ Comentários e atividade</span>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Workspace Zent</h3>
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                Demo
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {[
                { title: 'A fazer', items: ['Landing page', 'Setup do projeto'] },
                { title: 'Em progresso', items: ['Kanban frontend'] },
                { title: 'Em revisão', items: ['Activity timeline'] },
                { title: 'Concluído', items: ['Auth JWT', 'Comments UI'] },
              ].map((column) => (
                <div
                  key={column.title}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold">{column.title}</h4>
                    <span className="text-xs text-zinc-500">
                      {column.items.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {column.items.map((item) => (
                      <div
                        key={item}
                        className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-300"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-800 bg-zinc-900/40">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10 text-center">
            <h3 className="text-3xl font-bold">Tudo que seu time precisa</h3>
            <p className="mt-3 text-zinc-400">
              Uma base moderna para gestão de trabalho em equipe.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: 'Workspaces',
                description:
                  'Separe empresas, times e ambientes com isolamento por workspace.',
              },
              {
                title: 'Projetos e Tasks',
                description:
                  'Estruture o trabalho em projetos, cards e colunas Kanban.',
              },
              {
                title: 'Comentários',
                description:
                  'Centralize discussões dentro de cada task com contexto completo.',
              },
              {
                title: 'Activity Log',
                description:
                  'Acompanhe tudo o que aconteceu no projeto com histórico de ações.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
              >
                <h4 className="text-lg font-semibold">{feature.title}</h4>
                <p className="mt-2 text-sm text-zinc-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h3 className="text-3xl font-bold">
          Comece a organizar o trabalho do seu time hoje
        </h3>
        <p className="mt-4 text-zinc-400">
          Crie sua conta, monte seu workspace e acompanhe projetos com mais
          clareza e produtividade.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-xl bg-white px-5 py-3 font-medium text-black"
          >
            Criar conta
          </Link>

          <Link
            href="/login"
            className="rounded-xl border border-zinc-700 px-5 py-3 font-medium text-white hover:bg-zinc-900"
          >
            Entrar
          </Link>
        </div>
      </section>
    </main>
  );
}