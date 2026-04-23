import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Perfil - Zent',
  description: 'Gereneie suas informações pessoais e configurações de perfil',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
