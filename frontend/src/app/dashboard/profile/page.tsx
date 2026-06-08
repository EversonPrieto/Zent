'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../../hooks/useTheme';
import { PlanComparison } from '../../../components/PlanComparison';
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
  CreditCard,
  X,
} from 'lucide-react';

type UserData = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { themeClasses } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<{
    plan: string;
    subscriptionEndsAt: string | null;
  } | null>(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);

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

          if (parsed.avatarUrl) {
            setAvatarUrl(parsed.avatarUrl);
          }
        }

        const savedEmailPrefs = localStorage.getItem('zent_email_notifications');
        if (savedEmailPrefs) {
          setEmailNotificationsEnabled(JSON.parse(savedEmailPrefs));
        }

        // Load subscription data from user
        const subscriptionInfo = localStorage.getItem('zent_user');
        if (subscriptionInfo) {
          const parsed = JSON.parse(subscriptionInfo);
          setSubscriptionData({
            plan: parsed.plan || 'free',
            subscriptionEndsAt: parsed.subscriptionEndsAt || null,
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

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter menos de 5MB');
      return;
    }

    setUploadingAvatar(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('zent_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/upload-avatar`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed - Status:', response.status, 'Body:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `Erro ${response.status}` };
        }
        throw new Error(errorData?.message || 'Erro ao fazer upload do avatar');
      }

      const updated = await response.json();

      setAvatarUrl(updated.avatarUrl);

      const updatedUser = { ...updated };
      setUser(updatedUser);

      localStorage.setItem('zent_user', JSON.stringify(updatedUser));

      setSuccess('Avatar atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Avatar upload error:', err);
      setError('Erro ao fazer upload do avatar. Tente novamente.');
    } finally {
      setUploadingAvatar(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function isSubscriptionActive(): boolean {
    if (!subscriptionData?.subscriptionEndsAt) return false;
    return new Date(subscriptionData.subscriptionEndsAt) > new Date();
  }

  async function handleCancelSubscription() {
    setCancelingSubscription(true);
    setError('');

    try {
      const token = localStorage.getItem('zent_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/billing/cancel-subscription`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao cancelar assinatura');
      }

      // Update subscription data
      setSubscriptionData({
        plan: 'free',
        subscriptionEndsAt: null,
      });

      // Update localStorage
      const userData = localStorage.getItem('zent_user');
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.plan = 'free';
        parsed.subscriptionEndsAt = null;
        localStorage.setItem('zent_user', JSON.stringify(parsed));
      }

      setSuccess('Assinatura cancelada com sucesso! Você voltou ao plano gratuito.');
      setShowCancelConfirmation(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Cancel subscription error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao cancelar assinatura. Tente novamente.');
    } finally {
      setCancelingSubscription(false);
    }
  }

  async function handleEmailNotificationsChange(enabled: boolean) {
    setEmailNotificationsEnabled(enabled);
    localStorage.setItem('zent_email_notifications', JSON.stringify(enabled));

    try {
      const token = localStorage.getItem('zent_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/email-preferences`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            emailNotificationsEnabled: enabled,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao atualizar preferências');
      }

      setSuccess(
        enabled
          ? 'Notificações por email ativadas!'
          : 'Notificações por email desativadas!'
      );
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Email preferences error:', err);
      setError('Erro ao atualizar preferências. Tente novamente.');
      setEmailNotificationsEnabled(!enabled);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setError('Todos os campos são obrigatórios');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setError('As senhas não conferem');
      return;
    }

    if (passwords.new.length < 8) {
      setError('A nova senha deve ter no mínimo 8 caracteres');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('zent_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: passwords.current,
            newPassword: passwords.new,
            confirmPassword: passwords.confirm,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao alterar senha');
      }

      setSuccess('Senha alterada com sucesso!');
      setPasswords({ current: '', new: '', confirm: '' });
      setShowPasswordChange(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Change password error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao alterar a senha. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

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
      <main className={`min-h-screen ${themeClasses.bg.primary} pt-20 px-4`}>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${themeClasses.bg.primary} pt-20 px-4 pb-20`}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className={`text-4xl font-bold ${themeClasses.text.primary} mb-2`}>Configurações de Perfil</h1>
          <p className={`${themeClasses.text.secondary}`}>Gereneie suas informações pessoais e preferências</p>
        </div>

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

        <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} backdrop-blur-sm p-8 mb-8`}>
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <div className={`h-20 w-20 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/20 overflow-hidden`}>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-violet-400" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-violet-500 hover:bg-violet-600 disabled:bg-violet-500/50 transition-all cursor-pointer"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <p className={`text-sm ${themeClasses.text.secondary}`}>Usuário</p>
              <p className={`text-2xl font-bold ${themeClasses.text.primary}`}>{user?.name || 'Seu Nome'}</p>
              <p className={`text-sm ${themeClasses.text.hint}`}>{user?.email || 'seu@email.com'}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>Nome Completo</label>
                <div className="relative">
                  <User className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${themeClasses.text.hint}`} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} ${themeClasses.text.primary} placeholder:${themeClasses.text.hint} focus:border-violet-500/50 focus:bg-violet-500/5 transition-all`}
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>Email</label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${themeClasses.text.hint}`} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} ${themeClasses.text.primary} placeholder:${themeClasses.text.hint} focus:border-violet-500/50 focus:bg-violet-500/5 transition-all`}
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

        <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} backdrop-blur-sm p-8 mb-8`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-bold ${themeClasses.text.primary}`}>Alterar Senha</h2>
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
                <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>Senha Atual</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className={`w-full pr-10 pl-4 py-2.5 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} ${themeClasses.text.primary} placeholder:${themeClasses.text.hint} focus:border-violet-500/50 focus:bg-violet-500/5 transition-all`}
                    placeholder="Digite sua senha atual"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                    }
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary}`}
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
                <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>Nova Senha</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className={`w-full pr-10 pl-4 py-2.5 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} ${themeClasses.text.primary} placeholder:${themeClasses.text.hint} focus:border-violet-500/50 focus:bg-violet-500/5 transition-all`}
                    placeholder="Digite uma nova senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary}`}
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
                <label className={`block text-sm font-medium ${themeClasses.text.primary} mb-2`}>Confirmar Senha</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className={`w-full pr-10 pl-4 py-2.5 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} ${themeClasses.text.primary} placeholder:${themeClasses.text.hint} focus:border-violet-500/50 focus:bg-violet-500/5 transition-all`}
                    placeholder="Confirme a nova senha"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                    }
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary}`}
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
                onClick={handleChangePassword}
                disabled={saving}
                className="w-full py-2.5 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 disabled:bg-violet-500/5 disabled:border-violet-500/10 text-violet-400 font-medium transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  'Atualizar Senha'
                )}
              </button>
            </div>
          )}
        </div>

        <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} backdrop-blur-sm p-8`}>
          <h2 className={`text-xl font-bold ${themeClasses.text.primary} mb-6`}>Preferências</h2>

          <div className="space-y-4">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${themeClasses.border.primary} hover:${themeClasses.border.secondary} transition-all`}>
              <div>
                <p className={`font-medium ${themeClasses.text.primary}`}>Notificações por Email</p>
                <p className={`text-sm ${themeClasses.text.secondary}`}>Receba alertas sobre suas tarefas</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotificationsEnabled}
                  onChange={(e) => handleEmailNotificationsChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
              </label>
            </div>

            <div className={`flex items-center justify-between p-4 rounded-xl border ${themeClasses.border.primary} hover:${themeClasses.border.secondary} transition-all`}>
              <div>
                <p className={`font-medium ${themeClasses.text.primary}`}>Duas Autenticações</p>
                <p className={`text-sm ${themeClasses.text.secondary}`}>Ativar 2FA para maior segurança</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
              </label>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} backdrop-blur-sm p-8`}>
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className={`h-6 w-6 ${themeClasses.text.primary}`} />
            <h2 className={`text-xl font-bold ${themeClasses.text.primary}`}>Gerenciamento de Assinatura</h2>
          </div>

          <div className="space-y-4">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${themeClasses.border.primary} hover:${themeClasses.border.secondary} transition-all`}>
              <div>
                <p className={`font-medium ${themeClasses.text.primary}`}>Plano Atual</p>
                <p className={`text-sm ${themeClasses.text.secondary}`}>
                  {subscriptionData?.plan === 'pro' ? 'Plano Pro' : 'Plano Gratuito'}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                subscriptionData?.plan === 'pro'
                  ? 'bg-violet-500/20 text-violet-400'
                  : 'bg-zinc-700/50 text-zinc-300'
              }`}>
                {subscriptionData?.plan === 'pro' ? 'Pro' : 'Free'}
              </div>
            </div>

            {subscriptionData?.plan === 'pro' && subscriptionData?.subscriptionEndsAt && (
              <>
                <div className={`flex items-center justify-between p-4 rounded-xl border ${themeClasses.border.primary} hover:${themeClasses.border.secondary} transition-all`}>
                  <div>
                    <p className={`font-medium ${themeClasses.text.primary}`}>Validade da Assinatura</p>
                    <p className={`text-sm ${themeClasses.text.secondary}`}>
                      {isSubscriptionActive() ? 'Ativo até' : 'Expirou em'}
                    </p>
                  </div>
                  <p className={`font-medium ${isSubscriptionActive() ? themeClasses.text.primary : 'text-red-400'}`}>
                    {formatDate(subscriptionData.subscriptionEndsAt)}
                  </p>
                </div>

                {!showCancelConfirmation ? (
                  <button
                    onClick={() => setShowCancelConfirmation(true)}
                    className="w-full py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium transition-all"
                  >
                    Cancelar Assinatura
                  </button>
                ) : (
                  <div className={`rounded-xl border ${themeClasses.border.primary} bg-red-500/10 p-4 space-y-3`}>
                    <p className={`font-medium ${themeClasses.text.primary}`}>
                      Tem certeza que deseja cancelar sua assinatura?
                    </p>
                    <p className={`text-sm ${themeClasses.text.secondary}`}>
                      Você perderá acesso aos recursos premium imediatamente.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowCancelConfirmation(false)}
                        disabled={cancelingSubscription}
                        className="flex-1 py-2 rounded-lg border border-zinc-600 hover:border-zinc-500 text-zinc-300 font-medium transition-all disabled:opacity-50"
                      >
                        Manter Assinatura
                      </button>
                      <button
                        onClick={handleCancelSubscription}
                        disabled={cancelingSubscription}
                        className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-medium transition-all flex items-center justify-center gap-2"
                      >
                        {cancelingSubscription ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Cancelando...
                          </>
                        ) : (
                          'Confirmar Cancelamento'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {subscriptionData?.plan === 'free' && (
              <button
                onClick={() => router.push('/pricing')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-medium transition-all"
              >
                Atualizar para Pro
              </button>
            )}
          </div>
        </div>

        <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} backdrop-blur-sm p-8`}>
          <h2 className={`text-xl font-bold ${themeClasses.text.primary} mb-6`}>Comparação de Planos</h2>
          <PlanComparison currentPlan={(subscriptionData?.plan as any) || 'free'} />
        </div>
      </div>
    </main>
  );
}
