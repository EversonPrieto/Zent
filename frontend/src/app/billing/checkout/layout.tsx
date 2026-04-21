'use client';

import dynamic from 'next/dynamic';
import StripeProvider from '../../../components/StripeProvider';

const CheckoutPage = dynamic(() => import('./page'), { ssr: false });

export default function CheckoutLayout() {
  return (
    <StripeProvider>
      <CheckoutPage />
    </StripeProvider>
  );
}
