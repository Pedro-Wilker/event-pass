import React, { useRef, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2, AlertCircle } from 'lucide-react';
import type { Ingresso } from '@/contexts/IngressoContext';
import { jsPDF } from 'jspdf';

interface IngressoPersonalizadoProps {
  ingresso: Ingresso;
}

export function IngressoPersonalizado({ ingresso }: IngressoPersonalizadoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateTicket = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsGenerating(true);
    setError(null);

    try {
      await document.fonts.load('48px GriffoClassico');

      const baseImage = new Image();
      baseImage.src = '/MOCK.png';

      await new Promise((resolve, reject) => {
        baseImage.onload = resolve;
        baseImage.onerror = () => reject(new Error('Erro ao carregar a imagem de fundo (/MOCK.png) na pasta public'));
      });

      canvas.width = baseImage.width;
      canvas.height = baseImage.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(baseImage, 0, 0);

      const centerX = canvas.width / 2;

      // Área branca do mock (janela do selo) começa em ~Y=390 e termina em ~Y=1060.
      // Nome, ID e QR são encadeados a partir de Y=450, dentro dessa janela.

      // 1. Nome — início da área branca com margem de ~60px
      const fontSizeNome = 48;
      ctx.fillStyle = '#5d3f04';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = `normal normal normal ${fontSizeNome}px GriffoClassico`;
      // @ts-ignore
      ctx.fontVariant = 'small-caps';
      const nomeY = 450;
      ctx.fillText(ingresso.nome_convidado, centerX, nomeY, 419);

      // 2. ID — 20px abaixo do nome
      const fontSizeId = 28;
      ctx.font = `normal normal normal ${fontSizeId}px GriffoClassico`;
      // @ts-ignore
      ctx.fontVariant = 'small-caps';
      const idY = nomeY + fontSizeNome + 20;
      ctx.fillText(`ID: ${ingresso.qr_code.split('-')[0]}`, centerX, idY);

      // 3. QR Code — 30px abaixo do ID, centralizado horizontalmente
      const qrSize = 377;
      const qrY = idY + fontSizeId + 30;
      const qrX = centerX - (qrSize / 2);

      const svgElement = document.getElementById(`qr-hidden-${ingresso.id}`) as unknown as SVGSVGElement;
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const qrImg = new Image();
        qrImg.src = url;

        await new Promise((resolve) => {
          qrImg.onload = () => {
            ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
            URL.revokeObjectURL(url);
            resolve(true);
          };
        });
      }

      setIsGenerating(false);
    } catch (err: any) {
      console.error('[IngressoPersonalizado] Erro:', err);
      setError(err.message);
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateTicket();
  }, [ingresso]);

  const handleDownloadPDF = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imgData = canvas.toDataURL('image/png');
    const width = canvas.width * 0.264583;
    const height = canvas.height * 0.264583;

    const pdf = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [width, height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save(`Ingresso_${ingresso.nome_convidado}.pdf`);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="hidden">
        <QRCodeSVG
          id={`qr-hidden-${ingresso.id}`}
          value={ingresso.qr_code}
          size={377}
          level="H"
          fgColor="#322305"
          includeMargin={false}
        />
      </div>

      <div className="relative border rounded-xl overflow-hidden bg-muted w-full max-w-[400px] shadow-inner">
        {isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Gerando visualização...</p>
          </div>
        )}

        {error ? (
          <div className="p-8 text-center flex flex-col items-center gap-3">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="text-destructive text-sm font-medium">{error}</p>
            <Button variant="outline" size="sm" onClick={generateTicket}>
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <div className="overflow-auto max-h-[500px] bg-white">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto block mx-auto"
              style={{ display: isGenerating ? 'none' : 'block' }}
            />
          </div>
        )}
      </div>

      {!isGenerating && !error && (
        <Button onClick={handleDownloadPDF} className="w-full shadow-lg">
          <FileDown className="w-4 h-4 mr-2" />
          Baixar Ingresso (PDF)
        </Button>
      )}
    </div>
  );
}