'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { useTheme } from '../hooks/useTheme';
import {
  Search,
  Zap,
  FileText,
  Plus,
  AlertCircle,
  Keyboard,
  X,
  ChevronRight,
} from 'lucide-react';

type SearchResult = {
  id: string;
  title: string;
  type: 'task' | 'project' | 'workspace' | 'command';
  icon: any;
  action: () => void;
  description?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CommandPalette({ isOpen, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [workspaceId, setWorkspaceId] = useState('');
  const { themeClasses } = useTheme();

  useEffect(() => {
    const wsId = localStorage.getItem('zent_workspace_id');
    if (wsId) {
      setWorkspaceId(wsId);
    }
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      loadDefaultResults();
      return;
    }

    searchItems();
  }, [query]);

  async function loadDefaultResults() {
    const defaultResults: SearchResult[] = [
      {
        id: 'cmd-new-task',
        title: 'Nova task',
        type: 'command',
        icon: Plus,
        description: 'Criar uma nova task (⌘N)',
        action: () => {
          onClose();
        },
      },
      {
        id: 'cmd-new-project',
        title: 'Novo projeto',
        type: 'command',
        icon: Plus,
        description: 'Criar um novo projeto',
        action: () => {
          router.push('/dashboard/projects');
          onClose();
        },
      },
      {
        id: 'cmd-dashboard',
        title: 'Dashboard',
        type: 'command',
        icon: Zap,
        description: 'Ir para dashboard',
        action: () => {
          router.push('/dashboard/overview');
          onClose();
        },
      },
    ];

    setResults(defaultResults);
    setSelectedIndex(0);
  }

  async function searchItems() {
    if (!query.trim() || !workspaceId) return;

    try {
      const tasksData = await api(`/tasks?page=1&pageSize=10`, {
        workspaceId,
      });
      const tasks = tasksData.items || tasksData || [];

      const projectsData = await api('/projects', { workspaceId });

      const searchResults: SearchResult[] = [];

      projectsData?.forEach((project: any) => {
        if (project.name.toLowerCase().includes(query.toLowerCase())) {
          searchResults.push({
            id: project.id,
            title: project.name,
            type: 'project',
            icon: FileText,
            description: 'Projeto',
            action: () => {
              router.push(`/dashboard/projects/${project.id}`);
              onClose();
            },
          });
        }
      });

      tasks.forEach((task: any) => {
        if (task.title.toLowerCase().includes(query.toLowerCase())) {
          searchResults.push({
            id: task.id,
            title: task.title,
            type: 'task',
            icon: FileText,
            description: `Status: ${task.status}`,
            action: () => {
              onClose();
            },
          });
        }
      });

      setResults(searchResults);
      setSelectedIndex(0);
    } catch (err) {
      console.error('Erro ao buscar:', err);
      setResults([]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
      }
      return;
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div className={`fixed inset-0 z-[100] ${themeClasses.bg.primary} opacity-50 backdrop-blur-sm`} onClick={onClose} />

      <div className="fixed inset-0 z-[101] flex items-start justify-center pt-20 px-4">
        <div className={`w-full max-w-2xl overflow-hidden rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} shadow-2xl`}>
          <div className={`border-b ${themeClasses.border.primary} p-4`}>
            <div className="flex items-center gap-3">
              <Search className={`h-5 w-5 ${themeClasses.text.tertiary}`} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar tasks, projetos, comandos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`flex-1 bg-transparent text-lg ${themeClasses.text.primary} placeholder:${themeClasses.text.tertiary} outline-none`}
              />
              <button
                onClick={onClose}
                className={`rounded-lg p-2 ${themeClasses.text.tertiary} ${themeClasses.bg.hover} ${themeClasses.text.primary} transition-colors`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <AlertCircle className={`h-12 w-12 ${themeClasses.text.muted} mb-3`} />
                <p className={`${themeClasses.text.secondary} text-center`}>
                  {query.trim() ? 'Nenhum resultado encontrado' : 'Digite para buscar'}
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {results.map((result, index) => {
                  const Icon = result.icon;
                  return (
                    <button
                      key={result.id}
                      onClick={() => result.action()}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        index === selectedIndex
                          ? 'bg-violet-500/20 text-white'
                          : `${themeClasses.text.secondary} ${themeClasses.bg.hover}`
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0 text-violet-400" />
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${themeClasses.text.primary}`}>{result.title}</p>
                        {result.description && (
                          <p className={`text-xs ${themeClasses.text.tertiary} truncate`}>{result.description}</p>
                        )}
                      </div>
                      <ChevronRight className={`h-4 w-4 ${themeClasses.text.muted} flex-shrink-0`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className={`border-t ${themeClasses.border.primary} ${themeClasses.bg.tertiary} px-4 py-3 text-xs ${themeClasses.text.muted} flex items-center justify-between`}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className={`rounded border ${themeClasses.border.primary} ${themeClasses.bg.tertiary} px-2 py-1`}>↑↓</kbd>
                <span>Navegar</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className={`rounded border ${themeClasses.border.primary} ${themeClasses.bg.tertiary} px-2 py-1`}>Enter</kbd>
                <span>Selecionar</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className={`rounded border ${themeClasses.border.primary} ${themeClasses.bg.tertiary} px-2 py-1`}>Esc</kbd>
              <span>Fechar</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
