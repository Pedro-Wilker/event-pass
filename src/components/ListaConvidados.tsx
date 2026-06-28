import React, { useState } from 'react';
import { useIngressos, Ingresso } from '@/contexts/IngressoContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, UserCheck, CheckCircle2, Clock, User, QrCode } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IngressoPersonalizado } from './IngressoPersonalizado';

export function ListaConvidados() {
  const { ingressos, validarIngresso } = useIngressos();
  const { user } = useAuth();
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState<Ingresso | null>(null);
  const [verQRCode, setVerQRCode] = useState<Ingresso | null>(null);
  const [isConfirmando, setIsConfirmando] = useState(false);

  const isAdmin = user?.tipo === 'admin';

  const convidadosFiltrados = ingressos
    .filter(i => i.nome_convidado.toLowerCase().includes(busca.toLowerCase()))
    .sort((a, b) => a.nome_convidado.localeCompare(b.nome_convidado));

  const handleConfirmarEntrada = async () => {
    if (!selecionado) return;
    setIsConfirmando(true);
    try {
   
      await validarIngresso(selecionado.qr_code);
      setSelecionado(null);
    } finally {
      setIsConfirmando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar convidado por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      <ScrollArea className="h-[400px] rounded-md border border-border/50 bg-card/50 p-4">
        <div className="space-y-2">
          {convidadosFiltrados.length > 0 ? (
            convidadosFiltrados.map((ingresso) => (
              <div
                key={ingresso.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-background/50 hover:bg-accent/5 transition-colors"
              >
                <div className="flex flex-col flex-1 min-w-0 mr-2">
                  <span className="font-medium text-sm truncate">{ingresso.nome_convidado}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={ingresso.entrada_registrada ? "secondary" : "outline"} className="text-[10px] h-5">
                      {ingresso.entrada_registrada ? "Presente" : "Pendente"}
                    </Badge>
                    {ingresso.data_entrada && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ingresso.data_entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {isAdmin && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                      onClick={() => setVerQRCode(ingresso)}
                      title="Ver Ingresso / QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                  )}

                  {!ingresso.entrada_registrada ? (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                      onClick={() => setSelecionado(ingresso)}
                      title="Confirmar Entrada"
                    >
                      <UserCheck className="w-4 h-4" />
                    </Button>
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-green-500/50 mx-1.5" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum convidado encontrado.
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={!!selecionado} onOpenChange={(open) => !open && setSelecionado(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Presença</DialogTitle>
            <DialogDescription>
              Deseja registrar a entrada manual para este convidado?
            </DialogDescription>
          </DialogHeader>
          
          {selecionado && (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border/50">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg truncate">{selecionado.nome_convidado}</p>
                <p className="text-xs text-muted-foreground font-mono">ID: {selecionado.qr_code.split('-')[0]}...</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelecionado(null)} disabled={isConfirmando}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarEntrada} disabled={isConfirmando}>
              {isConfirmando ? "Registrando..." : "Confirmar Entrada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!verQRCode} onOpenChange={(open) => !open && setVerQRCode(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ingresso do Convidado</DialogTitle>
            <DialogDescription>
              {verQRCode?.nome_convidado}
            </DialogDescription>
          </DialogHeader>
          
          {verQRCode && (
            <div className="flex flex-col items-center justify-center py-2">
              <IngressoPersonalizado ingresso={verQRCode} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}