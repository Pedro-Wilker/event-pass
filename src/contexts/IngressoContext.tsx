import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  fetchConvidados,
  criarConvidado,
  atualizarConvidado,
  registrarEntrada,
  buscarConvidadoPorCodigo,
  type ApiGuest,
  type CreateGuestInput,
} from '@/lib/api';
import { gerarCompanionQRCodes } from '@/lib/qr';
import { useAuth } from './AuthContext';

export interface Ingresso {
  id: string;
  nome_convidado: string;
  qr_code: string;
  entrada_registrada: boolean;
  data_criacao: string;
  data_entrada: string | null;
  usuario_validador: string | null;
  criado_por: string | null;
}

export type ValidacaoStatus = 'valido' | 'duplicado' | 'invalido';

export interface ResultadoValidacao {
  status: ValidacaoStatus;
  ingresso?: Ingresso;
  mensagem: string;
  companion?: { name: string; index: number };
}

interface IngressoContextType {
  ingressos: Ingresso[];
  criarIngresso: (nomeConvidado: string, acompanhantes?: string[]) => Promise<Ingresso | null>;
  validarIngresso: (codigo: string) => Promise<ResultadoValidacao>;
  buscarIngresso: (codigo: string) => Promise<Ingresso | null>;
  refreshIngressos: () => Promise<void>;
}

const IngressoContext = createContext<IngressoContextType | undefined>(undefined);

function guestToIngresso(guest: ApiGuest): Ingresso {
  return {
    id: String(guest.ID),
    nome_convidado: guest.nome,
    qr_code: guest.qr_code,
    entrada_registrada: guest.entrada_registrada,
    data_criacao: guest.CreatedAt,
    data_entrada: guest.data_entrada,
    usuario_validador: guest.usuario_validador !== null ? String(guest.usuario_validador) : null,
    criado_por: guest.user_id !== null ? String(guest.user_id) : null,
  };
}

export function IngressoProvider({ children }: { children: ReactNode }) {
  const [ingressos, setIngressos] = useState<Ingresso[]>([]);
  const { user } = useAuth();

  const refreshIngressos = async () => {
    try {
      const guests = await fetchConvidados();
      setIngressos(guests.map(guestToIngresso));
    } catch (err) {
      console.error('[IngressoContext] Erro ao buscar convidados:', err);
    }
  };

  useEffect(() => {
    if (user) refreshIngressos();
  }, [user]);

  const criarIngresso = async (nomeConvidado: string, acompanhantes?: string[]): Promise<Ingresso | null> => {
    if (!user || user.tipo !== 'admin') {
      throw new Error('Apenas administradores podem criar ingressos.');
    }

    // cria o titular primeiro (sem qr, backend gera via uuid.NewString())
    const titularInput: CreateGuestInput = { nome: nomeConvidado };
    const titular = await criarConvidado(titularInput);
    const titularIngresso = guestToIngresso(titular);

    // titular criado: agora gera qr_code único pra cada acompanhante
    // usando o qr_code recém-retornado (mantém formato UUID; FNV-1a
    // substitui só o 1º segmento). Esses códigos já vão como array
    // numa 2ª chamada de criação? NÃO — backend atual não suporta
    // criar titular + acompanhantes no mesmo POST. Workaround:
    // o titular já veio com qr_code; backend só persiste os códigos
    // sintéticos SE vierem no mesmo input. Como aqui o titular já foi
    // criado, precisamos ATUALIZÁ-lo via PUT/convidados/:id com os
    // companion_qr_codes gerados a partir do qr_code dele.
    const nomesAcomp = (acompanhantes ?? []).filter((n) => n.trim().length > 0);
    if (nomesAcomp.length > 0) {
      const companionCodes = gerarCompanionQRCodes(titularIngresso.qr_code, nomesAcomp);
      await atualizarConvidado(titular.ID, {
        nome: titularIngresso.nome_convidado,
        quantidade_acompanhante: nomesAcomp.length,
        nome_acompanhante: nomesAcomp,
        companion_qr_codes: companionCodes,
      });
    }

    await refreshIngressos();
    return titularIngresso;
  };

  const validarIngresso = async (codigo: string): Promise<ResultadoValidacao> => {
    const resultado = await registrarEntrada(codigo);

    if (resultado.status === 'invalido') {
      return {
        status: 'invalido',
        mensagem: resultado.mensagem || 'Ingresso não encontrado no sistema.',
      };
    }

    await refreshIngressos();

    return {
      status: resultado.status,
      ingresso: resultado.data ? guestToIngresso(resultado.data) : undefined,
      mensagem: resultado.mensagem,
      companion: resultado.companion,
    };
  };

  const buscarIngresso = async (codigo: string): Promise<Ingresso | null> => {
    try {
      const guest = await buscarConvidadoPorCodigo(codigo);
      return guestToIngresso(guest);
    } catch {
      return null;
    }
  };

  return (
    <IngressoContext.Provider
      value={{ ingressos, criarIngresso, validarIngresso, buscarIngresso, refreshIngressos }}
    >
      {children}
    </IngressoContext.Provider>
  );
}

export function useIngressos() {
  const context = useContext(IngressoContext);
  if (context === undefined) {
    throw new Error('useIngressos must be used within an IngressoProvider');
  }
  return context;
}