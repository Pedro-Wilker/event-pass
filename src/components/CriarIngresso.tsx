import React, { useState } from 'react';
import { useIngressos, Ingresso } from '@/contexts/IngressoContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IngressoCard } from '@/components/IngressoCard';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CriarIngresso() {
  const [nomeConvidado, setNomeConvidado] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ingressoCriado, setIngressoCriado] = useState<Ingresso | null>(null);
  const { criarIngresso } = useIngressos();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nomeConvidado.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Digite o nome do convidado.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const ingresso = await criarIngresso(nomeConvidado.trim());
      if (ingresso) {
        setIngressoCriado(ingresso);
        setNomeConvidado('');
        toast({
          title: 'Ingresso criado!',
          description: `Ingresso para ${ingresso.nome_convidado} gerado com sucesso.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o ingresso.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNovo = () => {
    setIngressoCriado(null);
  };

  if (ingressoCriado) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <IngressoCard ingresso={ingressoCriado} onNovo={handleNovo} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-primary" />
            Criar Novo Ingresso
          </CardTitle>
          <CardDescription>
            Preencha os dados para gerar um novo ingresso com QR Code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Convidado</Label>
              <Input
                id="nome"
                type="text"
                value={nomeConvidado}
                onChange={(e) => setNomeConvidado(e.target.value)}
                placeholder="Digite o nome completo"
                required
                disabled={isLoading}
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Gerar Ingresso
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}