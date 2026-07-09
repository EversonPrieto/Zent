'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';
import { useTheme } from '../../hooks/useTheme';
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  FolderKanban,
  Loader2,
  Search,
  Sparkles,
  X,
} from 'lucide-react';

type SearchResultType = 'task' | 'project' | 'workspace';
type SearchTab = 'all' | 'tasks' | 'projects' | 'workspaces';

type SearchResult = {
  id: string;
  title: string;
  type: SearchResultType;
  description?: string;
  projectId?: string;
  projectName?: string;
  workspaceId?: string;
  workspaceName?: string;
  status?: string;
  priority?: string;
  href: string;
  searchText: string;
};

const statusLabels: Record<string, string> = {
  TODO: 'A fazer',
  IN_PROGRESS: 'Em progresso',
  IN_REVIEW: 'Em revisão',
  DONE: 'Concluído',
  ABORTED: 'Cancelado',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const tabLabels: Record<SearchTab, string> = {
  all: 'Tudo',
  tasks: 'Tasks',
  projects: 'Projetos',
  workspaces: 'Workspaces',
};

function normalizeText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function toArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function uniqueResults(results: SearchResult[]) {
  const map = new Map<string, SearchResult>();

  for (const result of results) {
    map.set(`${result.type}:${result.id}`, result);
  }

  return Array.from(map.values());
}

function getTaskLabels(task: any) {
  const taskLabels = Array.isArray(task?.taskLabels) ? task.taskLabels : [];
  const labels = Array.isArray(task?.labels) ? task.labels : [];

  return [
    ...taskLabels.map((item: any) => item?.label?.name || item?.name),
    ...labels.map((item: any) => item?.name || item?.label?.name),
  ].filter(Boolean);
}

function getTaskAssignees(task: any) {
  const taskAssignees = Array.isArray(task?.taskAssignees)
    ? task.taskAssignees
    : [];
  const assignees = Array.isArray(task?.assignees) ? task.assignees : [];

  return [
    ...taskAssignees.map((item: any) => item?.user?.name || item?.name),
    ...assignees.map((item: any) => item?.user?.name || item?.name),
  ].filter(Boolean);
}

function getTaskAttachments(task: any) {
  const attachments = Array.isArray(task?.attachments) ? task.attachments : [];

  return attachments
    .map((attachment: any) => attachment?.fileName || attachment?.name)
    .filter(Boolean);
}

function getScore(result: SearchResult, rawQuery: string) {
  const query = normalizeText(rawQuery);
  const title = normalizeText(result.title);
  const description = normalizeText(result.description);
  const projectName = normalizeText(result.projectName);

  let score = 0;

  if (title === query) score += 100;
  if (title.startsWith(query)) score += 70;
  if (title.includes(query)) score += 45;
  if (projectName.includes(query)) score += 18;
  if (description.includes(query)) score += 12;
  if (normalizeText(result.searchText).includes(query)) score += 8;

  if (result.type === 'task') score += 3;
  if (result.type === 'project') score += 2;
  if (result.type === 'workspace') score += 1;

  return score;
}

function getResultIcon(type: SearchResultType) {
  if (type === 'project') return FolderKanban;
  if (type === 'workspace') return Building2;
  return FileText;
}

function getResultTypeLabel(type: SearchResultType) {
  if (type === 'task') return 'Task';
  if (type === 'project') return 'Projeto';
  return 'Workspace';
}

function useDebouncedValue<T>(value: T, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { themeClasses } = useTheme();

  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(query, 250);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [workspaceId, setWorkspaceId] = useState('');
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [error, setError] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const searchRequestId = useRef(0);

  useEffect(() => {
    const wsId = localStorage.getItem('zent_workspace_id') || '';
    setWorkspaceId(wsId);
    setReady(true);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isSearchShortcut =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';

      if (!isSearchShortcut) return;

      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const value = query.trim();
    const params = new URLSearchParams(window.location.search);

    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }

    const search = params.toString();
    const nextUrl = search ? `/search?${search}` : '/search';

    window.history.replaceState(null, '', nextUrl);
  }, [query]);

  useEffect(() => {
    if (!ready) return;

    const value = debouncedQuery.trim();

    if (!value) {
      setResults([]);
      setError('');
      setLoading(false);
      return;
    }

    performSearch(value);
  }, [debouncedQuery, workspaceId, ready]);

  async function fetchAllTasks(currentWorkspaceId: string) {
    if (!currentWorkspaceId) return [];

    const allTasks: any[] = [];
    const pageSize = 100;

    for (let page = 1; page <= 5; page += 1) {
      const response = await api(`/tasks?page=${page}&pageSize=${pageSize}`, {
        workspaceId: currentWorkspaceId,
      });

      const items = toArray(response);
      allTasks.push(...items);

      const total =
        typeof response?.total === 'number'
          ? response.total
          : typeof response?.totalItems === 'number'
            ? response.totalItems
            : null;

      if (items.length < pageSize) break;
      if (total && allTasks.length >= total) break;
    }

    return allTasks;
  }

  async function performSearch(rawQuery: string) {
    const currentSearchId = searchRequestId.current + 1;
    searchRequestId.current = currentSearchId;

    try {
      setLoading(true);
      setError('');

      const normalizedQuery = normalizeText(rawQuery);
      const allResults: SearchResult[] = [];

      const [projectsResponse, tasksResponse, workspacesResponse] =
        await Promise.allSettled([
          workspaceId
            ? api('/projects', { workspaceId })
            : Promise.resolve([]),
          fetchAllTasks(workspaceId),
          api('/workspaces'),
        ]);

      const projects =
        projectsResponse.status === 'fulfilled'
          ? toArray(projectsResponse.value)
          : [];

      const tasks =
        tasksResponse.status === 'fulfilled'
          ? toArray(tasksResponse.value)
          : [];

      const workspaces =
        workspacesResponse.status === 'fulfilled'
          ? toArray(workspacesResponse.value)
          : [];

      const projectById = new Map<string, any>();

      projects.forEach((project: any) => {
        if (project?.id) {
          projectById.set(project.id, project);
        }
      });

      tasks.forEach((task: any) => {
        const taskTitle = task?.title || '';
        const taskDescription = task?.description || '';
        const taskProjectId = task?.projectId || task?.project?.id || '';
        const project = projectById.get(taskProjectId) || task?.project;
        const projectName = project?.name || task?.projectName || '';
        const statusLabel = statusLabels[task?.status] || task?.status || '';
        const priorityLabel =
          priorityLabels[task?.priority] || task?.priority || '';
        const labelNames = getTaskLabels(task);
        const assigneeNames = getTaskAssignees(task);
        const attachmentNames = getTaskAttachments(task);

        const searchText = [
          taskTitle,
          taskDescription,
          projectName,
          statusLabel,
          priorityLabel,
          task?.status,
          task?.priority,
          ...labelNames,
          ...assigneeNames,
          ...attachmentNames,
        ].join(' ');

        if (!normalizeText(searchText).includes(normalizedQuery)) return;

        allResults.push({
          id: task.id,
          title: taskTitle || 'Task sem título',
          type: 'task',
          description:
            taskDescription ||
            `${statusLabel || 'Sem status'} • ${priorityLabel || 'Sem prioridade'}`,
          projectId: taskProjectId,
          projectName,
          workspaceId: workspaceId || undefined,
          status: task?.status,
          priority: task?.priority,
          href: taskProjectId
            ? `/dashboard/projects/${taskProjectId}?taskId=${task.id}`
            : '/dashboard/projects',
          searchText,
        });
      });

      projects.forEach((project: any) => {
        const projectName = project?.name || project?.title || '';
        const projectDescription = project?.description || '';
        const projectStatus = project?.status || '';
        const searchText = [
          projectName,
          projectDescription,
          projectStatus,
          project?.visibility,
          project?.role,
        ].join(' ');

        if (!normalizeText(searchText).includes(normalizedQuery)) return;

        allResults.push({
          id: project.id,
          title: projectName || 'Projeto sem nome',
          type: 'project',
          description: projectDescription || 'Abrir quadro do projeto',
          workspaceId: workspaceId || project?.workspaceId,
          status: projectStatus,
          href: `/dashboard/projects/${project.id}`,
          searchText,
        });
      });

      workspaces.forEach((workspace: any) => {
        const workspaceName = workspace?.name || '';
        const workspaceDescription = workspace?.description || '';
        const searchText = [
          workspaceName,
          workspaceDescription,
          workspace?.role,
          workspace?.plan,
        ].join(' ');

        if (!normalizeText(searchText).includes(normalizedQuery)) return;

        allResults.push({
          id: workspace.id,
          title: workspaceName || 'Workspace sem nome',
          type: 'workspace',
          description: workspaceDescription || 'Trocar para este workspace',
          workspaceId: workspace.id,
          workspaceName,
          href: '/dashboard/overview',
          searchText,
        });
      });

      const sortedResults = uniqueResults(allResults).sort((a, b) => {
        const scoreDiff = getScore(b, rawQuery) - getScore(a, rawQuery);

        if (scoreDiff !== 0) return scoreDiff;

        return a.title.localeCompare(b.title);
      });

      if (currentSearchId !== searchRequestId.current) return;

      setResults(sortedResults);

      if (
        projectsResponse.status === 'rejected' &&
        tasksResponse.status === 'rejected' &&
        workspacesResponse.status === 'rejected'
      ) {
        setError('Não foi possível buscar agora. Tente novamente em alguns segundos.');
      }
    } catch (err) {
      if (currentSearchId !== searchRequestId.current) return;

      console.error('Erro ao buscar:', err);
      setResults([]);
      setError('Erro ao executar a busca global.');
    } finally {
      if (currentSearchId === searchRequestId.current) {
        setLoading(false);
      }
    }
  }

  const counts = useMemo(
    () => ({
      all: results.length,
      tasks: results.filter((result) => result.type === 'task').length,
      projects: results.filter((result) => result.type === 'project').length,
      workspaces: results.filter((result) => result.type === 'workspace').length,
    }),
    [results],
  );

  const filteredResults = useMemo(() => {
    if (activeTab === 'all') return results;

    const type = activeTab.slice(0, -1) as SearchResultType;
    return results.filter((result) => result.type === type);
  }, [activeTab, results]);

  function clearSearch() {
    setQuery('');
    setResults([]);
    setError('');
    setActiveTab('all');
    inputRef.current?.focus();
  }

  function handleResultClick(result: SearchResult) {
    if (result.workspaceId && result.workspaceId !== workspaceId) {
      localStorage.setItem('zent_workspace_id', result.workspaceId);
      window.dispatchEvent(
        new CustomEvent('workspace-changed', {
          detail: { workspaceId: result.workspaceId },
        }),
      );
    }

    router.push(result.href);
  }

  const showInitialState = !loading && !query.trim();
  const showEmptyState =
    !loading && query.trim() && filteredResults.length === 0 && !error;

  return (
    <main className={`relative min-h-screen overflow-x-hidden ${themeClasses.bg.primary}`}>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-7">
          <button
            type="button"
            onClick={() => router.back()}
            className={`mb-4 inline-flex items-center gap-2 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-3 py-2 text-sm font-medium transition-all ${themeClasses.text.secondary} hover:border-violet-500/40 hover:text-violet-400`}
          >
            ← Voltar
          </button>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-400">
                <Sparkles className="h-3.5 w-3.5" />
                Busca global
              </div>

              <h1 className={`text-3xl font-black tracking-tight sm:text-5xl ${themeClasses.text.primary}`}>
                Encontre tudo no Zent.
              </h1>

              <p className={`mt-2 max-w-2xl text-sm sm:text-base ${themeClasses.text.tertiary}`}>
                Busque por tasks, descrições, status, prioridades, labels, responsáveis, projetos e workspaces.
              </p>
            </div>

            <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3`}>
              <p className={`text-xs ${themeClasses.text.tertiary}`}>Resultados</p>
              <p className="text-2xl font-black text-violet-400">{results.length}</p>
            </div>
          </div>
        </div>

        <div className={`mb-5 rounded-3xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} p-3 shadow-xl shadow-black/5`}>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className={`h-5 w-5 ${themeClasses.text.tertiary}`} />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Busque por task, projeto, workspace, prioridade, label..."
              className={`w-full rounded-2xl border py-4 pl-12 pr-12 text-base outline-none transition-all ${themeClasses.border.primary} ${themeClasses.bg.tertiary} ${themeClasses.text.primary} placeholder:text-zinc-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
              autoFocus
            />

            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className={`absolute inset-y-0 right-0 flex items-center pr-4 transition-colors ${themeClasses.text.tertiary} hover:text-violet-400`}
                aria-label="Limpar busca"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className={`mt-3 flex flex-wrap items-center justify-between gap-3 px-1 text-xs ${themeClasses.text.tertiary}`}>
            <span>
              Dica: use <kbd className={`rounded border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-1.5 py-0.5`}>Ctrl</kbd> + <kbd className={`rounded border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-1.5 py-0.5`}>K</kbd> para focar.
            </span>
            <span>
              Workspace atual: {workspaceId ? 'ativo' : 'não selecionado'}
            </span>
          </div>
        </div>

        {query.trim() && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
            {(['all', 'tasks', 'projects', 'workspaces'] as SearchTab[]).map(
              (tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                    activeTab === tab
                      ? 'border-violet-500/40 bg-violet-500/15 text-violet-400'
                      : `${themeClasses.border.primary} ${themeClasses.bg.subtle} ${themeClasses.text.tertiary} hover:border-violet-500/40 hover:text-violet-400`
                  }`}
                >
                  {tabLabels[tab]} ({counts[tab]})
                </button>
              ),
            )}
          </div>
        )}

        {loading && (
          <div className={`rounded-3xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-12 text-center`}>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-500" />
            <p className={`mt-4 text-sm ${themeClasses.text.tertiary}`}>
              Buscando em tasks, projetos e workspaces...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center text-red-400">
            {error}
          </div>
        )}

        {showEmptyState && (
          <div className={`rounded-3xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-12 text-center`}>
            <Search className={`mx-auto mb-4 h-12 w-12 ${themeClasses.text.muted}`} />
            <h3 className={`mb-2 text-lg font-semibold ${themeClasses.text.primary}`}>
              Nenhum resultado encontrado
            </h3>
            <p className={`text-sm ${themeClasses.text.tertiary}`}>
              Tente buscar pelo nome da task, descrição, prioridade, status, label, responsável ou projeto.
            </p>
          </div>
        )}

        {!loading && !error && filteredResults.length > 0 && (
          <div className="space-y-3">
            {filteredResults.map((result) => {
              const Icon = getResultIcon(result.type);
              const typeLabel = getResultTypeLabel(result.type);
              const statusLabel = result.status
                ? statusLabels[result.status] || result.status
                : null;
              const priorityLabel = result.priority
                ? priorityLabels[result.priority] || result.priority
                : null;

              return (
                <button
                  key={`${result.type}-${result.id}`}
                  type="button"
                  onClick={() => handleResultClick(result)}
                  className={`group w-full rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-4 text-left transition-all hover:border-violet-500/50 hover:bg-violet-500/5`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-violet-500/15">
                      <Icon className="h-5 w-5 text-violet-400" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-400">
                          {typeLabel}
                        </span>

                        {result.projectName && (
                          <span className={`truncate text-xs ${themeClasses.text.tertiary}`}>
                            em {result.projectName}
                          </span>
                        )}
                      </div>

                      <h4 className={`truncate text-base font-bold transition-colors ${themeClasses.text.primary} group-hover:text-violet-400`}>
                        {result.title}
                      </h4>

                      {result.description && (
                        <p className={`mt-1 line-clamp-2 text-sm ${themeClasses.text.tertiary}`}>
                          {result.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {statusLabel && (
                          <span className={`rounded-full ${themeClasses.bg.tertiary} px-2.5 py-1 text-xs ${themeClasses.text.secondary}`}>
                            {statusLabel}
                          </span>
                        )}

                        {priorityLabel && (
                          <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-400">
                            {priorityLabel}
                          </span>
                        )}

                        <span className={`inline-flex items-center gap-1 rounded-full ${themeClasses.bg.tertiary} px-2.5 py-1 text-xs ${themeClasses.text.tertiary}`}>
                          <ArrowRight className="h-3.5 w-3.5" />
                          Abrir
                        </span>
                      </div>
                    </div>

                    <ArrowRight className={`mt-3 h-5 w-5 flex-shrink-0 transition-all ${themeClasses.text.muted} group-hover:translate-x-1 group-hover:text-violet-400`} />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {showInitialState && (
          <div className={`rounded-3xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-8 text-center sm:p-12`}>
            <Search className={`mx-auto mb-4 h-12 w-12 ${themeClasses.text.muted}`} />
            <h3 className={`mb-2 text-lg font-semibold ${themeClasses.text.primary}`}>
              Comece a buscar
            </h3>
            <p className={`mx-auto mb-6 max-w-lg text-sm ${themeClasses.text.tertiary}`}>
              Digite algo para encontrar tasks, projetos e workspaces. Agora a busca também considera descrição, status, prioridade, labels, responsáveis e anexos.
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: FileText, title: 'Tasks', text: 'Título, descrição, status, prioridade e labels.' },
                { icon: FolderKanban, title: 'Projetos', text: 'Nome, descrição e dados do projeto.' },
                { icon: Building2, title: 'Workspaces', text: 'Nome, descrição e dados do workspace.' },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.tertiary} p-4 text-left`}
                  >
                    <Icon className="mb-3 h-5 w-5 text-violet-400" />
                    <h4 className={`font-semibold ${themeClasses.text.primary}`}>
                      {item.title}
                    </h4>
                    <p className={`mt-1 text-xs ${themeClasses.text.tertiary}`}>
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && query.trim() && results.length > 0 && (
          <div className={`mt-6 flex items-center gap-2 text-xs ${themeClasses.text.tertiary}`}>
            <Activity className="h-3.5 w-3.5" />
            Clique em um resultado para abrir. Tasks redirecionam para o projeto com o taskId na URL.
          </div>
        )}
      </div>
    </main>
  );
}

export default function GlobalSearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <SearchContent />
    </Suspense>
  );
}
