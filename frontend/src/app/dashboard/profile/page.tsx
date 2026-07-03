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
  Sparkles,
  ShieldCheck,
  BellRing,
  Crown,
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

  const profileCardClass = `rounded-3xl border ${themeClasses.border.primary} ${themeClasses.bg.secondary} shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-sm`;
  const inputClassName = `w-full rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} ${themeClasses.text.primary} px-4 py-3 text-sm outline-none transition-all placeholder:${themeClasses.text.hint} focus:border-violet-500/60 focus:bg-violet-500/10 focus:ring-2 focus:ring-violet-500/20`;

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

        // Fallback: localStorage (caso /auth/me não traga o campo)
        const savedEmailPrefs = localStorage.getItem('zent_email_notifications');
        if (savedEmailPrefs) {
          setEmailNotificationsEnabled(JSON.parse(savedEmailPrefs));
        }

        // Fonte de verdade: buscar preferências no backend via /auth/me
        const token = localStorage.getItem('zent_token');
        if (token) {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            const me = await response.json();
            if (typeof me.emailNotificationsEnabled === 'boolean') {
              setEmailNotificationsEnabled(me.emailNotificationsEnabled);
              localStorage.setItem(
                'zent_email_notifications',
                JSON.stringify(me.emailNotificationsEnabled)
              );
            }
          }
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
    <main className={`min-h-screen ${themeClasses.bg.primary} px-4 pb-20 pt-20`}>
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
            <div>
              <p className="font-medium text-red-400">Erro</p>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
            <div>
              <p className="font-medium text-emerald-400">Sucesso</p>
              <p className="text-sm text-emerald-300">{success}</p>
            </div>
          </div>
        )}

        <section className={`${profileCardClass} overflow-hidden p-6 sm:p-8`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative">
                <div className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-violet-500/40 bg-gradient-to-br from-violet-500/25 via-indigo-500/20 to-sky-500/20 shadow-lg shadow-violet-500/10 sm:h-28 sm:w-28`}>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user?.name || 'Avatar do usuário'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-violet-100">
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-[-6px] right-[-2px] flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/90 px-3 py-2 text-[11px] font-medium text-white shadow-lg backdrop-blur transition-all hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  <span>{uploadingAvatar ? 'Enviando...' : 'Alterar foto'}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              <div className="space-y-3">
                <div className={`inline-flex items-center gap-2 rounded-full border ${themeClasses.border.primary} ${themeClasses.bg.primary} px-3 py-1 text-xs font-medium ${themeClasses.text.secondary}`}>
                  <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                  Perfil ativo
                </div>
                <div>
                  <h1 className={`text-2xl font-semibold ${themeClasses.text.primary} sm:text-3xl`}>
                    Configurações de Perfil
                  </h1>
                  <p className={`mt-1 max-w-2xl text-sm sm:text-base ${themeClasses.text.secondary}`}>
                    Gerencie suas informações, segurança e preferências de conta com uma visão mais organizada.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-2 rounded-full border ${themeClasses.border.primary} ${themeClasses.bg.primary} px-3 py-1 text-sm ${themeClasses.text.secondary}`}>
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Conta protegida
                  </span>
                  <span className={`inline-flex items-center gap-2 rounded-full border ${themeClasses.border.primary} ${themeClasses.bg.primary} px-3 py-1 text-sm ${themeClasses.text.secondary}`}>
                    <BellRing className="h-4 w-4 text-violet-400" />
                    Notificações {emailNotificationsEnabled ? 'ativas' : 'desativadas'}
                  </span>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} p-4 sm:min-w-[220px]`}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.25em] ${themeClasses.text.hint}`}>
                Resumo
              </p>
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-sm ${themeClasses.text.secondary}`}>Plano</span>
                  <span className="text-sm font-semibold text-violet-400">
                    {subscriptionData?.plan === 'pro' ? 'Pro' : 'Free'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-sm ${themeClasses.text.secondary}`}>Status</span>
                  <span className={`text-sm font-semibold ${themeClasses.text.primary}`}>
                    {user?.email ? 'Ativo' : 'Pendente'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
          <div className="space-y-6">
            <section className={`${profileCardClass} p-6 sm:p-8`}>
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className={`text-xl font-semibold ${themeClasses.text.primary}`}>Dados pessoais</h2>
                  <p className={`text-sm ${themeClasses.text.secondary}`}>
                    Atualize seu nome e e-mail sem alterar a estrutura da sua conta.
                  </p>
                </div>
                <div className={`inline-flex items-center gap-2 rounded-full border ${themeClasses.border.primary} ${themeClasses.bg.primary} px-3 py-1 text-sm ${themeClasses.text.secondary}`}>
                  <User className="h-4 w-4 text-violet-400" />
                  Informações principais
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={`mb-2 block text-sm font-medium ${themeClasses.text.primary}`}>Nome completo</label>
                    <div className="relative">
                      <User className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${themeClasses.text.hint}`} />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`pl-10 ${inputClassName}`}
                        placeholder="Seu nome completo"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`mb-2 block text-sm font-medium ${themeClasses.text.primary}`}>Email</label>
                    <div className="relative">
                      <Mail className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${themeClasses.text.hint}`} />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`pl-10 ${inputClassName}`}
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 font-medium text-white transition-all hover:from-violet-600 hover:to-indigo-600 disabled:from-zinc-600 disabled:to-zinc-600"
                >
                  {saving ? (
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
              </form>
            </section>

            <section className={`${profileCardClass} p-6 sm:p-8`}>
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <h2 className={`text-xl font-semibold ${themeClasses.text.primary}`}>Segurança</h2>
                  <p className={`text-sm ${themeClasses.text.secondary}`}>
                    Atualize sua senha com segurança e mantenha sua conta protegida.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-sm font-medium text-violet-400 transition-all hover:bg-violet-500/20"
                >
                  {showPasswordChange ? 'Cancelar' : 'Alterar senha'}
                </button>
              </div>

              {showPasswordChange && (
                <div className="space-y-4">
                  <div>
                    <label className={`mb-2 block text-sm font-medium ${themeClasses.text.primary}`}>Senha atual</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        className={`pr-10 ${inputClassName}`}
                        placeholder="Digite sua senha atual"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary}`}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`mb-2 block text-sm font-medium ${themeClasses.text.primary}`}>Nova senha</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        className={`pr-10 ${inputClassName}`}
                        placeholder="Digite uma nova senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary}`}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`mb-2 block text-sm font-medium ${themeClasses.text.primary}`}>Confirmar senha</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        className={`pr-10 ${inputClassName}`}
                        placeholder="Confirme a nova senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary}`}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 font-medium text-violet-400 transition-all hover:bg-violet-500/20 disabled:border-violet-500/10 disabled:bg-violet-500/5"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Atualizando...
                      </>
                    ) : (
                      'Atualizar senha'
                    )}
                  </button>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className={`${profileCardClass} p-6 sm:p-8`}>
              <div className="mb-6">
                <h2 className={`text-xl font-semibold ${themeClasses.text.primary}`}>Preferências</h2>
                <p className={`mt-1 text-sm ${themeClasses.text.secondary}`}>
                  Ajuste as preferências da sua conta sem perder o contexto do seu fluxo de trabalho.
                </p>
              </div>

              <div className="space-y-3">
                <div className={`flex items-center justify-between rounded-2xl border ${themeClasses.border.primary} p-4 transition-all hover:${themeClasses.border.secondary}`}>
                  <div>
                    <p className={`font-medium ${themeClasses.text.primary}`}>Notificações por email</p>
                    <p className={`text-sm ${themeClasses.text.secondary}`}>Receba alertas sobre suas tarefas</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={emailNotificationsEnabled}
                      onChange={(e) => handleEmailNotificationsChange(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-zinc-700 peer-checked:bg-violet-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                </div>

                <div className={`flex items-center justify-between rounded-2xl border ${themeClasses.border.primary} p-4 transition-all hover:${themeClasses.border.secondary}`}>
                  <div>
                    <p className={`font-medium ${themeClasses.text.primary}`}>Duas autenticações</p>
                    <p className={`text-sm ${themeClasses.text.secondary}`}>Ativar 2FA para maior segurança</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="h-6 w-11 rounded-full bg-zinc-700 peer-checked:bg-violet-500 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                </div>
              </div>
            </section>

            <section className={`${profileCardClass} p-6 sm:p-8`}>
              <div className="mb-6 flex items-center gap-3">
                <div className={`rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} p-2`}>
                  <Crown className={`h-5 w-5 ${themeClasses.text.primary}`} />
                </div>
                <div>
                  <h2 className={`text-xl font-semibold ${themeClasses.text.primary}`}>Assinatura</h2>
                  <p className={`text-sm ${themeClasses.text.secondary}`}>Gerencie seu plano atual e recursos premium.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className={`flex items-center justify-between rounded-2xl border ${themeClasses.border.primary} p-4`}>
                  <div>
                    <p className={`font-medium ${themeClasses.text.primary}`}>Plano atual</p>
                    <p className={`text-sm ${themeClasses.text.secondary}`}>
                      {subscriptionData?.plan === 'pro' ? 'Plano Pro' : 'Plano Gratuito'}
                    </p>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-sm font-medium ${
                    subscriptionData?.plan === 'pro'
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'bg-zinc-700/50 text-zinc-300'
                  }`}>
                    {subscriptionData?.plan === 'pro' ? 'Pro' : 'Free'}
                  </div>
                </div>

                {subscriptionData?.plan === 'pro' && subscriptionData?.subscriptionEndsAt && (
                  <>
                    <div className={`flex items-center justify-between rounded-2xl border ${themeClasses.border.primary} p-4`}>
                      <div>
                        <p className={`font-medium ${themeClasses.text.primary}`}>Validade da assinatura</p>
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
                        type="button"
                        onClick={() => setShowCancelConfirmation(true)}
                        className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-medium text-red-400 transition-all hover:bg-red-500/20"
                      >
                        Cancelar assinatura
                      </button>
                    ) : (
                      <div className={`space-y-3 rounded-2xl border ${themeClasses.border.primary} bg-red-500/10 p-4`}>
                        <p className={`font-medium ${themeClasses.text.primary}`}>
                          Tem certeza que deseja cancelar sua assinatura?
                        </p>
                        <p className={`text-sm ${themeClasses.text.secondary}`}>
                          Você perderá acesso aos recursos premium imediatamente.
                        </p>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <button
                            type="button"
                            onClick={() => setShowCancelConfirmation(false)}
                            disabled={cancelingSubscription}
                            className="flex-1 rounded-2xl border border-zinc-600 px-4 py-2.5 font-medium text-zinc-300 transition-all hover:border-zinc-500 disabled:opacity-50"
                          >
                            Manter assinatura
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelSubscription}
                            disabled={cancelingSubscription}
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-2.5 font-medium text-white transition-all hover:bg-red-600 disabled:bg-red-500/50"
                          >
                            {cancelingSubscription ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cancelando...
                              </>
                            ) : (
                              'Confirmar cancelamento'
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {subscriptionData?.plan === 'free' && (
                  <button
                    type="button"
                    onClick={() => router.push('/pricing')}
                    className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 font-medium text-white transition-all hover:from-violet-600 hover:to-indigo-600"
                  >
                    Atualizar para Pro
                  </button>
                )}
              </div>
            </section>
          </div>
        </div>

        <section className={`${profileCardClass} p-6 sm:p-8`}>
          <div className="mb-6">
            <h2 className={`text-xl font-semibold ${themeClasses.text.primary}`}>Comparação de planos</h2>
            <p className={`mt-1 text-sm ${themeClasses.text.secondary}`}>
              Veja como o seu plano atual se compara aos recursos disponíveis.
            </p>
          </div>
          <PlanComparison currentPlan={(subscriptionData?.plan as any) || 'free'} />
        </section>
      </div>
    </main>
  );
}
