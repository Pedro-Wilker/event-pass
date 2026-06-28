import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, Camera, Loader2 } from 'lucide-react';
import { BrowserQRCodeReader, BrowserCodeReader, IScannerControls } from '@zxing/browser';

interface QRScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        readerRef.current = new BrowserQRCodeReader();

        const videoInputDevices = await BrowserCodeReader.listVideoInputDevices();

        if (videoInputDevices.length === 0) {
          setError('Nenhuma câmera encontrada.');
          setIsLoading(false);
          return;
        }

        const backCamera = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('traseira') ||
          device.label.toLowerCase().includes('environment')
        );
        
        const selectedDeviceId = backCamera?.deviceId || videoInputDevices[0].deviceId;

        if (videoRef.current && readerRef.current) {
          controlsRef.current = await readerRef.current.decodeFromVideoDevice(
            selectedDeviceId,
            videoRef.current,
            (result, err) => {
              if (result) {
                const code = result.getText();
                console.log("[QRScanner] QR Code detectado:", code);
                onScan(code);
              }
              if (err && err.name !== 'NotFoundException') {
                console.error("[QRScanner] Erro:", err);
              }
            }
          );
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('[QRScanner] Erro ao iniciar:', err);
        if (err?.name === 'NotAllowedError') {
          setError('Permissão da câmera negada. Por favor, permita o acesso à câmera.');
        } else if (err?.name === 'NotFoundError') {
          setError('Nenhuma câmera encontrada.');
        } else {
          setError('Não foi possível acessar a câmera.');
        }
        setIsLoading(false);
      }
    };

    startScanner();

    return () => {
      controlsRef.current?.stop();
    };
  }, [onScan]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm z-20">
        <div className="flex items-center gap-2 text-white">
          <Camera className="w-5 h-5 text-primary" />
          <span className="font-semibold">Scanner QR Code</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-30 p-8 text-center">
            <Camera className="w-16 h-16 text-white/40 mb-4" />
            <p className="text-white mb-6">{error}</p>
            <div className="flex gap-3">
              <Button onClick={handleRetry} variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Tentar Novamente
              </Button>
              <Button onClick={onClose} variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Voltar
              </Button>
            </div>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-30">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <p className="text-white">Iniciando câmera...</p>
              </div>
            )}
            
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-64">
                <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg" />
                <div className="absolute left-0 right-0 h-0.5 bg-primary/50 animate-pulse top-1/2" />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="p-6 bg-black/80 backdrop-blur-sm text-center z-20">
        <p className="text-white/80 text-sm">
          Aponte a câmera para o QR Code do ingresso
        </p>
      </div>
    </div>
  );
}