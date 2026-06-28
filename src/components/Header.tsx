import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, LogOut, User } from 'lucide-react';

interface HeaderProps {
  activeTab: 'criar' | 'validar';
  onTabChange: (tab: 'criar' | 'validar') => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isAdmin = user.tipo === 'admin';

  return (
    <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Ticket className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Sistema de Ingressos</h1>
              <p className="text-xs text-muted-foreground">Controle de Entrada</p>
            </div>
          </div>

          {/* Tabs - Desktop */}
          <nav className="hidden md:flex items-center gap-2">
            {isAdmin && (
              <Button
                variant={activeTab === 'criar' ? 'default' : 'ghost'}
                onClick={() => onTabChange('criar')}
                size="sm"
              >
                Criar Ingresso
              </Button>
            )}
            <Button
              variant={activeTab === 'validar' ? 'default' : 'ghost'}
              onClick={() => onTabChange('validar')}
              size="sm"
            >
              Validar Ingresso
            </Button>
          </nav>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{user.usuario}</span>
              <Badge variant={isAdmin ? 'default' : 'secondary'} className="text-xs">
                {isAdmin ? 'Admin' : 'Segurança'}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} title="Sair">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs - Mobile */}
        <nav className="flex md:hidden items-center gap-2 mt-4">
          {isAdmin && (
            <Button
              variant={activeTab === 'criar' ? 'default' : 'ghost'}
              onClick={() => onTabChange('criar')}
              size="sm"
              className="flex-1"
            >
              Criar Ingresso
            </Button>
          )}
          <Button
            variant={activeTab === 'validar' ? 'default' : 'ghost'}
            onClick={() => onTabChange('validar')}
            size="sm"
            className="flex-1"
          >
            Validar Ingresso
          </Button>
        </nav>
      </div>
    </header>
  );
}
