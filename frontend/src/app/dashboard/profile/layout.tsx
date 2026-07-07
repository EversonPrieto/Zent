import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Perfil - Zent',
  description: 'Gerencie suas informações pessoais e configurações de perfil',
};

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
