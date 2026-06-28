import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, LogOut } from 'lucide-react';

export type ActiveTab = 'criar' | 'validar' | 'lista';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
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

          {/* Tabs — Desktop */}
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
              variant={activeTab === 'lista' ? 'default' : 'ghost'}
              onClick={() => onTabChange('lista')}
              size="sm"
            >
              Lista de Convidados
            </Button>
            <Button
              variant={activeTab === 'validar' ? 'default' : 'ghost'}
              onClick={() => onTabChange('validar')}
              size="sm"
            >
              Validar Ingresso
            </Button>
          </nav>

          {/* Role badge + logout */}
          <div className="flex items-center gap-3">
            <Badge variant={isAdmin ? 'default' : 'secondary'} className="hidden sm:flex text-xs">
              {isAdmin ? 'Admin' : 'Cliente'}
            </Badge>
            <Button variant="ghost" size="icon" onClick={logout} title="Sair">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs — Mobile */}
        <nav className="flex md:hidden items-center gap-2 mt-4">
          {isAdmin && (
            <Button
              variant={activeTab === 'criar' ? 'default' : 'ghost'}
              onClick={() => onTabChange('criar')}
              size="sm"
              className="flex-1"
            >
              Criar
            </Button>
          )}
          <Button
            variant={activeTab === 'lista' ? 'default' : 'ghost'}
            onClick={() => onTabChange('lista')}
            size="sm"
            className="flex-1"
          >
            Lista
          </Button>
          <Button
            variant={activeTab === 'validar' ? 'default' : 'ghost'}
            onClick={() => onTabChange('validar')}
            size="sm"
            className="flex-1"
          >
            Validar
          </Button>
        </nav>
      </div>
    </header>
  );
}