'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useTheme } from '../hooks/useTheme';
import { getWorkspacePermissions, type Permissions } from '../lib/permissions';
import { showToast } from './Toast';
import {
  X,
  FolderKanban,
  Pencil,
  Loader2,
  AlertCircle,
  Lock,
  CheckCircle2,
  RotateCcw,
  Archive,
  Save
} from 'lucide-react';

type Project = {
  id: string;
  name: string;
  description?: string | null;
  completed: boolean;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  workspaceId: string;
  project: Project;
  onClose: () => void;
  onUpdated: (project: Project) => void;
};

export default function EditProjectModal({
  workspaceId,
  project,
  onClose,
  onUpdated,
}: Props) {
  const { themeClasses } = useTheme();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [completed, setCompleted] = useState(project.completed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [checkingPerms, setCheckingPerms] = useState(true);

  useEffect(() => {
    async function loadPermissions() {
      try {
        const perms = await getWorkspacePermissions(workspaceId);
        setPermissions(perms);
      } catch (err) {
        console.error('Erro ao carregar permissões:', err);
        setPermissions(null);
      } finally {
        setCheckingPerms(false);
      }
    }

    loadPermissions();
  }, [workspaceId]);

  async function handleUpdate() {
    if (!name.trim()) {
      setError('Informe o nome do projeto.');
      showToast('Informe o nome do projeto', 'error', 3000);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const wasCompleted = project.completed;
      const updated = await api(`/projects/${project.id}`, {
        method: 'PATCH',
        workspaceId,
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || '',
          completed,
        }),
      });

      console.log('[EditProjectModal] Updated project:', updated);

      // Only show "finalizado/reaberto" message if status actually changed
      if (completed !== wasCompleted) {
        showToast(
          completed
            ? `Projeto "${name}" foi finalizado!`
            : `Projeto "${name}" foi reaberto!`,
          'success',
          3000
        );
      } else {
        showToast(`Projeto "${name}" atualizado!`, 'success', 3000);
      }
      onUpdated(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar projeto';
      setError(message);
      showToast(message, 'error', 4000);
    } finally {
      setLoading(false);
    }
  }

  const isFormValid = name.trim();
  const canEdit = permissions?.canUpdateProject;

  if (!checkingPerms && !canEdit) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className={`relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl animate-in slide-in-from-bottom-4 duration-300 ${themeClasses.bg.primary} ${themeClasses.border.primary}`}>
          <div className={`border-b p-6 ${themeClasses.border.primary} ${themeClasses.bg.primary}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-red-500/10 p-2">
                  <Lock className="h-5 w-5 text-red-400" />
                </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-red-400 to-red-300 bg-clip-text text-transparent">
                Sem permissão
              </h2>
            </div>
              <button
                onClick={onClose}
                className={`rounded-lg p-1 transition-colors ${themeClasses.text.tertiary} hover:${themeClasses.bg.hover} hover:${themeClasses.text.primary}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-red-500/10 p-3">
                <Lock className="h-8 w-8 text-red-400" />
              </div>
              <h3 className={`mb-2 text-lg font-semibold ${themeClasses.text.primary}`}>
                Acesso restrito
              </h3>
              <p className={`mb-6 text-sm ${themeClasses.text.tertiary}`}>
                Apenas <span className="font-medium text-violet-400">ADMIN</span> e{' '}
                <span className="font-medium text-violet-400">OWNER</span> podem editar este projeto.
              </p>
              <button
                onClick={onClose}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${themeClasses.border.primary} ${themeClasses.bg.secondary} ${themeClasses.text.secondary} hover:${themeClasses.bg.hover} hover:${themeClasses.text.primary}`}
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl animate-in slide-in-from-bottom-4 duration-300 ${themeClasses.bg.primary} ${themeClasses.border.primary}`}>
        <div className={`border-b p-6 ${themeClasses.border.primary} ${themeClasses.bg.primary}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-2">
                <Pencil className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${themeClasses.text.primary}`}>
                  Editar projeto
                </h2>
                <p className={`mt-1 text-xs ${themeClasses.text.muted}`}>
                  Atualize as informações do projeto
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`rounded-lg p-1 transition-colors ${themeClasses.text.tertiary} hover:${themeClasses.bg.hover} hover:${themeClasses.text.primary}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-5">
            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${themeClasses.text.secondary}`}>
                Nome do projeto
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Zent Core, Landing Page, Mobile App..."
                autoFocus
                className={`w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-2.5 ${themeClasses.text.primary} placeholder:${themeClasses.text.muted} outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500`}
              />
              {name && (
                <p className={`mt-2 text-xs ${themeClasses.text.muted}`}>
                  {name.length} caracteres
                </p>
              )}
            </div>

            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${themeClasses.text.secondary}`}>
                Descrição
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o objetivo do projeto..."
                rows={4}
                className={`w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-2.5 ${themeClasses.text.primary} placeholder:${themeClasses.text.muted} outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none`}
              />
            </div>

            <div className={`rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${completed ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                    {completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Archive className="h-5 w-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <p className={`font-medium ${themeClasses.text.primary}`}>
                      {completed ? 'Projeto Finalizado' : 'Projeto Ativo'}
                    </p>
                    <p className={`text-xs ${themeClasses.text.tertiary}`}>
                      {completed
                        ? 'Tasks estão bloqueadas para edição'
                        : 'Tasks podem ser editadas normalmente'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCompleted(!completed)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                    completed
                      ? 'bg-emerald-500/30'
                      : 'bg-zinc-500/30'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      completed ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className={`rounded-lg px-4 py-2 text-sm ${themeClasses.text.secondary} transition-all hover:${themeClasses.bg.hover} hover:${themeClasses.text.primary}`}
              >
                Cancelar
              </button>

              <button
                onClick={handleUpdate}
                disabled={loading || !isFormValid}
                className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
