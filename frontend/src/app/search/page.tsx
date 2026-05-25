'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';
import { useTheme } from '../../hooks/useTheme';
import {
  Search,
  FileText,
  FolderKanban,
  Building2,
  Loader2,
  ArrowRight,
  X,
} from 'lucide-react';

type SearchResult = {
  id: string;
  title: string;
  type: 'task' | 'project' | 'workspace';
  description?: string;
  projectName?: string;
  status?: string;
};

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { themeClasses } = useTheme();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [workspaceId, setWorkspaceId] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'tasks' | 'projects' | 'workspaces'>('all');

  useEffect(() => {
    const wsId = localStorage.getItem('zent_workspace_id');
    if (wsId) {
      setWorkspaceId(wsId);
    }
  }, []);

  useEffect(() => {
    if (query.trim()) {
      search();
    } else {
      setResults([]);
    }
  }, [query, workspaceId]);

  async function search() {
    if (!query.trim()) return;

    try {
      setLoading(true);
      const allResults: SearchResult[] = [];

      try {
        const tasksData = await api(`/tasks?page=1&pageSize=100`, {
          workspaceId,
        });
        const tasks = tasksData.items || tasksData || [];

        tasks.forEach((task: any) => {
          if (task.title.toLowerCase().includes(query.toLowerCase())) {
            allResults.push({
              id: task.id,
              title: task.title,
              type: 'task',
              description: `Status: ${task.status} | Prioridade: ${task.priority}`,
              status: task.status,
            });
          }
        });
      } catch (err) {
        console.error('Erro ao buscar tasks:', err);
      }

      try {
        const projectsData = await api('/projects', { workspaceId });

        projectsData?.forEach((project: any) => {
          if (project.name.toLowerCase().includes(query.toLowerCase())) {
            allResults.push({
              id: project.id,
              title: project.name,
              type: 'project',
              description: project.description,
            });
          }
        });
      } catch (err) {
        console.error('Erro ao buscar projetos:', err);
      }

      try {
        const workspacesData = await api('/workspaces');

        workspacesData?.forEach((workspace: any) => {
          if (workspace.name.toLowerCase().includes(query.toLowerCase())) {
            allResults.push({
              id: workspace.id,
              title: workspace.name,
              type: 'workspace',
            });
          }
        });
      } catch (err) {
        console.error('Erro ao buscar workspaces:', err);
      }

      setResults(allResults);
    } finally {
      setLoading(false);
    }
  }

  const filteredResults =
    activeTab === 'all'
      ? results
      : results.filter((r) => r.type === activeTab.slice(0, -1));

  const taskCount = results.filter((r) => r.type === 'task').length;
  const projectCount = results.filter((r) => r.type === 'project').length;
  const workspaceCount = results.filter((r) => r.type === 'workspace').length;

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'task') {
      return;
    } else if (result.type === 'project') {
      router.push(`/dashboard/projects/${result.id}`);
    } else if (result.type === 'workspace') {
      localStorage.setItem('zent_workspace_id', result.id);
      router.push('/dashboard/overview');
    }
  };

  return (
    <main className={`min-h-screen ${themeClasses.bg.primary}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className={`mb-4 transition-colors ${themeClasses.text.tertiary} hover:${themeClasses.text.primary}`}
          >
            ← Voltar
          </button>
          <h1 className={`text-3xl sm:text-4xl font-bold ${themeClasses.text.primary}`}>
            Busca Global
          </h1>
          <p className={`mt-2 ${themeClasses.text.tertiary}`}>Procure por tasks, projetos e workspaces</p>
        </div>

        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className={`h-5 w-5 ${themeClasses.text.tertiary}`} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digitar para buscar... (Ctrl+K)"
              className={`w-full pl-12 pr-4 py-3 rounded-xl border outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 ${themeClasses.border.primary} ${themeClasses.bg.tertiary} ${themeClasses.text.primary}`}
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-colors ${themeClasses.text.tertiary} hover:${themeClasses.text.primary}`}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {query && (
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
              }`}
            >
              Tudo ({results.length})
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'tasks'
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
              }`}
            >
              Tasks ({taskCount})
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'projects'
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
              }`}
            >
              Projetos ({projectCount})
            </button>
            <button
              onClick={() => setActiveTab('workspaces')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'workspaces'
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                  : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
              }`}
            >
              Workspaces ({workspaceCount})
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        )}

        {!loading && query && (
          <>
            {filteredResults.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
                <Search className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Nenhum resultado encontrado</h3>
                <p className="text-zinc-400">
                  Tente ajustar sua busca ou procure por outro termo
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredResults.map((result) => {
                  let Icon = FileText;
                  if (result.type === 'project') Icon = FolderKanban;
                  if (result.type === 'workspace') Icon = Building2;

                  return (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full group rounded-xl border border-white/10 bg-white/5 p-4 hover:border-violet-500/50 hover:bg-white/10 transition-all text-left"
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-lg bg-violet-500/20 p-2 flex-shrink-0">
                          <Icon className="h-5 w-5 text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white truncate group-hover:text-violet-400 transition-colors">
                            {result.title}
                          </h4>
                          {result.description && (
                            <p className="text-sm text-zinc-400 truncate mt-1">{result.description}</p>
                          )}
                        </div>
                        <ArrowRight className="h-5 w-5 text-zinc-600 flex-shrink-0 group-hover:text-violet-400 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {!loading && !query && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <Search className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Comece a buscar</h3>
            <p className="text-zinc-400 mb-6">
              Digite algo para buscar tasks, projetos e workspaces
            </p>
            <div className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-zinc-400">
              <kbd className="rounded border border-zinc-600 bg-zinc-950 px-2 py-1 text-xs">Ctrl</kbd>
              <span>+</span>
              <kbd className="rounded border border-zinc-600 bg-zinc-950 px-2 py-1 text-xs">K</kbd>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function GlobalSearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SearchContent />
    </Suspense>
  );
}
