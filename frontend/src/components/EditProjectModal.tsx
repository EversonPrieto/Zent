'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../lib/api';
import { showConfirm } from './ConfirmDialog';
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
  Save,
  Trash2,
  Sparkles,
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

// Constantes auxiliares visuais
const inputBaseClass = 'w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60';
const labelClass = 'mb-2 flex items-center gap-2 text-sm font-semibold';
const primaryButtonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100';

export default function EditProjectModal({
  workspaceId,
  project,
  onClose,
  onUpdated,
}: Props) {
  const { themeClasses } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [completed, setCompleted] = useState(project.completed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [checkingPerms, setCheckingPerms] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  const canDelete = permissions?.canDeleteProject;

  if (!mounted) return null;

  // Sem permissão
  if (!checkingPerms && !canEdit) {
    return createPortal(
      <div className="fixed inset-0 z-[2147483647] isolate flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className={`relative w-full max-w-md overflow-hidden rounded-3xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} shadow-2xl shadow-black/20 animate-in zoom-in-95 duration-300`}>
          <div className={`border-b ${themeClasses.border.primary} px-6 py-5`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-red-500/10 p-2">
                  <Lock className="h-5 w-5 text-red-400" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-red-400">
                  Sem permissão
                </h2>
              </div>
              <button
                onClick={onClose}
                className={`flex-shrink-0 rounded-xl p-2 transition-all duration-200 ${themeClasses.text.tertiary} hover:bg-zinc-800/50 hover:text-white`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="px-6 py-8 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10">
              <Lock className="h-10 w-10 text-red-400" />
            </div>
            <h3 className={`text-lg font-semibold ${themeClasses.text.primary}`}>
              Acesso restrito
            </h3>
            <p className={`mt-2 text-sm ${themeClasses.text.tertiary}`}>
              Apenas <span className="font-semibold text-violet-400">ADMIN</span> e{' '}
              <span className="font-semibold text-violet-400">OWNER</span> podem editar este projeto.
            </p>
            <button
              onClick={onClose}
              className={`mt-6 w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 text-sm font-medium ${themeClasses.text.secondary} transition-all duration-200 hover:bg-zinc-800/50 hover:text-white`}
            >
              Entendi
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] isolate flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full max-w-md overflow-hidden rounded-3xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} shadow-2xl shadow-black/20 animate-in zoom-in-95 duration-300`}>
        {/* Header */}
        <div className={`border-b ${themeClasses.border.primary} px-6 py-5`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-500/10 p-2">
                <Pencil className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h2 className={`text-xl font-bold tracking-tight ${themeClasses.text.primary}`}>
                  Editar projeto
                </h2>
                <p className={`mt-1 text-sm ${themeClasses.text.tertiary}`}>
                  Atualize as informações do projeto
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`flex-shrink-0 rounded-xl p-2 transition-all duration-200 ${themeClasses.text.tertiary} hover:bg-zinc-800/50 hover:text-white hover:scale-105 active:scale-95`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className={`${labelClass} ${themeClasses.text.secondary}`}>
                <Sparkles className="h-4 w-4 text-violet-400" />
                Nome do projeto <span className="text-red-400">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Zent Core, Landing Page, Mobile App..."
                autoFocus
                className={`${inputBaseClass} ${themeClasses.border.primary} ${themeClasses.bg.subtle} ${themeClasses.text.primary} placeholder:text-zinc-500`}
              />
              {name && (
                <p className={`mt-1.5 text-xs ${themeClasses.text.tertiary}`}>
                  {name.length} caractere{name.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className={`${labelClass} ${themeClasses.text.secondary}`}>
                <FolderKanban className="h-4 w-4 text-violet-400" />
                Descrição
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o objetivo do projeto..."
                rows={4}
                className={`${inputBaseClass} ${themeClasses.border.primary} ${themeClasses.bg.subtle} ${themeClasses.text.primary} placeholder:text-zinc-500 resize-y min-h-[100px]`}
              />
            </div>

            {/* Status Toggle */}
            <div className={`rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-4`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${completed ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                    {completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Archive className="h-5 w-5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${themeClasses.text.primary}`}>
                      {completed ? 'Projeto Finalizado' : 'Projeto Ativo'}
                    </p>
                    <p className={`text-xs ${themeClasses.text.tertiary} mt-0.5`}>
                      {completed
                        ? 'Tasks bloqueadas para edição'
                        : 'Tasks podem ser editadas'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCompleted(!completed)}
                  className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                    completed
                      ? 'bg-emerald-500'
                      : 'bg-zinc-600'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                      completed ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between gap-3">
                {canDelete && (
                  <button
                    onClick={async () => {
                      const confirmed = await showConfirm({
                        title: 'Deletar projeto',
                        message: '⚠️ Esta ação é irreversível. O projeto será removido junto com todas as tasks relacionadas.',
                        action: 'delete',
                        confirmLabel: 'Deletar',
                        isDangerous: true,
                      });

                      if (!confirmed) return;

                      try {
                        setLoading(true);
                        setError('');

                        await api(`/projects/${project.id}`, {
                          method: 'DELETE',
                          workspaceId,
                        });

                        showToast(`Projeto "${project.name}" deletado.`, 'success', 3000);
                        window.dispatchEvent(new Event('workspace-changed'));
                        onUpdated(project);
                        onClose();
                        return;
                      } catch (err) {
                        const message = err instanceof Error ? err.message : 'Erro ao deletar projeto';
                        setError(message);
                        showToast(message, 'error', 4000);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {loading ? 'Deletando...' : 'Deletar'}
                  </button>
                )}

                <div className="flex gap-3 ml-auto">
                  <button
                    onClick={onClose}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all duration-200 ${themeClasses.text.tertiary} hover:text-white hover:bg-zinc-800/50 active:scale-[0.98]`}
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleUpdate}
                    disabled={loading || !isFormValid}
                    className={primaryButtonClass}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}