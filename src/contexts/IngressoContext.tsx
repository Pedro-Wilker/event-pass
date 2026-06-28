import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  fetchConvidados,
  criarConvidado,
  registrarEntrada,
  buscarConvidadoPorCodigo,
  type ApiGuest,
  type CreateGuestInput,
} from '@/lib/api';
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
}

interface IngressoContextType {
  ingressos: Ingresso[];
  criarIngresso: (nomeConvidado: string) => Promise<Ingresso | null>;
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

  const criarIngresso = async (nomeConvidado: string): Promise<Ingresso | null> => {
    if (!user || user.tipo !== 'admin') {
      throw new Error('Apenas administradores podem criar ingressos.');
    }

    const input: CreateGuestInput = { nome: nomeConvidado };
    const guest = await criarConvidado(input);

    await refreshIngressos();
    return guestToIngresso(guest);
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