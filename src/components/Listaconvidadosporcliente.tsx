import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchConvidadosPorCliente, type RespostaAdmin, type RespostaClient, type GuestResumido, type ClienteComConvidados } from '@/lib/api';
import { useIngressos, type Ingresso } from '@/contexts/IngressoContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { IngressoPersonalizado } from './IngressoPersonalizado';
import {
  Search,
  Users,
  ChevronDown,
  ChevronRight,
  QrCode,
  CheckCircle2,
  Clock,
  UserRound,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

// Converte GuestResumido para o tipo Ingresso que IngressoPersonalizado espera
function guestToIngresso(g: GuestResumido): Ingresso {
  return {
    id: String(g.ID),
    nome_convidado: g.nome,
    qr_code: g.qr_code,
    entrada_registrada: g.entrada_registrada,
    data_criacao: '',
    data_entrada: g.data_entrada,
    usuario_validador: null,
    criado_por: null,
  };
}

// ──────────────────────────────────────────────
// Sub-componente: card de um convidado individual
// ──────────────────────────────────────────────
function ConvidadoItem({
  convidado,
  onVerQR,
}: {
  convidado: GuestResumido;
  onVerQR: (c: GuestResumido) => void;
}) {
  const nomes: string[] = Array.isArray(convidado.nome_acompanhante)
    ? convidado.nome_acompanhante
    : [];
  const relacoes: string[] = Array.isArray(convidado.relacoes_acompanhante)
    ? convidado.relacoes_acompanhante
    : [];

  const temAcompanhantes = nomes.length > 0;
  const [aberto, setAberto] = useState(false);

  return (
    <div className="rounded-lg border border-border/40 bg-background/50 overflow-hidden">
      {/* Linha principal do convidado */}
      <div className="flex items-center justify-between p-3">
        <div className="flex flex-col flex-1 min-w-0 mr-2">
          <div className="flex items-center gap-2">
            <UserRound className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="font-medium text-sm truncate">{convidado.nome}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 ml-6">
            <Badge
              variant={convidado.entrada_registrada ? 'secondary' : 'outline'}
              className="text-[10px] h-5"
            >
              {convidado.entrada_registrada ? 'Presente' : 'Pendente'}
            </Badge>
            {convidado.data_entrada && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(convidado.data_entrada).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
            {temAcompanhantes && (
              <span className="text-[10px] text-muted-foreground">
                +{nomes.length} acomp.
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
            onClick={() => onVerQR(convidado)}
            title="Ver Ingresso / QR Code"
          >
            <QrCode className="w-4 h-4" />
          </Button>

          {temAcompanhantes && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground"
              onClick={() => setAberto((v) => !v)}
              title={aberto ? 'Ocultar acompanhantes' : 'Ver acompanhantes'}
            >
              {aberto ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          )}

          {!temAcompanhantes && convidado.entrada_registrada && (
            <CheckCircle2 className="w-5 h-5 text-green-500/50 mx-1.5" />
          )}
        </div>
      </div>

      {/* Sub-lista de acompanhantes */}
      {temAcompanhantes && aberto && (
        <div className="border-t border-border/30 bg-muted/20 px-3 py-2 space-y-1.5">
          {nomes.map((nome, i) => (
            <div
              key={i}
              className="flex items-center gap-2 pl-4 text-sm text-muted-foreground"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-border shrink-0" />
              <span className="truncate">{nome}</span>
              {relacoes[i] && (
                <Badge variant="outline" className="text-[10px] h-4 ml-auto shrink-0">
                  {relacoes[i]}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Sub-componente: grupo de um cliente (admin view)
// ──────────────────────────────────────────────
function ClienteGroup({
  cliente,
  busca,
  onVerQR,
}: {
  cliente: ClienteComConvidados;
  busca: string;
  onVerQR: (c: GuestResumido) => void;
}) {
  const [aberto, setAberto] = useState(true);

  const filtrados = cliente.convidados.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );

  if (busca && filtrados.length === 0) return null;

  const presentes = cliente.convidados.filter((c) => c.entrada_registrada).length;

  return (
    <Collapsible open={aberto} onOpenChange={setAberto}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors">
          <div className="flex items-center gap-2">
            {aberto ? (
              <ChevronDown className="w-4 h-4 text-primary" />
            ) : (
              <ChevronRight className="w-4 h-4 text-primary" />
            )}
            <Users className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">{cliente.user_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {presentes}/{cliente.total} presentes
            </Badge>
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 ml-4 space-y-2">
          {filtrados.map((convidado) => (
            <ConvidadoItem
              key={convidado.ID}
              convidado={convidado}
              onVerQR={onVerQR}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ──────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────
export function ListaConvidadosPorCliente() {
  const { user } = useAuth();
  const isAdmin = user?.tipo === 'admin';

  const [dados, setDados] = useState<RespostaAdmin | RespostaClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [verQR, setVerQR] = useState<GuestResumido | null>(null);

  const carregar = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchConvidadosPorCliente();
      setDados(res);
    } catch {
      setError('Não foi possível carregar os convidados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  // ── Render: loading ──
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm">Carregando convidados...</p>
      </div>
    );
  }

  // ── Render: erro ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-destructive">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={carregar}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!dados) return null;

  // ──────────────────────────────────────────
  // View ADMIN — lista agrupada por cliente
  // ──────────────────────────────────────────
  if (isAdmin && 'clientes' in dados) {
    const { clientes, total_clientes, total_convidados } = dados;

    return (
      <div className="space-y-4">
        {/* Cabeçalho com totais */}
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <Badge variant="outline">{total_clientes} clientes</Badge>
            <Badge variant="outline">{total_convidados} convidados</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={carregar}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar convidado por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista por cliente */}
        <ScrollArea className="h-[500px] rounded-md border border-border/50 bg-card/50 p-4">
          <div className="space-y-4">
            {clientes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum convidado cadastrado.
              </div>
            ) : (
              clientes.map((cliente) => (
                <ClienteGroup
                  key={cliente.user_id}
                  cliente={cliente}
                  busca={busca}
                  onVerQR={setVerQR}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {/* Modal QR */}
        <Dialog open={!!verQR} onOpenChange={(open) => !open && setVerQR(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Ingresso do Convidado</DialogTitle>
              <DialogDescription>{verQR?.nome}</DialogDescription>
            </DialogHeader>
            {verQR && (
              <div className="flex flex-col items-center justify-center py-2">
                <IngressoPersonalizado ingresso={guestToIngresso(verQR)} />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ──────────────────────────────────────────
  // View CLIENT — lista plana dos próprios convidados
  // ──────────────────────────────────────────
  const dadosClient = dados as RespostaClient;
  const filtrados = dadosClient.convidados?.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-4">
      {/* Cabeçalho com totais */}
      <div className="flex items-center justify-between">
        <Badge variant="outline">{dadosClient.total} convidados</Badge>
        <Button variant="ghost" size="sm" onClick={carregar}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar convidado por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista plana */}
      <ScrollArea className="h-[500px] rounded-md border border-border/50 bg-card/50 p-4">
        <div className="space-y-2">
          {filtrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {busca ? 'Nenhum convidado encontrado.' : 'Você ainda não tem convidados cadastrados.'}
            </div>
          ) : (
            filtrados.map((convidado) => (
              <ConvidadoItem
                key={convidado.ID}
                convidado={convidado}
                onVerQR={setVerQR}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Modal QR */}
      <Dialog open={!!verQR} onOpenChange={(open) => !open && setVerQR(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ingresso do Convidado</DialogTitle>
            <DialogDescription>{verQR?.nome}</DialogDescription>
          </DialogHeader>
          {verQR && (
            <div className="flex flex-col items-center justify-center py-2">
              <IngressoPersonalizado ingresso={guestToIngresso(verQR)} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}