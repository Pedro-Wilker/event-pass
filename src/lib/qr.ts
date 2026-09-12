// Geração determinística de qr_codes únicos por acompanhante.
//
// Cada ingresso é de uso único e exclusivo (após validar 1 vez, não pode
// mais ser reutilizado). Acompanhantes não podem compartilhar o qr_code
// do titular nem entre si — então derivamos um novo id via hash FNV-1a
// de (qrCodeTitular + nomeAcomp), preservando o formato UUID canônico
// (8-4-4-4-12) e mantendo idempotência (re-gerar PDF produz mesmo QR).

// FNV-1a 32-bit → 8 hex chars.
export function fnv1a32(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// Gera qr_code único por acompanhante mantendo formato UUID do titular.
// Substitui só o 1º segmento (8 chars — o "id" visível) pelo hash.
export function gerarQrUnicoAcompanhante(qrCodeTitular: string, nomeAcomp: string): string {
  const partes = qrCodeTitular.split('-');
  if (partes.length !== 5) return qrCodeTitular; // fallback seguro
  const novoId = fnv1a32(`${qrCodeTitular}|${nomeAcomp}`);
  return [novoId, partes[1], partes[2], partes[3], partes[4]].join('-');
}

// Helper para gerar array de companion_qr_codes a partir dos nomes.
// Hash canonico sobre o nome COMO SALVO no banco (whitespace preservado).
// PDFs antigos foram gerados sem .trim() antes do FNV-1a — nao trima aqui
// senao novos QRs deixam de bater com QRs antigos ja emitidos.
export function gerarCompanionQRCodes(qrCodeTitular: string, nomesAcompanhantes: string[]): string[] {
  return nomesAcompanhantes
    .filter((n) => n.trim().length > 0)
    .map((n) => gerarQrUnicoAcompanhante(qrCodeTitular, n));
}
