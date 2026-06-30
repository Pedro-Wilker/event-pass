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
import { gerarEBaixarPDF } from '../lib/Gerarpdfingresso';
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

// Ícone WhatsApp SVG inline
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ──────────────────────────────────────────────
// Helpers de conversão
// ──────────────────────────────────────────────
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

function acompanhanteToIngresso(nomeAcomp: string, titular: GuestResumido): Ingresso {
  return {
    id: `${String(titular.ID)}-acomp-${nomeAcomp}`,
    nome_convidado: nomeAcomp,
    qr_code: titular.qr_code,
    entrada_registrada: titular.entrada_registrada,
    data_criacao: '',
    data_entrada: titular.data_entrada,
    usuario_validador: null,
    criado_por: null,
  };
}

function formatarTelefoneWA(telefone: string): string {
  const digits = telefone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  return `55${digits}`;
}

// ──────────────────────────────────────────────
// Helpers de contagem (titular + acompanhantes)
// ──────────────────────────────────────────────
function contarPessoas(c: GuestResumido): number {
  const acomp = Array.isArray(c.nome_acompanhante)
    ? c.nome_acompanhante.length
    : c.quantidade_acompanhante ?? 0;
  return 1 + acomp;
}

function totalPessoas(convidados: GuestResumido[]): number {
  return convidados.reduce((acc, c) => acc + contarPessoas(c), 0);
}

function presentesPessoas(convidados: GuestResumido[]): number {
  return convidados.reduce(
    (acc, c) => acc + (c.entrada_registrada ? contarPessoas(c) : 0),
    0
  );
}

// ──────────────────────────────────────────────
// Hook: disparo WhatsApp com geração de PDFs
// ──────────────────────────────────────────────
function useEnviarWhatsApp() {
  const [enviando, setEnviando] = useState<number | null>(null);

  const enviar = async (convidado: GuestResumido) => {
    if (!convidado.numero_convidado) {
      alert('Este convidado não possui número de WhatsApp cadastrado.');
      return;
    }

    setEnviando(convidado.ID);

    try {
      const nomes: string[] = Array.isArray(convidado.nome_acompanhante)
        ? convidado.nome_acompanhante
        : [];

      // 1. Gera e baixa PDF do titular
      await gerarEBaixarPDF(guestToIngresso(convidado));

      // 2. Gera e baixa PDF de cada acompanhante com delay entre eles
      for (const nome of nomes) {
        await new Promise((r) => setTimeout(r, 400));
        await gerarEBaixarPDF(acompanhanteToIngresso(nome, convidado));
      }

      // 3. Monta mensagem
      const totalPessoasGrupo = 1 + nomes.length;
      const listaAcomp =
        nomes.length > 0
          ? `\n\nAcompanhantes:\n${nomes.map((n) => `• ${n}`).join('\n')}`
          : '';

      const mensagem = encodeURIComponent(
        `Olá, *${convidado.nome}*! 🎭\n\n` +
        `Segue(m) seu(s) ingresso(s) para o evento *Cabaré Asteria 70 Anos*.\n` +
        `Total de ingressos: *${totalPessoasGrupo}*${listaAcomp}\n\n` +
        `Os arquivos PDF foram baixados — anexe-os nesta conversa! 🎟️`
      );

      const telefone = formatarTelefoneWA(convidado.numero_convidado);
      window.open(`https://wa.me/${telefone}?text=${mensagem}`, '_blank');
    } catch (err) {
      console.error('Erro ao gerar ingresso:', err);
      alert('Erro ao gerar o ingresso. Tente novamente.');
    } finally {
      setEnviando(null);
    }
  };

  return { enviar, enviando };
}

// ──────────────────────────────────────────────
// Sub-componente: card de um convidado individual
// ──────────────────────────────────────────────
function ConvidadoItem({
  convidado,
  onVerQR,
  onEnviarWhatsApp,
  enviando,
}: {
  convidado: GuestResumido;
  onVerQR: (ingresso: Ingresso) => void;
  onEnviarWhatsApp: (convidado: GuestResumido) => void;
  enviando: boolean;
}) {
  const nomes: string[] = Array.isArray(convidado.nome_acompanhante)
    ? convidado.nome_acompanhante
    : [];
  const relacoes: string[] = Array.isArray(convidado.relacoes_acompanhante)
    ? convidado.relacoes_acompanhante
    : [];

  const temAcompanhantes = nomes.length > 0;
  const temTelefone = !!convidado.numero_convidado;
  const [aberto, setAberto] = useState(false);

  return (
    <div className="rounded-lg border border-border/40 bg-background/50 overflow-hidden">
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
                +{nomes.length} acomp. ({contarPessoas(convidado)} pessoas)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Botão WhatsApp */}
          <Button
            size="sm"
            variant="ghost"
            className={`h-8 w-8 p-0 shrink-0 ${
              temTelefone
                ? 'text-green-500 hover:text-green-600 hover:bg-green-500/10'
                : 'text-muted-foreground/30 cursor-not-allowed'
            }`}
            onClick={() => temTelefone && onEnviarWhatsApp(convidado)}
            disabled={enviando || !temTelefone}
            title={
              !temTelefone
                ? 'Sem número cadastrado'
                : enviando
                ? 'Gerando ingressos...'
                : `Enviar ingresso via WhatsApp${nomes.length > 0 ? ` (+${nomes.length} acomp.)` : ''}`
            }
          >
            {enviando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <WhatsAppIcon className="w-4 h-4" />
            )}
          </Button>

          {/* Botão QR do titular */}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
            onClick={() => onVerQR(guestToIngresso(convidado))}
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
                <Badge variant="outline" className="text-[10px] h-4 shrink-0">
                  {relacoes[i]}
                </Badge>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 ml-auto text-muted-foreground hover:text-primary shrink-0"
                onClick={() => onVerQR(acompanhanteToIngresso(nome, convidado))}
                title={`Ver ingresso de ${nome}`}
              >
                <QrCode className="w-3.5 h-3.5" />
              </Button>
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
  onEnviarWhatsApp,
  enviando,
}: {
  cliente: ClienteComConvidados;
  busca: string;
  onVerQR: (ingresso: Ingresso) => void;
  onEnviarWhatsApp: (convidado: GuestResumido) => void;
  enviando: number | null;
}) {
  const [aberto, setAberto] = useState(true);

  const filtrados = cliente.convidados.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );

  if (busca && filtrados.length === 0) return null;

  // Contagem por PESSOAS (titular + acompanhantes), não por linha de convidado
  const presentes = presentesPessoas(cliente.convidados);
  const total = totalPessoas(cliente.convidados);

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
          <Badge variant="outline" className="text-[10px]">
            {presentes}/{total} presentes
          </Badge>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 ml-4 space-y-2">
          {filtrados.map((convidado) => (
            <ConvidadoItem
              key={convidado.ID}
              convidado={convidado}
              onVerQR={onVerQR}
              onEnviarWhatsApp={onEnviarWhatsApp}
              enviando={enviando === convidado.ID}
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
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = user?.tipo === 'admin';

  const [dados, setDados] = useState<RespostaAdmin | RespostaClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [verQR, setVerQR] = useState<Ingresso | null>(null);

  const { enviar, enviando } = useEnviarWhatsApp();

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
    // Só busca os convidados depois que sabemos quem é o usuário (token validado)
    if (!authLoading && user) {
      carregar();
    }
  }, [authLoading, user]);

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm">Carregando convidados...</p>
      </div>
    );
  }

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

  const modalQR = (
    <Dialog open={!!verQR} onOpenChange={(open) => !open && setVerQR(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ingresso do Convidado</DialogTitle>
          <DialogDescription>{verQR?.nome_convidado}</DialogDescription>
        </DialogHeader>
        {verQR && (
          <div className="flex flex-col items-center justify-center py-2">
            <IngressoPersonalizado ingresso={verQR} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  // ── View ADMIN ──
  if (isAdmin && 'clientes' in dados) {
    // dados.clientes pode vir como null do backend quando não há nenhum
    // convidado cadastrado ainda — sem essa proteção o .reduce() abaixo
    // quebra durante o render e a tela fica em branco.
    const clientes = dados.clientes ?? [];
    const { total_clientes } = dados;

    // Total de PESSOAS real (titulares + acompanhantes) em todos os clientes
    const totalConvidadosReal = clientes.reduce(
      (acc, c) => acc + totalPessoas(c.convidados),
      0
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <Badge variant="outline">{total_clientes} clientes</Badge>
            <Badge variant="outline">{totalConvidadosReal} convidados</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={carregar}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar convidado por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>

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
                  onEnviarWhatsApp={enviar}
                  enviando={enviando}
                />
              ))
            )}
          </div>
        </ScrollArea>

        {modalQR}
      </div>
    );
  }

  // ── View CLIENT ──
  const dadosClient = dados as RespostaClient;
  const convidadosClient = dadosClient.convidados ?? [];
  const filtrados = convidadosClient.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );
  const totalClientReal = totalPessoas(convidadosClient);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline">{totalClientReal} convidados</Badge>
        <Button variant="ghost" size="sm" onClick={carregar}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar convidado por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

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
                onEnviarWhatsApp={enviar}
                enviando={enviando === convidado.ID}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {modalQR}
    </div>
  );
}