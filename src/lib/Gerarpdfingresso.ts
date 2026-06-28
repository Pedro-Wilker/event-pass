import { jsPDF } from 'jspdf';
import type { Ingresso } from '@/contexts/IngressoContext';

/**
 * Gera o canvas com o ingresso personalizado e retorna como PNG base64.
 * Reutiliza a mesma lógica de IngressoPersonalizado.tsx
 */
async function gerarCanvasIngresso(ingresso: Ingresso): Promise<HTMLCanvasElement> {
  await document.fonts.load('54px GriffoClassico');

  const baseImage = new Image();
  baseImage.src = '/MOCK.jpeg';

  await new Promise<void>((resolve, reject) => {
    baseImage.onload = () => resolve();
    baseImage.onerror = () => reject(new Error('Erro ao carregar imagem de fundo'));
  });

  const canvas = document.createElement('canvas');
  canvas.width = baseImage.width;
  canvas.height = baseImage.height;

  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(baseImage, 0, 0);

  const centerX = canvas.width / 2;

  // Nome
  const fontSizeNome = 54;
  ctx.fillStyle = '#2a1800';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `normal normal normal ${fontSizeNome}px GriffoClassico`;
  const nomeY = 560;
  ctx.fillText(ingresso.nome_convidado, centerX, nomeY, 419);

  // ID
  const fontSizeId = 28;
  ctx.font = `normal normal normal ${fontSizeId}px GriffoClassico`;
  const idY = nomeY + fontSizeNome + 20;
  ctx.fillText(`ID: ${ingresso.qr_code.split('-')[0]}`, centerX, idY);

  // QR Code — busca o SVG já renderizado na DOM pelo IngressoPersonalizado
  // ou gera um temporário via qrcode-svg inline
  const qrSize = 377;
  const qrY = idY + fontSizeId + 30;
  const qrX = centerX - qrSize / 2;

  // Gera QR inline sem depender da DOM
  const QRCode = await import('qrcode');
  const qrDataUrl = await QRCode.toDataURL(ingresso.qr_code, {
    width: qrSize,
    margin: 0,
    color: { dark: '#322305', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });

  await new Promise<void>((resolve) => {
    const qrImg = new Image();
    qrImg.onload = () => {
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      resolve();
    };
    qrImg.src = qrDataUrl;
  });

  return canvas;
}

/**
 * Gera e faz download do PDF de um ingresso.
 * Retorna o blob para uso posterior (ex: anexar no WhatsApp).
 */
export async function gerarEBaixarPDF(ingresso: Ingresso): Promise<Blob> {
  const canvas = await gerarCanvasIngresso(ingresso);
  const imgData = canvas.toDataURL('image/png');
  const width = canvas.width * 0.264583;
  const height = canvas.height * 0.264583;

  const pdf = new jsPDF({
    orientation: width > height ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [width, height],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, width, height);

  const blob = pdf.output('blob');

  // Dispara o download automaticamente
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Ingresso_${ingresso.nome_convidado}.pdf`;
  a.click();
  URL.revokeObjectURL(url);

  return blob;
}