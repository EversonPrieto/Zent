'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) return null;

  const isFormValid = name.trim();
  const nameLength = name.length;

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] isolate flex items-center justify-center overflow-hidden bg-black/60 p-3 backdrop-blur-sm animate-in fade-in duration-200 sm:p-6">
      <div
        className={`relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} shadow-2xl shadow-black/20 animate-in zoom-in-95 duration-300`}
      >
        {/* Header */}
        <div className={`flex-shrink-0 border-b ${themeClasses.border.primary} px-5 py-4 sm:px-6 sm:py-5`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-500/10 p-2">
                <Building2 className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h2 className={`text-xl font-bold tracking-tight ${themeClasses.text.primary}`}>
                  Novo workspace
                </h2>
                <p className={`mt-1 text-sm ${themeClasses.text.tertiary}`}>
                  Crie um ambiente para seu time
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`flex-shrink-0 rounded-xl p-2 transition-all duration-200 ${themeClasses.text.tertiary} hover:bg-zinc-800/50 hover:text-white hover:scale-105 active:scale-95`}
              aria-label="Fechar modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          <div className="space-y-5">
            {/* Name Input */}
            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-semibold ${themeClasses.text.secondary}`}>
                <Tag className="h-4 w-4 text-violet-400" />
                Nome do workspace
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Equipe Zent, Marketing..."
                autoFocus
                className={`w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} px-4 py-3 text-sm ${themeClasses.text.primary} outline-none transition-all duration-200 placeholder:text-zinc-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
              />

              {name && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className={`font-medium ${themeClasses.text.tertiary}`}>
                    {nameLength} caractere{nameLength !== 1 ? 's' : ''}
                  </span>

                  {nameLength >= 3 && nameLength <= 50 && (
                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Nome válido
                    </span>
                  )}

                  {nameLength > 50 && (
                    <span className="text-red-400 font-medium">
                      Máximo 50 caracteres
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Info Card */}
            <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-4`}>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-violet-500/10 p-1.5">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${themeClasses.text.primary}`}>
                    O que você pode fazer:
                  </p>
                  <ul className="mt-2 space-y-2">
                    <li className="flex items-start gap-2 text-xs">
                      <Users className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-violet-400" />
                      <span className={themeClasses.text.tertiary}>Convidar membros da sua equipe</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs">
                      <LayoutDashboard className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-violet-400" />
                      <span className={themeClasses.text.tertiary}>Criar projetos e organizar tasks</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs">
                      <Shield className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-violet-400" />
                      <span className={themeClasses.text.tertiary}>Gerenciar permissões por função</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            {!name && (
              <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-4`}>
                <p className={`mb-3 text-xs font-semibold ${themeClasses.text.secondary}`}>
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
                      className={`rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} px-3 py-2 text-xs font-medium ${themeClasses.text.secondary} transition-all duration-200 hover:border-violet-500/40 hover:text-violet-400 hover:bg-violet-500/5 active:scale-95`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Owner Info */}
            <p className={`text-center text-xs ${themeClasses.text.tertiary}`}>
              Você será o{' '}
              <span className="font-semibold text-violet-400">proprietário</span> deste workspace
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex-shrink-0 border-t ${themeClasses.border.primary} px-5 py-4 sm:px-6 sm:py-5`}>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              onClick={onClose}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-all duration-200 ${themeClasses.text.tertiary} hover:text-white hover:bg-zinc-800/50 active:scale-[0.98]`}
            >
              Cancelar
            </button>

            <button
              onClick={handleCreate}
              disabled={loading || !isFormValid || nameLength > 50}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  Criar workspace
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}