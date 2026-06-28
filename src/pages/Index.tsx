import React from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { IngressoProvider } from '@/contexts/IngressoContext';
import { LoginScreen } from '@/components/LoginScreen';
import { Dashboard } from '@/components/Dashboard';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <IngressoProvider>
      <Dashboard />
    </IngressoProvider>
  );
}

export default function Index() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
