'use client';

import { useState } from 'react';
import { api } from '../lib/api';
import {
  X,
  Building2,
  PlusCircle,
  Send,
  Tag,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Users,
  LayoutDashboard,
  Shield
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
      const message = err instanceof Error ? err.message : 'Erro ao criar workspace';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const isFormValid = name.trim();
  const nameLength = name.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="border-b border-white/10 bg-gradient-to-r from-zinc-900 to-zinc-950 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-2">
                <Building2 className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                  Novo workspace
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Crie um novo ambiente para seu time.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-5">
            {/* Name Field */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Tag className="h-4 w-4 text-violet-400" />
                Nome do workspace
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Equipe Zent, Marketing, Desenvolvimento..."
                autoFocus
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-zinc-500 outline-none transition-all focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
              {name && (
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">
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

            {/* Tips Section */}
            <div className="rounded-lg border border-white/5 bg-white/5 p-4">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-violet-400 mt-0.5" />
                <div className="text-xs text-zinc-500">
                  <p className="mb-2 font-medium text-zinc-400">O que você pode fazer com um workspace:</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-violet-400" />
                      <span>Convidar membros da sua equipe</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <LayoutDashboard className="h-3 w-3 text-violet-400" />
                      <span>Criar projetos e organizar tasks</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Shield className="h-3 w-3 text-violet-400" />
                      <span>Gerenciar permissões por função</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Name Suggestions */}
            {!name && (
              <div className="rounded-lg border border-white/5 bg-white/5 p-3">
                <p className="text-xs text-zinc-500 mb-2">💡 Sugestões de nomes:</p>
                <div className="flex flex-wrap gap-2">
                  {['Equipe Design', 'Desenvolvimento', 'Marketing', 'Produto', 'Vendas'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setName(suggestion)}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-400 transition-all hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-400"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
              >
                Cancelar
              </button>

              <button
                onClick={handleCreate}
                disabled={loading || !isFormValid || nameLength > 50}
                className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
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

            {/* Footer Note */}
            <p className="text-center text-xs text-zinc-500">
              Você será o <span className="text-violet-400">proprietário</span> deste workspace
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}