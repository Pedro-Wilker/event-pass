const API_BASE_URL = 'https://api-eventos.artonbyte.com.br';

const TOKEN_STORAGE_KEY = 'api_eventos_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export class ApiError extends Error {
  status: number;
  payload: any;

  constructor(status: number, message: string, payload?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.error || data?.mensagem || 'Erro inesperado na API.';
    throw new ApiError(response.status, message, data);
  }

  return data as T;
}

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
export interface ApiGuest {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  nome: string;
  user_id: number;
  quantidade_acompanhante: number;
  nome_acompanhante: string[] | null;
  emails_acompanhantes: string[] | null;
  numeros_acompanhantes: string[] | null;
  relacoes_acompanhante: string[] | null;
  email_convidado: string;
  numero_convidado: string;
  qr_code: string;
  entrada_registrada: boolean;
  data_entrada: string | null;
  usuario_validador: number | null;
}

export interface CreateGuestInput {
  nome: string;
  quantidade_acompanhante?: number;
  nome_acompanhante?: string[];
  email_convidado?: string;
  numero_convidado?: string;
  emails_acompanhantes?: string[];
  numeros_acompanhantes?: string[];
  relacoes_acompanhante?: string[];
}

export interface CheckinResponse {
  status: 'valido' | 'duplicado' | 'invalido';
  mensagem: string;
  data?: ApiGuest;
}

export type UserRole = 'client' | 'admin';

// Tipos da rota /api/convidados/por-cliente
export interface GuestResumido {
  ID: number;
  nome: string;
  qr_code: string;
  entrada_registrada: boolean;
  data_entrada: string | null;
  quantidade_acompanhante: number;
  nome_acompanhante: string[] | null;
  relacoes_acompanhante: string[] | null; // ← agora sempre presente
}

export interface ClienteComConvidados {
  user_id: number;
  user_name: string;
  total: number;
  convidados: GuestResumido[];
}

export interface RespostaAdmin {
  total_clientes: number;
  total_convidados: number;
  clientes: ClienteComConvidados[];
}

export interface RespostaClient {
  user_id: number;
  user_name: string;
  total: number;
  convidados: GuestResumido[];
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export async function login(email: string, password: string): Promise<{ token: string }> {
  return request('/api/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<{ message: string }> {
  return request('/api/register', {
    method: 'POST',
    body: input,
    auth: false,
  });
}

export async function me(): Promise<{ message: string; user_id: number; role: UserRole }> {
  return request('/api/me');
}

// ---------------------------------------------------------------------------
// Convidados
// ---------------------------------------------------------------------------
export async function fetchConvidados(): Promise<ApiGuest[]> {
  const res = await request<{ data: ApiGuest[] }>('/api/convidados');
  return res.data;
}

export async function criarConvidado(input: CreateGuestInput): Promise<ApiGuest> {
  const res = await request<{ message: string; data: ApiGuest }>('/api/convidados', {
    method: 'POST',
    body: input,
  });
  return res.data;
}

export async function atualizarConvidado(
  id: number,
  input: Partial<CreateGuestInput>
): Promise<ApiGuest> {
  const res = await request<{ message: string; data: ApiGuest }>(`/api/convidados/${id}`, {
    method: 'PUT',
    body: input,
  });
  return res.data;
}

export async function deletarConvidado(id: number): Promise<void> {
  await request(`/api/convidados/${id}`, { method: 'DELETE' });
}

export async function buscarConvidadoPorCodigo(codigo: string): Promise<ApiGuest> {
  const res = await request<{ data: ApiGuest }>(`/api/convidados/buscar/${codigo}`);
  return res.data;
}

export async function registrarEntrada(codigo: string): Promise<CheckinResponse> {
  try {
    return await request<CheckinResponse>('/api/convidados/checkin', {
      method: 'POST',
      body: { codigo },
    });
  } catch (err) {
    if (err instanceof ApiError && (err.status === 409 || err.status === 404)) {
      return {
        status: err.status === 409 ? 'duplicado' : 'invalido',
        mensagem: err.message,
        data: err.payload?.data,
      };
    }
    throw err;
  }
}

export async function fetchConvidadosPorCliente(): Promise<RespostaAdmin | RespostaClient> {
  return request<RespostaAdmin | RespostaClient>('/api/convidados/por-cliente');
}