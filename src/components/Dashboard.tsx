import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header, type ActiveTab } from '@/components/Header';
import { LoginScreen } from '@/components/LoginScreen';
import { ListaConvidadosPorCliente } from './Listaconvidadosporcliente';
import { CriarIngresso } from '@/components/CriarIngresso';
import { ValidarIngresso } from '@/components/ValidarIngresso';
import { Loader2 } from 'lucide-react';

export function Dashboard() {
  const { user, isLoading } = useAuth();
  const isAdmin = user?.tipo === 'admin';

  const [activeTab, setActiveTab] = useState<ActiveTab>(
    isAdmin ? 'criar' : 'lista'
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {activeTab === 'criar' && isAdmin && <CriarIngresso />}
        {activeTab === 'lista' && <ListaConvidadosPorCliente />}
        {activeTab === 'validar' && <ValidarIngresso />}
      </main>
    </div>
  );
}