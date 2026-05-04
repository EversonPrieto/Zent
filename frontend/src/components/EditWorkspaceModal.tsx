'use client';

import { useState } from 'react';
import { api } from '../lib/api';
import { useTheme } from '../hooks/useTheme';
import {
  X,
  Building2,
  Save,
  Edit2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Tag
} from 'lucide-react';

type Workspace = {
  id: string;
  name: string;
  logoUrl?: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
};

type Props = {
  workspace: Workspace;
  onClose: () => void;
  onSaved: (workspace: Workspace) => void;
};

export default function EditWorkspaceModal({
  workspace,
  onClose,
  onSaved,
}: Props) {
  const { themeClasses } = useTheme();
  const [name, setName] = useState(workspace.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!name.trim()) {
      setError('Informe o nome do workspace.');
      return;
    }

    if (name.trim() === workspace.name) {
      onClose();
      return;
    }

    try {
      setLoading(true);
      setError('');

      const updated = await api('/workspaces/current', {
        method: 'PATCH',
        workspaceId: workspace.id,
        body: JSON.stringify({ name: name.trim() }),
      });

      onSaved(updated);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao editar workspace';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const isFormValid = name.trim();
  const isChanged = name.trim() !== workspace.name;
  const nameLength = name.length;

  return (
    <div className={`fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm animate-in fade-in duration-200`}>
      <div className={`relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl animate-in slide-in-from-bottom-4 duration-300 ${themeClasses.bg.primary} ${themeClasses.border.primary}`}>
        <div className={`border-b p-6 ${themeClasses.border.primary} ${themeClasses.bg.primary}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-2">
                <Building2 className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${themeClasses.text.primary}`}>
                  Editar workspace
                </h2>
                <p className={`mt-1 text-sm ${themeClasses.text.tertiary}`}>
                  Atualize o nome do seu workspace
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`rounded-lg p-2 transition-colors ${themeClasses.text.tertiary} hover:${themeClasses.bg.hover} ${themeClasses.text.primary}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-5">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
                  {workspace.logoUrl ? (
                    <img
                      src={workspace.logoUrl}
                      alt={workspace.name}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    <Building2 className="h-4 w-4 text-violet-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Nome atual</p>
                  <p className="text-sm font-medium text-white">{workspace.name}</p>
                </div>
              </div>
            </div>

            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${themeClasses.text.secondary}`}>
                <Tag className="h-4 w-4 text-violet-400" />
                Novo nome
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do workspace"
                autoFocus
                className={`w-full rounded-xl border px-4 py-2.5 outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500 ${themeClasses.input}`}
              />
              {name && (
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className={themeClasses.text.hint}>
                    {nameLength} caracteres
                  </span>
                  {isChanged && nameLength >= 3 && nameLength <= 50 && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Pronto para salvar
                    </span>
                  )}
                  {nameLength > 50 && (
                    <span className="text-red-400">
                      Máximo 50 caracteres
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className={`rounded-lg border p-3 ${themeClasses.bg.secondary} ${themeClasses.border.secondary}`}>
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-violet-400 mt-0.5" />
                <div className={`text-xs ${themeClasses.text.hint}`}>
                  <p className={`mb-1 font-medium ${themeClasses.text.secondary}`}>Dicas para um bom nome:</p>
                  <ul className="space-y-1">
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      <span>Use nomes descritivos e únicos</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      <span>Evite caracteres especiais</span>
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      <span>Mantenha entre 3 e 50 caracteres</span>
                    </li>
                  </ul>
                </div>
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
                className={`rounded-lg px-4 py-2 text-sm transition-all ${themeClasses.text.tertiary} hover:${themeClasses.bg.hover} hover:${themeClasses.text.primary}`}
              >
                Cancelar
              </button>

              <button
                onClick={handleSave}
                disabled={loading || !isFormValid || nameLength > 50 || !isChanged}
                className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 transition-transform group-hover:scale-110" />
                    Salvar alterações
                  </>
                )}
              </button>
            </div>

            {isChanged && isFormValid && nameLength <= 50 && (
              <p className={`text-center text-xs ${themeClasses.text.hint}`}>
                Alterando de <span className="text-violet-400">{workspace.name}</span> para{' '}
                <span className="text-violet-400">{name.trim()}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}