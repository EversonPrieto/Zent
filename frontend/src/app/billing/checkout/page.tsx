'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useTheme } from '../../../hooks/useTheme';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

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
        // Confirmar pagamento no backend
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
            console.log('[Checkout] Plan from backend:', updatedUser.plan);
            console.log('[Checkout] Subscription ends at:', updatedUser.subscriptionEndsAt);
            
            // Save updated user data with subscription info
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
      <main className={`min-h-screen flex items-center justify-center px-4 ${themeClasses.bg.primary}`}>
        <div className="max-w-md w-full text-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
          <h1 className={`text-3xl font-bold mb-2 ${themeClasses.text.primary}`}>Pagamento Realizado!</h1>
          <p className={`mb-6 ${themeClasses.text.tertiary}`}>
            Sua assinatura foi ativada com sucesso. Redirecionando...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={themeClasses.bg.primary}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 py-12">
        <button
          onClick={() => router.back()}
          className={`mb-6 transition-colors ${themeClasses.text.tertiary} hover:${themeClasses.text.primary}`}
        >
          ← Voltar
        </button>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-6 flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-400 font-medium text-sm">Modo de Teste</p>
            <p className={`text-xs mt-1 ${themeClasses.text.tertiary}`}>
              Use o cartão <span className="font-semibold text-amber-400">4242 4242 4242 4242</span> com qualquer data futura e CVC para testar. Nenhum valor será cobrado.
            </p>
          </div>
        </div>

        <div className={`rounded-2xl border backdrop-blur-sm p-8 ${themeClasses.border.primary} ${themeClasses.bg.secondary}`}>
          <h1 className={`text-2xl font-bold mb-2 ${themeClasses.text.primary}`}>Plano Pro</h1>
          <p className={`mb-6 ${themeClasses.text.tertiary}`}>R$ 29,00/mês • 14 dias de avaliação gratuita</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-2 ${themeClasses.text.secondary}`}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full rounded-lg border px-4 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 ${themeClasses.border.primary} ${themeClasses.bg.tertiary} ${themeClasses.text.primary}`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${themeClasses.text.secondary}`}>Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full rounded-lg border px-4 py-2 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 ${themeClasses.border.primary} ${themeClasses.bg.tertiary} ${themeClasses.text.primary}`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${themeClasses.text.secondary}`}>Cartão</label>
              <div className={`rounded-lg border p-3 ${themeClasses.border.primary} ${themeClasses.bg.tertiary}`}>
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#ffffff',
                        '::placeholder': {
                          color: '#71717a',
                        },
                      },
                      invalid: {
                        color: '#ef4444',
                      },
                    },
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !stripe}
              className="w-full mt-6 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 py-3 font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Processando...
                </>
              ) : (
                'Confirmar Pagamento'
              )}
            </button>

            <p className={`text-xs text-center ${themeClasses.text.tertiary}`}>
              Ao prosseguir, você concorda com nossos{' '}
              <a href="#" className="text-violet-400 hover:underline">
                Termos de Serviço
              </a>{' '}
              e{' '}
              <a href="#" className="text-violet-400 hover:underline">
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
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <CheckoutContent />
    </Suspense>
  );
}
