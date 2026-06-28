import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { CriarIngresso } from '@/components/CriarIngresso';
import { ValidarIngresso } from '@/components/ValidarIngresso';

export function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.tipo === 'admin';
  
  // Segurança só pode ver "validar"
  const [activeTab, setActiveTab] = useState<'criar' | 'validar'>(
    isAdmin ? 'criar' : 'validar'
  );

  // Garantir que segurança não veja "criar"
  useEffect(() => {
    if (!isAdmin && activeTab === 'criar') {
      setActiveTab('validar');
    }
  }, [isAdmin, activeTab]);

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="pb-8">
        {activeTab === 'criar' && isAdmin ? (
          <CriarIngresso />
        ) : (
          <ValidarIngresso />
        )}
      </main>
    </div>
  );
}
