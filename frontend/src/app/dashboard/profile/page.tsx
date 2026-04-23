'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Upload,
  Eye,
  EyeOff,
} from 'lucide-react';

type UserData = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const userData = localStorage.getItem('zent_user');
        if (userData) {
          const parsed = JSON.parse(userData);
          setUser(parsed);
          setFormData({
            name: parsed.name || '',
            email: parsed.email || '',
          });
        }
      } catch (err) {
        setError('Erro ao carregar perfil');
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, []);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('zent_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/profile`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao atualizar perfil');
      }

      const updated = await response.json();

      // Atualizar localStorage
      localStorage.setItem('zent_user', JSON.stringify(updated));
      setUser(updated);
      setSuccess('Perfil atualizado com sucesso!');

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 pt-20 px-4">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 pt-20 px-4 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Configurações de Perfil</h1>
          <p className="text-zinc-400">Gereneie suas informações pessoais e preferências</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-400">Erro</p>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-emerald-400">Sucesso</p>
              <p className="text-sm text-emerald-300">{success}</p>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 mb-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/20">
                <User className="h-10 w-10 text-violet-400" />
              </div>
              <button className="absolute bottom-0 right-0 p-2 rounded-full bg-violet-500 hover:bg-violet-600 transition-all">
                <Upload className="h-4 w-4 text-white" />
              </button>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Usuário</p>
              <p className="text-2xl font-bold text-white">{user?.name || 'Seu Nome'}</p>
              <p className="text-sm text-zinc-500">{user?.email || 'seu@email.com'}</p>
            </div>
          </div>

          {/* Edit Profile Form */}
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-zinc-500 focus:border-violet-500/50 focus:bg-white/10 transition-all"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-zinc-500 focus:border-violet-500/50 focus:bg-white/10 transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 disabled:from-zinc-600 disabled:to-zinc-600 text-white font-medium transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </button>
          </form>
        </div>

        {/* Password Change Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Alterar Senha</h2>
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="text-violet-400 hover:text-violet-300 text-sm font-medium"
            >
              {showPasswordChange ? 'Cancelar' : 'Alterar'}
            </button>
          </div>

          {showPasswordChange && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Senha Atual</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-zinc-500 focus:border-violet-500/50 focus:bg-white/10 transition-all"
                    placeholder="Digite sua senha atual"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Nova Senha</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-zinc-500 focus:border-violet-500/50 focus:bg-white/10 transition-all"
                    placeholder="Digite uma nova senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Confirmar Senha</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-zinc-500 focus:border-violet-500/50 focus:bg-white/10 transition-all"
                    placeholder="Confirme a nova senha"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="w-full py-2.5 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 font-medium transition-all"
              >
                Atualizar Senha
              </button>
            </div>
          )}
        </div>

        {/* Preferences Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8">
          <h2 className="text-xl font-bold text-white mb-6">Preferências</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all">
              <div>
                <p className="font-medium text-white">Notificações por Email</p>
                <p className="text-sm text-zinc-400">Receba alertas sobre suas tarefas</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all">
              <div>
                <p className="font-medium text-white">Tema Escuro</p>
                <p className="text-sm text-zinc-400">Usar tema escuro por padrão</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all">
              <div>
                <p className="font-medium text-white">Duas Autenticações</p>
                <p className="text-sm text-zinc-400">Ativar 2FA para maior segurança</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
