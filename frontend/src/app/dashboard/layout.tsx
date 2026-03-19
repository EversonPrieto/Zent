import { ReactNode } from 'react';
import AppHeader from '../../components/AppHeader';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <AppHeader />
      {children}
    </div>
  );
}