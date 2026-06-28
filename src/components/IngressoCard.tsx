import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, Calendar, CheckCircle, XCircle } from 'lucide-react';
import type { Ingresso } from '@/contexts/IngressoContext';
import { IngressoPersonalizado } from './IngressoPersonalizado';

interface IngressoCardProps {
  ingresso: Ingresso;
  showActions?: boolean;
  onNovo?: () => void;
}

export function IngressoCard({ ingresso, showActions = true, onNovo }: IngressoCardProps) {
  return (
    <Card className="w-full max-w-sm mx-auto border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="text-center bg-primary/5 border-b border-border/50 pb-4">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Ticket className="w-5 h-5" />
          <span className="font-semibold tracking-wide">INGRESSO GERADO</span>
        </div>
      </CardHeader>
      <CardContent className="p-6 text-center space-y-6">
        <IngressoPersonalizado ingresso={ingresso} />

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Criado em: {new Date(ingresso.data_criacao).toLocaleDateString('pt-BR')}</span>
          </div>

          <Badge
            variant={ingresso.entrada_registrada ? 'secondary' : 'default'}
            className="gap-1"
          >
            {ingresso.entrada_registrada ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Utilizado
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" />
                Não utilizado
              </>
            )}
          </Badge>
        </div>

        {showActions && onNovo && (
          <Button onClick={onNovo} variant="outline" className="w-full">
            Criar Outro Ingresso
          </Button>
        )}
      </CardContent>
    </Card>
  );
}