'use client';

import { useState } from 'react';
import { api } from '../lib/api';
import { useTheme } from '../hooks/useTheme';
import {
  X,
  Building2,
  Send,
  Tag,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Users,
  LayoutDashboard,
  Shield,
} from 'lucide-react';

type Workspace = {
  id: string;
  name: string;
  logoUrl?: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
};

type Props = {
  onClose: () => void;
  onCreated: (workspace: Workspace) => void;
};

export default function CreateWorkspaceModal({
  onClose,
  onCreated,
}: Props) {
  const { themeClasses } = useTheme();

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!name.trim()) {
      setError('Informe o nome do workspace.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const workspace = await api('/workspaces', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
        }),
      });

      onCreated(workspace);
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao criar workspace';

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const isFormValid = name.trim();
  const nameLength = name.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-hidden bg-black/70 p-2 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center sm:p-4">
      <div
        className={`relative flex max-h-[calc(100dvh-1rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} shadow-2xl animate-in slide-in-from-bottom-4 duration-300 sm:max-h-[90vh]`}
      >
        <div
          className={`flex-shrink-0 border-b ${themeClasses.border.primary} ${themeClasses.bg.primary} p-4 sm:p-6`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex-shrink-0 rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-2">
                <Building2 className="h-5 w-5 text-violet-400" />
              </div>

              <div className="min-w-0">
                <h2
                  className={`truncate text-lg font-bold sm:text-xl ${themeClasses.text.primary}`}
                >
                  Novo workspace
                </h2>

                <p
                  className={`mt-1 text-sm leading-snug ${themeClasses.text.secondary}`}
                >
                  Crie um novo ambiente para seu time.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`flex-shrink-0 rounded-lg p-2 ${themeClasses.text.secondary} transition-colors hover:${themeClasses.bg.hover} hover:${themeClasses.text.primary}`}
              aria-label="Fechar modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-5 p-4 sm:p-6">
            <div>
              <label
                className={`mb-2 flex items-center gap-2 text-sm font-medium ${themeClasses.text.secondary}`}
              >
                <Tag className="h-4 w-4 flex-shrink-0 text-violet-400" />
                Nome do workspace
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Equipe Zent, Marketing..."
                autoFocus
                className={`w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-2.5 ${themeClasses.text.primary} placeholder:${themeClasses.text.hint} outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500`}
              />

              {name && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className={themeClasses.text.secondary}>
                    {nameLength} caracteres
                  </span>

                  {nameLength >= 3 && nameLength <= 50 && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Nome válido
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

            <div
              className={`rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-4`}
            >
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-400" />

                <div className={`min-w-0 text-xs ${themeClasses.text.secondary}`}>
                  <p
                    className={`mb-2 font-medium ${themeClasses.text.primary}`}
                  >
                    O que você pode fazer com um workspace:
                  </p>

                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-1.5">
                      <Users className="mt-0.5 h-3 w-3 flex-shrink-0 text-violet-400" />
                      <span>Convidar membros da sua equipe</span>
                    </li>

                    <li className="flex items-start gap-1.5">
                      <LayoutDashboard className="mt-0.5 h-3 w-3 flex-shrink-0 text-violet-400" />
                      <span>Criar projetos e organizar tasks</span>
                    </li>

                    <li className="flex items-start gap-1.5">
                      <Shield className="mt-0.5 h-3 w-3 flex-shrink-0 text-violet-400" />
                      <span>Gerenciar permissões por função</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {!name && (
              <div
                className={`rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-3`}
              >
                <p className={`mb-2 text-xs ${themeClasses.text.secondary}`}>
                  💡 Sugestões de nomes:
                </p>

                <div className="flex flex-wrap gap-2">
                  {[
                    'Equipe Design',
                    'Desenvolvimento',
                    'Marketing',
                    'Produto',
                    'Vendas',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setName(suggestion)}
                      className={`rounded-lg border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-2 py-1 text-xs ${themeClasses.text.secondary} transition-all hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-400`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <p className={`text-center text-xs ${themeClasses.text.secondary}`}>
              Você será o{' '}
              <span className="text-violet-400">proprietário</span> deste
              workspace
            </p>
          </div>
        </div>

        <div
          className={`flex flex-shrink-0 flex-col-reverse gap-2 border-t ${themeClasses.border.primary} ${themeClasses.bg.primary} p-4 sm:flex-row sm:justify-end sm:gap-3 sm:p-6`}
        >
          <button
            onClick={onClose}
            className={`w-full rounded-lg px-4 py-2 text-sm ${themeClasses.text.secondary} transition-all hover:${themeClasses.bg.hover} hover:${themeClasses.text.primary} sm:w-auto`}
          >
            Cancelar
          </button>

          <button
            onClick={handleCreate}
            disabled={loading || !isFormValid || nameLength > 50}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                Criar workspace
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
