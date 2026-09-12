import React, { useState } from 'react';
import { useIngressos, Ingresso } from '@/contexts/IngressoContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IngressoCard } from '@/components/IngressoCard';
import { PlusCircle, Loader2, Trash2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CriarIngresso() {
  const [nomeConvidado, setNomeConvidado] = useState('');
  const [acompanhantes, setAcompanhantes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ingressoCriado, setIngressoCriado] = useState<Ingresso | null>(null);
  const { criarIngresso } = useIngressos();
  const { toast } = useToast();

  const adicionarAcompanhante = () => {
    if (acompanhantes.length >= 10) {
      toast({
        title: 'Limite atingido',
        description: 'Máximo de 10 acompanhantes por convite.',
        variant: 'destructive',
      });
      return;
    }
    setAcompanhantes((prev) => [...prev, '']);
  };

  const removerAcompanhante = (idx: number) => {
    setAcompanhantes((prev) => prev.filter((_, i) => i !== idx));
  };

  const atualizarAcompanhante = (idx: number, value: string) => {
    setAcompanhantes((prev) => prev.map((n, i) => (i === idx ? value : n)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const titular = nomeConvidado.trim();
    if (!titular) {
      toast({
        title: 'Campo obrigatório',
        description: 'Digite o nome do convidado.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const nomesFiltrados = acompanhantes.map((n) => n.trim()).filter((n) => n.length > 0);
      const ingresso = await criarIngresso(titular, nomesFiltrados);
      if (ingresso) {
        setIngressoCriado(ingresso);
        setNomeConvidado('');
        setAcompanhantes([]);
        const total = nomesFiltrados.length;
        toast({
          title: 'Ingresso criado!',
          description:
            total > 0
              ? `Ingresso para ${ingresso.nome_convidado} + ${total} acompanhante${total > 1 ? 's' : ''} gerado.`
              : `Ingresso para ${ingresso.nome_convidado} gerado com sucesso.`,
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
            Cada ingresso (titular e cada acompanhante) ganha QR Code único e de uso único.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Convidado (titular)</Label>
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

            {acompanhantes.length > 0 && (
              <div className="space-y-3 border-t border-border/50 pt-4">
                <Label className="text-sm text-muted-foreground">Acompanhantes</Label>
                {acompanhantes.map((nome, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={nome}
                      onChange={(e) => atualizarAcompanhante(idx, e.target.value)}
                      placeholder={`Nome do acompanhante ${idx + 1}`}
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removerAcompanhante(idx)}
                      disabled={isLoading}
                      aria-label="Remover acompanhante"
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={adicionarAcompanhante}
              disabled={isLoading || acompanhantes.length >= 10}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar acompanhante
            </Button>

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
