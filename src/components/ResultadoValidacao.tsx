import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, User, Clock } from 'lucide-react';
import type { ResultadoValidacao as ResultadoType } from '@/contexts/IngressoContext';

interface ResultadoValidacaoProps {
  resultado: ResultadoType;
  onNovo: () => void;
}

export function ResultadoValidacao({ resultado, onNovo }: ResultadoValidacaoProps) {
  const { status, ingresso, mensagem } = resultado;

  const config = {
    valido: {
      icon: CheckCircle,
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      iconColor: 'text-green-500',
      title: 'Entrada Autorizada',
    },
    duplicado: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      iconColor: 'text-yellow-500',
      title: 'Entrada Duplicada',
    },
    invalido: {
      icon: XCircle,
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      iconColor: 'text-red-500',
      title: 'Ingresso Inválido',
    },
  };

  const { icon: Icon, bgColor, borderColor, iconColor, title } = config[status];

  return (
    <Card className={`w-full max-w-md mx-auto border-2 ${borderColor} ${bgColor} backdrop-blur-sm overflow-hidden`}>
      <CardContent className="p-8 text-center space-y-6">
        <div className={`w-20 h-20 mx-auto rounded-full ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-10 h-10 ${iconColor}`} />
        </div>

        <div>
          <h2 className={`text-2xl font-bold ${iconColor}`}>{title}</h2>
          <p className="text-muted-foreground mt-2">{mensagem}</p>
        </div>

        {ingresso && (
          <div className="space-y-3 text-left bg-background/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Convidado:</span>
              <span className="font-medium">{ingresso.nome_convidado}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Criado em:</span>
              <span className="font-medium">
                {new Date(ingresso.data_criacao).toLocaleString('pt-BR')}
              </span>
            </div>

            {ingresso.data_entrada && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Entrada em:</span>
                <span className="font-medium">
                  {new Date(ingresso.data_entrada).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
          </div>
        )}

        <Button onClick={onNovo} className="w-full" size="lg">
          Validar Próximo Ingresso
        </Button>
      </CardContent>
    </Card>
  );
}
