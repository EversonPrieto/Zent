'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTheme } from '../../../hooks/useTheme';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, Shield, Zap, CreditCard } from 'lucide-react';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stripe = useStripe();
  const elements = useElements();
  const { themeClasses } = useTheme();

  const [plan] = useState(searchParams.get('plan') || 'pro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
  });

  useEffect(() => {
    const userRaw = localStorage.getItem('zent_user');
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        setFormData({
          email: user.email || '',
          name: user.name || '',
        });
      } catch {}
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe não carregou. Tente novamente.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('zent_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/billing/create-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            plan,
            email: formData.email,
            name: formData.name,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao processar pagamento');
      }

      const data = await response.json();

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Elemento do cartão não encontrado');
      }

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: formData.email,
            name: formData.name,
          },
        },
      });

      if (result.error) {
        setError(result.error.message || 'Erro ao processar pagamento');
      } else if (result.paymentIntent?.status === 'succeeded') {
        try {
          const token = localStorage.getItem('zent_token');
          console.log('[Checkout] Payment succeeded, confirming with backend...');
          
          const confirmResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/billing/confirm-intent`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                paymentIntentId: result.paymentIntent.id,
              }),
            }
          );

          console.log('[Checkout] Confirm response status:', confirmResponse.status);

          if (confirmResponse.ok) {
            const updatedUser = await confirmResponse.json();
            console.log('[Checkout] Updated user data received:', updatedUser);
            
            localStorage.setItem('zent_user', JSON.stringify(updatedUser));
            console.log('[Checkout] User data saved to localStorage');
          } else {
            const errorData = await confirmResponse.json().catch(() => ({
              error: 'Could not parse error response'
            }));
            console.error('[Checkout] Backend error response:', {
              status: confirmResponse.status,
              data: errorData,
            });
            setError(`Erro ao confirmar pagamento: ${errorData.message || 'Erro desconhecido'}`);
            setLoading(false);
            return;
          }
        } catch (confirmErr) {
          console.error('[Checkout] Error confirming payment:', confirmErr);
          setError(`Erro ao confirmar pagamento: ${confirmErr instanceof Error ? confirmErr.message : 'Erro desconhecido'}`);
          setLoading(false);
          return;
        }
        
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard/overview');
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className={`relative min-h-screen flex items-center justify-center px-4 ${themeClasses.bg.primary}`}>
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className={`text-3xl font-bold tracking-tight mb-3 ${themeClasses.text.primary}`}>
            Pagamento Realizado!
          </h1>
          <p className={`text-sm leading-relaxed ${themeClasses.text.tertiary}`}>
            Sua assinatura foi ativada com sucesso. Redirecionando para o dashboard...
          </p>
          <div className="mt-6">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400 mx-auto" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`relative min-h-screen ${themeClasses.bg.primary}`}>
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-500/8 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-500/8 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-md px-4 py-8 sm:py-12">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className={`group mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${themeClasses.text.tertiary} hover:text-violet-400 hover:bg-violet-500/5`}
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
          Voltar
        </button>

        {/* Test Mode Alert */}
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="rounded-lg bg-amber-500/10 p-1.5">
            <AlertCircle className="h-5 w-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-400">Modo de Teste</p>
            <p className={`mt-1 text-xs leading-relaxed ${themeClasses.text.tertiary}`}>
              Use o cartão <span className="font-bold text-amber-400">4242 4242 4242 4242</span> com qualquer data futura e CVC.
            </p>
          </div>
        </div>

        {/* Checkout Card */}
        <div className={`rounded-3xl border ${themeClasses.border.primary} ${themeClasses.bg.subtle} p-6 sm:p-8 shadow-2xl shadow-black/10`}>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-violet-500/10 p-2">
                <Zap className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold tracking-tight ${themeClasses.text.primary}`}>
                  Plano Pro
                </h1>
                <p className={`text-sm ${themeClasses.text.tertiary}`}>
                  R$ 29,00/mês • 14 dias grátis
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-semibold ${themeClasses.text.secondary}`}>
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} px-4 py-3 text-sm ${themeClasses.text.primary} outline-none transition-all duration-200 placeholder:text-zinc-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
                placeholder="seu@email.com"
                required
              />
            </div>

            {/* Name */}
            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-semibold ${themeClasses.text.secondary}`}>
                Nome completo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} px-4 py-3 text-sm ${themeClasses.text.primary} outline-none transition-all duration-200 placeholder:text-zinc-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20`}
                placeholder="Seu nome"
                required
              />
            </div>

            {/* Card */}
            <div>
              <label className={`mb-2 flex items-center gap-2 text-sm font-semibold ${themeClasses.text.secondary}`}>
                <CreditCard className="h-4 w-4 text-violet-400" />
                Cartão de crédito
              </label>
              <div className={`rounded-xl border ${themeClasses.border.primary} ${themeClasses.bg.primary} p-4 transition-all duration-200 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20`}>
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: themeClasses.text.primary === 'text-white' ? '#ffffff' : '#18181b',
                        '::placeholder': {
                          color: '#71717a',
                        },
                        fontFamily: 'inherit',
                      },
                      invalid: {
                        color: '#ef4444',
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !stripe}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Confirmar Pagamento
                  </>
                )}
              </span>
            </button>

            {/* Terms */}
            <p className={`text-center text-xs ${themeClasses.text.tertiary}`}>
              Ao prosseguir, você concorda com nossos{' '}
              <a href="#" className="text-violet-400 hover:underline font-medium">
                Termos de Serviço
              </a>{' '}
              e{' '}
              <a href="#" className="text-violet-400 hover:underline font-medium">
                Política de Privacidade
              </a>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <CheckoutContent />
    </Suspense>
  );
}