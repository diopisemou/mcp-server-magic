
import { ReactNode } from 'react';
import { Header } from '@/components/ui/header';

interface HeaderLayoutProps {
  children: ReactNode;
}

export default function HeaderLayout({ children }: HeaderLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
