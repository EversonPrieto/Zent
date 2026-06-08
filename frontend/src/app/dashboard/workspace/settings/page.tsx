'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { useTheme } from '../../../../hooks/useTheme';
import { getWorkspacePermissions, type Permissions } from '../../../../lib/permissions';
import {
  Building2,
  Save,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserCog,
  Shield,
  Image,
  Edit2,
  X,
  ArrowLeft
} from 'lucide-react';

type Workspace = {
  id: string;
  name: string;
  logoUrl?: string | null;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const { themeClasses } = useTheme();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [checkingPerms, setCheckingPerms] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const workspaceRaw = localStorage.getItem('zent_workspace');

    if (!workspaceRaw) {
      router.push('/dashboard/projects');
      return;
    }

    try {
      const parsed = JSON.parse(workspaceRaw);
      setWorkspace(parsed);
      setName(parsed.name);
    } catch {
      router.push('/dashboard/projects');
    }
  }, [router]);

  useEffect(() => {
    async function loadPermissions() {
      if (!workspace) return;

      try {
        const perms = await getWorkspacePermissions(workspace.id);
        setPermissions(perms);
      } catch (err) {
        console.error('Erro ao carregar permissões:', err);
        setPermissions(null);
      } finally {
        setCheckingPerms(false);
      }
    }

    loadPermissions();
  }, [workspace]);

  async function handleSave() {
    if (!workspace) return;

    if (!name.trim()) {
      setError('Informe o nome do workspace.');
      return;
    }

    if (name.trim() === workspace.name) {
      setSuccess('Nenhuma alteração detectada.');
      setTimeout(() => setSuccess(''), 3000);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const updated = await api('/workspaces/current', {
        method: 'PATCH',
        workspaceId: workspace.id,
        body: JSON.stringify({ name: name.trim() }),
      });

      localStorage.setItem('zent_workspace_id', updated.id);
      localStorage.setItem('zent_workspace', JSON.stringify(updated));

      setWorkspace(updated);
      setName(updated.name);
      setSuccess('Workspace atualizado com sucesso!');

      window.dispatchEvent(new Event('workspace-changed'));

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoUpload(e: ChangeEvent<HTMLInputElement>) {
    if (!workspace) return;

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setUploadingLogo(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('zent_token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/workspaces/current/logo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-workspace-id': workspace.id,
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = Array.isArray(data?.message)
          ? data.message.join(', ')
          : data?.message || 'Erro ao enviar logo';

        throw new Error(message);
      }

      localStorage.setItem('zent_workspace_id', data.id);
      localStorage.setItem('zent_workspace', JSON.stringify(data));

      setWorkspace(data);
      setLogoPreview(null);
      setSuccess('Logo atualizada com sucesso!');

      window.dispatchEvent(new Event('workspace-changed'));

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar logo');
      setLogoPreview(null);
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  }

  async function handleDelete() {
    if (!workspace) return;

    const confirmed = confirm(
      '⚠️ ATENÇÃO: Tem certeza que deseja deletar este workspace?\n\n' +
      'Esta ação é irreversível e irá remover:\n' +
      '• Todos os projetos e tasks\n' +
      '• Membros do workspace\n' +
      '• Todos os arquivos e comentários\n\n' +
      'Esta ação não pode ser desfeita.'
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await api(`/workspaces/${workspace.id}`, {
        method: 'DELETE',
        workspaceId: workspace.id,
      });

      localStorage.removeItem('zent_workspace');
      localStorage.removeItem('zent_workspace_id');

      window.dispatchEvent(new Event('workspace-changed'));

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar');
    } finally {
      setLoading(false);
    }
  }

  if (!workspace) return null;

  const canEdit = permissions?.canDeleteWorkspace ?? false;
  const canDelete = permissions?.canDeleteWorkspace ?? false;
  const nameLength = name.length;
  const isNameChanged = name.trim() !== workspace.name;
  
  const isDarkMode = themeClasses.bg.primary === 'bg-zinc-950';

  return (
    <main className={`min-h-screen ${themeClasses.bg.primary}`}>
      {/* Background decoration - apenas no modo dark */}
      {isDarkMode && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
        </div>
      )}

      <div className="relative mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/projects')}
            className={`group mb-4 inline-flex items-center gap-2 text-sm ${themeClasses.text.secondary} transition-colors hover:${themeClasses.text.primary}`}
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Voltar para projetos
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className={`rounded-lg ${isDarkMode ? 'bg-gradient-to-br from-violet-500/20 to-indigo-500/20' : 'bg-gradient-to-br from-violet-100 to-indigo-100'} p-2`}>
              <Building2 className={`h-6 w-6 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`} />
            </div>
            <div>
              <h1 className={`text-3xl font-bold md:text-4xl ${themeClasses.text.primary}`}>
                Configurações do workspace
              </h1>
              <p className={`mt-2 ${themeClasses.text.secondary}`}>
                Gerencie as configurações do seu workspace
              </p>
            </div>
          </div>
        </div>

        {/* Identidade */}
        <div className={`mb-6 rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} backdrop-blur-sm p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Image className={`h-5 w-5 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`} />
            <h2 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Identidade</h2>
          </div>

          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="relative">
              <div className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-violet-500/20 to-indigo-500/20' 
                  : 'bg-gradient-to-br from-violet-100 to-indigo-100'
              } text-3xl font-semibold shadow-lg ${themeClasses.text.primary}`}>
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : workspace.logoUrl ? (
                  <img
                    src={workspace.logoUrl}
                    alt={workspace.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">
                    {workspace.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {uploadingLogo && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 dark:bg-black/50">
                  <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <p className={`text-sm ${themeClasses.text.secondary} mb-2`}>
                Envie uma imagem para personalizar seu workspace
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.tertiary} px-4 py-2 text-sm ${themeClasses.text.secondary} transition-all hover:${themeClasses.bg.hover}`}>
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Enviar logo
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo || !canEdit}
                    className="hidden"
                  />
                </label>
                {logoPreview && (
                  <button
                    onClick={() => setLogoPreview(null)}
                    className={`rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.tertiary} px-4 py-2 text-sm ${themeClasses.text.secondary} transition-all hover:${themeClasses.bg.hover}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className={`mt-2 text-xs ${themeClasses.text.muted}`}>
                PNG, JPG ou GIF. Máximo 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Informações */}
        <div className={`mb-6 rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} backdrop-blur-sm p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Edit2 className={`h-5 w-5 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`} />
            <h2 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Informações</h2>
          </div>

          <div>
            <label className={`mb-2 flex items-center gap-2 text-sm font-medium ${themeClasses.text.primary}`}>
              <Building2 className={`h-4 w-4 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`} />
              Nome do workspace
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
              className={`w-full rounded-xl border px-4 py-2.5 outline-none transition-all disabled:cursor-not-allowed disabled:opacity-50 ${themeClasses.border.primary} ${themeClasses.bg.primary} ${themeClasses.text.primary} focus:border-violet-500 focus:ring-1 focus:ring-violet-500`}
              placeholder="Nome do workspace"
            />
            {name && (
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className={themeClasses.text.muted}>
                  {nameLength} caracteres
                </span>
                {isNameChanged && nameLength >= 3 && nameLength <= 50 && (
                  <span className={`flex items-center gap-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    <CheckCircle2 className="h-3 w-3" />
                    Pronto para salvar
                  </span>
                )}
                {nameLength > 50 && (
                  <span className="text-red-500">
                    Máximo 50 caracteres
                  </span>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className={`mt-4 flex items-center gap-2 rounded-lg border ${isDarkMode ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-emerald-200 bg-emerald-50 text-emerald-600'} p-3 text-sm`}>
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              {success}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading || !canEdit || !name.trim() || nameLength > 50 || !isNameChanged}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
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

        {/* Membros */}
        <div className={`mb-6 rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} backdrop-blur-sm p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <UserCog className={`h-5 w-5 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`} />
            <h2 className={`text-lg font-semibold ${themeClasses.text.primary}`}>Membros</h2>
          </div>
          <p className={`text-sm ${themeClasses.text.secondary}`}>
            Gerencie os membros e permissões do workspace pelo menu superior.
          </p>
          <button
            onClick={() => router.push('/dashboard/projects')}
            className={`mt-4 inline-flex items-center gap-2 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.tertiary} px-4 py-2 text-sm ${themeClasses.text.secondary} transition-all hover:${themeClasses.bg.hover}`}
          >
            <Shield className="h-4 w-4" />
            Gerenciar membros
          </button>
        </div>

        {/* Zona de perigo */}
        {!checkingPerms && canDelete && (
          <div className={`rounded-2xl border ${isDarkMode ? 'border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent' : 'border-red-200 bg-red-50/50'} p-6`}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                Zona de perigo
              </h2>
            </div>

            <p className={`text-sm ${themeClasses.text.secondary} mb-4`}>
              Deletar o workspace remove todos os projetos, tasks, membros e dados relacionados.
              Esta ação é irreversível.
            </p>

            <button
              onClick={handleDelete}
              disabled={loading}
              className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                isDarkMode 
                  ? 'border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300'
                  : 'border-red-300 bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              <Trash2 className="h-4 w-4" />
              {loading ? 'Deletando...' : 'Deletar workspace'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}