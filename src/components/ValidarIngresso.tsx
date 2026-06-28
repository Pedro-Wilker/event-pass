import React, { useState } from 'react';
import { useIngressos, ResultadoValidacao as ResultadoType } from '@/contexts/IngressoContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QRScanner } from '@/components/QRScanner';
import { ResultadoValidacao } from '@/components/ResultadoValidacao';
import { ListaConvidados } from '@/components/ListaConvidados';
import { Camera, Search, Loader2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ValidarIngresso() {
  const [codigoManual, setCodigoManual] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [resultado, setResultado] = useState<ResultadoType | null>(null);
  const { validarIngresso } = useIngressos();
  const { toast } = useToast();

  const handleValidar = async (codigo: string) => {
    if (!codigo.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Digite ou capture o código do ingresso.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setShowScanner(false);

    try {
      const result = await validarIngresso(codigo.trim());
      setResultado(result);
      setCodigoManual('');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao validar o ingresso.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleValidar(codigoManual);
  };

  const handleScanResult = (code: string) => {
    console.log("[ValidarIngresso] Código recebido do scanner:", code);
    setShowScanner(false);
    handleValidar(code);
  };

  const handleNovo = () => {
    setResultado(null);
  };

  if (resultado) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ResultadoValidacao resultado={resultado} onNovo={handleNovo} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      {showScanner && (
        <QRScanner 
          onScan={handleScanResult} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      <Tabs defaultValue="scanner" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="scanner" className="gap-2">
            <Camera className="w-4 h-4" /> Scanner
          </TabsTrigger>
          <TabsTrigger value="lista" className="gap-2">
            <Users className="w-4 h-4" /> Lista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scanner">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Validar Ingresso
              </CardTitle>
              <CardDescription>
                Escaneie o QR Code ou digite o código manualmente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button
                onClick={() => setShowScanner(true)}
                className="w-full h-24 text-lg flex flex-col gap-2"
                size="lg"
                disabled={isLoading}
              >
                <Camera className="w-8 h-8" />
                <span>Escanear QR Code</span>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código do Ingresso</Label>
                  <Input
                    id="codigo"
                    type="text"
                    value={codigoManual}
                    onChange={(e) => setCodigoManual(e.target.value)}
                    placeholder="Digite o código do ingresso"
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" variant="outline" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Validar Manualmente
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lista">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Lista de Convidados
              </CardTitle>
              <CardDescription>
                Busque pelo nome e confirme a entrada manualmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ListaConvidados />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}