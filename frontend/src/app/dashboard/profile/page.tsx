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
  Sparkles,
  ShieldCheck,
  BellRing,
  Crown,
  Lock,
  ArrowRight,
} from 'lucide-react';

type UserData = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  avatarUrl?: string | null;
  plan?: string;
  subscriptionEndsAt?: string | null;
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

  const profileCardClass = `rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-5 sm:p-6 lg:p-8 transition-all duration-200 hover:shadow-lg`;
  const inputClassName = `w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} ${themeClasses.text.primary} px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-zinc-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`;

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

      setSubscriptionData({
        plan: 'free',
        subscriptionEndsAt: null,
      });

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
      <main className={`min-h-[calc(100vh-80px)] ${themeClasses.bg.primary}`}>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
            <div className="absolute inset-0 h-10 w-10 animate-pulse rounded-full bg-violet-500/20 blur-lg" />
          </div>
          <p className={`mt-4 text-sm font-medium ${themeClasses.text.tertiary}`}>
            Carregando perfil...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-[calc(100vh-80px)] ${themeClasses.bg.primary}`}>
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 pb-10 pt-6 sm:px-6 sm:gap-6 sm:pb-12 sm:pt-8">
        {/* Notifications */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-400">Erro</p>
              <p className="text-sm text-red-400/80">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-400">Sucesso</p>
              <p className="text-sm text-emerald-400/80">{success}</p>
            </div>
          </div>
        )}

        {/* Header Card */}
        <section className={profileCardClass}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
              {/* Avatar */}
              <div className="relative">
                <div className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-violet-500/30 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 shadow-xl shadow-violet-500/10 sm:h-28 sm:w-28`}>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user?.name || 'Avatar do usuário'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-violet-300">
                      {(user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 flex items-center gap-1.5 rounded-full border border-white/10 bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur transition-all duration-200 hover:bg-zinc-800 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3" />
                  )}
                  <span>{uploadingAvatar ? '...' : 'Alterar'}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              {/* Info */}
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border ${themeClasses.border.primary} ${themeClasses.bg.primary} px-3 py-1 text-xs font-semibold ${themeClasses.text.secondary}`}>
                    <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                    Perfil ativo
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border ${themeClasses.border.primary} ${themeClasses.bg.primary} px-3 py-1 text-xs font-semibold ${themeClasses.text.secondary}`}>
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    Conta protegida
                  </span>
                </div>
                <div>
                  <h1 className={`text-2xl font-bold tracking-tight sm:text-3xl ${themeClasses.text.primary}`}>
                    Configurações de Perfil
                  </h1>
                  <p className={`mt-1.5 text-sm ${themeClasses.text.tertiary}`}>
                    Gerencie suas informações, segurança e preferências de conta.
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <div className={`w-full rounded-2xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} p-4 lg:w-auto lg:min-w-[220px]`}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${themeClasses.text.hint}`}>
                Resumo
              </p>
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-sm ${themeClasses.text.tertiary}`}>Plano</span>
                  <span className={`text-sm font-bold ${subscriptionData?.plan === 'pro' ? 'text-violet-400' : themeClasses.text.primary}`}>
                    {subscriptionData?.plan === 'pro' ? 'Pro' : 'Free'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-sm ${themeClasses.text.tertiary}`}>Status</span>
                  <span className="text-sm font-bold text-emerald-400">Ativo</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid gap-5 sm:gap-6 xl:grid-cols-[1.35fr_0.9fr]">
          {/* Left Column */}
          <div className="space-y-5 sm:space-y-6">
            {/* Personal Data */}
            <section className={profileCardClass}>
              <div className="mb-5 sm:mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-violet-500/10 p-2">
                    <User className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${themeClasses.text.primary}`}>Dados pessoais</h2>
                    <p className={`text-xs ${themeClasses.text.tertiary}`}>Atualize seu nome e e-mail</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={`mb-2 flex items-center gap-2 text-sm font-semibold ${themeClasses.text.secondary}`}>
                      <User className="h-4 w-4 text-violet-400" /> Nome
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={inputClassName}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div>
                    <label className={`mb-2 flex items-center gap-2 text-sm font-semibold ${themeClasses.text.secondary}`}>
                      <Mail className="h-4 w-4 text-violet-400" /> Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={inputClassName}
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
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

            {/* Security */}
            <section className={profileCardClass}>
              <div className="mb-5 sm:mb-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-violet-500/10 p-2">
                      <Lock className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <h2 className={`text-lg font-bold ${themeClasses.text.primary}`}>Segurança</h2>
                      <p className={`text-xs ${themeClasses.text.tertiary}`}>Atualize sua senha</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                    className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-400 transition-all duration-200 hover:bg-violet-500/20 active:scale-95"
                  >
                    {showPasswordChange ? 'Cancelar' : 'Alterar senha'}
                  </button>
                </div>
              </div>

              {showPasswordChange && (
                <div className="space-y-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
                  <div>
                    <label className={`mb-2 block text-sm font-semibold ${themeClasses.text.secondary}`}>Senha atual</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        className={`pr-11 ${inputClassName}`}
                        placeholder="Digite sua senha atual"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className={`absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 ${themeClasses.text.tertiary} transition-all duration-200 hover:text-violet-400 hover:bg-violet-500/10`}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`mb-2 block text-sm font-semibold ${themeClasses.text.secondary}`}>Nova senha</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        className={`pr-11 ${inputClassName}`}
                        placeholder="Digite uma nova senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className={`absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 ${themeClasses.text.tertiary} transition-all duration-200 hover:text-violet-400 hover:bg-violet-500/10`}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`mb-2 block text-sm font-semibold ${themeClasses.text.secondary}`}>Confirmar senha</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        className={`pr-11 ${inputClassName}`}
                        placeholder="Confirme a nova senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className={`absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 ${themeClasses.text.tertiary} transition-all duration-200 hover:text-violet-400 hover:bg-violet-500/10`}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-400 transition-all duration-200 hover:bg-violet-500/20 active:scale-95 disabled:opacity-50"
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

          {/* Right Column */}
          <div className="space-y-5 sm:space-y-6">
            {/* Preferences */}
            <section className={profileCardClass}>
              <div className="mb-5 sm:mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-violet-500/10 p-2">
                    <BellRing className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${themeClasses.text.primary}`}>Preferências</h2>
                    <p className={`text-xs ${themeClasses.text.tertiary}`}>Ajuste suas notificações</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className={`flex items-center justify-between gap-4 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} p-4 transition-all duration-200 hover:border-violet-500/30`}>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${themeClasses.text.primary}`}>Notificações por email</p>
                    <p className={`text-xs ${themeClasses.text.tertiary}`}>Receba alertas sobre suas tarefas</p>
                  </div>
                  <label className="relative inline-flex flex-shrink-0 cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={emailNotificationsEnabled}
                      onChange={(e) => handleEmailNotificationsChange(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-zinc-700 transition-colors peer-checked:bg-violet-500 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-md after:transition-transform peer-checked:after:translate-x-full" />
                  </label>
                </div>

                <div className={`flex items-center justify-between gap-4 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} p-4 opacity-50`}>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${themeClasses.text.primary}`}>Autenticação em duas etapas</p>
                    <p className={`text-xs ${themeClasses.text.tertiary}`}>Em breve</p>
                  </div>
                  <div className="h-6 w-11 rounded-full bg-zinc-800 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-zinc-600" />
                </div>
              </div>
            </section>

            {/* Subscription */}
            <section className={profileCardClass}>
              <div className="mb-5 sm:mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-violet-500/10 p-2">
                    <Crown className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${themeClasses.text.primary}`}>Assinatura</h2>
                    <p className={`text-xs ${themeClasses.text.tertiary}`}>Gerencie seu plano</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className={`flex items-center justify-between gap-4 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} p-4`}>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${themeClasses.text.primary}`}>Plano atual</p>
                    <p className={`text-xs ${themeClasses.text.tertiary}`}>
                      {subscriptionData?.plan === 'pro' ? 'Plano Pro' : 'Plano Gratuito'}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    subscriptionData?.plan === 'pro'
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'bg-zinc-700 text-zinc-300'
                  }`}>
                    {subscriptionData?.plan === 'pro' ? 'Pro' : 'Free'}
                  </span>
                </div>

                {subscriptionData?.plan === 'pro' && subscriptionData?.subscriptionEndsAt && (
                  <>
                    <div className={`flex items-center justify-between gap-4 rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} p-4`}>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${themeClasses.text.primary}`}>Validade</p>
                        <p className={`text-xs ${themeClasses.text.tertiary}`}>
                          {isSubscriptionActive() ? 'Ativo até' : 'Expirou em'}
                        </p>
                      </div>
                      <p className={`text-sm font-bold ${isSubscriptionActive() ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatDate(subscriptionData.subscriptionEndsAt)}
                      </p>
                    </div>

                    {!showCancelConfirmation ? (
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirmation(true)}
                        className="w-full rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-semibold text-red-400 transition-all duration-200 hover:bg-red-500/10 active:scale-95"
                      >
                        Cancelar assinatura
                      </button>
                    ) : (
                      <div className="space-y-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                        <p className={`text-sm font-semibold ${themeClasses.text.primary}`}>
                          Cancelar assinatura?
                        </p>
                        <p className={`text-xs ${themeClasses.text.tertiary}`}>
                          Você perderá acesso aos recursos premium.
                        </p>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setShowCancelConfirmation(false)}
                            disabled={cancelingSubscription}
                            className="flex-1 rounded-xl border ${themeClasses.border.primary} px-4 py-2.5 text-sm font-semibold ${themeClasses.text.secondary} transition-all duration-200 hover:bg-zinc-800/50 disabled:opacity-50"
                          >
                            Manter
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelSubscription}
                            disabled={cancelingSubscription}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-red-600 active:scale-95 disabled:opacity-50"
                          >
                            {cancelingSubscription ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cancelando...
                              </>
                            ) : (
                              'Confirmar'
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Atualizar para Pro
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Plan Comparison */}
        <section className={profileCardClass}>
          <div className="mb-5 sm:mb-6">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-violet-500/10 p-2">
                <Sparkles className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${themeClasses.text.primary}`}>Comparação de planos</h2>
                <p className={`text-xs ${themeClasses.text.tertiary}`}>Veja os recursos disponíveis</p>
              </div>
            </div>
          </div>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="min-w-[640px] sm:min-w-0">
              <PlanComparison currentPlan={(subscriptionData?.plan as any) || 'free'} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}