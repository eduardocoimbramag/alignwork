import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Building, MapPin, Home, FileText, Check, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { useConsultorioMutations } from '@/hooks/useConsultorioMutations';
import { buscarEstados, buscarCidadesPorEstado } from '@/services/ibgeApi';
import { buscarEnderecoPorCep } from '@/services/viaCepApi';
import type { Consultorio, ConsultorioFormData } from '@/types/consultorio';

interface ConsultorioFormContentProps {
  onVoltar: () => void;
  consultorio?: Consultorio | null;
}

// Schema de validação Zod
const consultorioSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  estado: z.string().min(2, 'Selecione um estado'),
  cidade: z.string().min(3, 'Selecione uma cidade'),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  rua: z.string().min(3, 'Rua é obrigatória'),
  numero: z.string().min(1, 'Número é obrigatório'),
  bairro: z.string().min(2, 'Bairro é obrigatório'),
  informacoes_adicionais: z.string().optional()
});

export const ConsultorioFormContent = ({ onVoltar, consultorio }: ConsultorioFormContentProps) => {
  const isEditMode = !!consultorio;
  const { toast } = useToast();
  const { createConsultorio, updateConsultorio, isCreating, isUpdating } = useConsultorioMutations();
  
  const [selectedEstado, setSelectedEstado] = useState<string>(consultorio?.estado || '');
  const [cepValue, setCepValue] = useState<string>(consultorio?.cep || '');
  const debouncedCep = useDebounce(cepValue, 500);

  // Form setup
  const form = useForm<ConsultorioFormData>({
    resolver: zodResolver(consultorioSchema),
    defaultValues: consultorio || {
      nome: '',
      estado: '',
      cidade: '',
      cep: '',
      rua: '',
      numero: '',
      bairro: '',
      informacoes_adicionais: ''
    }
  });

  // Query: Estados
  const { data: estados } = useQuery({
    queryKey: ['estados'],
    queryFn: buscarEstados,
    staleTime: Infinity,
  });

  // Query: Cidades
  const { data: cidades, isLoading: loadingCidades } = useQuery({
    queryKey: ['cidades', selectedEstado],
    queryFn: () => buscarCidadesPorEstado(selectedEstado),
    enabled: !!selectedEstado && selectedEstado.length === 2,
    staleTime: 1000 * 60 * 60,
  });

  // Query: CEP
  const { data: enderecoData, isLoading: loadingCep, isError: cepError } = useQuery({
    queryKey: ['cep', debouncedCep],
    queryFn: () => buscarEnderecoPorCep(debouncedCep),
    enabled: !!debouncedCep && debouncedCep.replace(/\D/g, '').length === 8,
    retry: false,
  });

  // Efeito: Auto-preencher endereço quando CEP é encontrado
  useEffect(() => {
    if (enderecoData) {
      form.setValue('rua', enderecoData.logradouro);
      form.setValue('bairro', enderecoData.bairro);
      
      if (enderecoData.uf) {
        form.setValue('estado', enderecoData.uf);
        setSelectedEstado(enderecoData.uf);
      }
      if (enderecoData.localidade) {
        form.setValue('cidade', enderecoData.localidade);
      }

      toast({
        title: 'Endereço encontrado!',
        description: 'Os campos foram preenchidos automaticamente.',
      });
    }
  }, [enderecoData, form, toast]);

  // Efeito: Erro ao buscar CEP
  useEffect(() => {
    if (cepError) {
      toast({
        title: 'CEP não encontrado',
        description: 'Verifique o CEP digitado e tente novamente.',
        variant: 'destructive',
      });
    }
  }, [cepError, toast]);

  // Handler: Mudança de estado
  const handleEstadoChange = (sigla: string) => {
    setSelectedEstado(sigla);
    form.setValue('cidade', '');
  };

  // Handler: Mudança de CEP (com máscara)
  const handleCepChange = (value: string) => {
    const maskedValue = value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);
    
    setCepValue(maskedValue);
    form.setValue('cep', maskedValue);
  };

  // Handler: Submit do formulário
  const onSubmit = async (data: ConsultorioFormData) => {
    try {
      if (isEditMode && consultorio) {
        await updateConsultorio({ id: consultorio.id, data });
      } else {
        await createConsultorio(data);
      }
      onVoltar();
    } catch (error) {
      console.error('Erro ao salvar consultório:', error);
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onVoltar}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {isEditMode ? 'Editar Consultório' : 'Cadastrar Consultório'}
          </h2>
          <p className="text-muted-foreground">
            {isEditMode 
              ? 'Atualize as informações do local de atendimento' 
              : 'Preencha os dados do novo local de atendimento'}
          </p>
        </div>
      </div>

      {/* Formulário */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Card: Identificação */}
          <Card className="rounded-2xl bg-white border border-black/10 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-brand-purple" />
                Identificação
              </CardTitle>
              <CardDescription>
                Nome do consultório ou clínica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de identificação *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Consultório Centro, Clínica Boa Vista" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Card: Localização */}
          <Card className="rounded-2xl bg-white border border-black/10 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-purple" />
                Localização
              </CardTitle>
              <CardDescription>
                Estado e cidade do consultório
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Estado */}
              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleEstadoChange(value);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {estados?.map((estado) => (
                          <SelectItem key={estado.sigla} value={estado.sigla}>
                            {estado.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cidade */}
              <FormField
                control={form.control}
                name="cidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedEstado || loadingCidades}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            loadingCidades 
                              ? "Carregando cidades..." 
                              : "Selecione a cidade"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cidades?.map((cidade) => (
                          <SelectItem key={cidade.id} value={cidade.nome}>
                            {cidade.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {!selectedEstado && (
                      <FormDescription>
                        Selecione um estado primeiro
                      </FormDescription>
                    )}
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Card: Endereço */}
          <Card className="rounded-2xl bg-white border border-black/10 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-brand-purple" />
                Endereço Completo
              </CardTitle>
              <CardDescription>
                CEP, rua, número e bairro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* CEP */}
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="00000-000" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleCepChange(e.target.value);
                          }}
                        />
                        {loadingCep && (
                          <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      O endereço será preenchido automaticamente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rua */}
              <FormField
                control={form.control}
                name="rua"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rua *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da rua" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Grid: Número e Bairro */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Número */}
                <FormField
                  control={form.control}
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número *</FormLabel>
                      <FormControl>
                        <Input placeholder="123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bairro */}
                <FormField
                  control={form.control}
                  name="bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card: Informações Adicionais */}
          <Card className="rounded-2xl bg-white border border-black/10 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-purple" />
                Informações Adicionais
              </CardTitle>
              <CardDescription>
                Complemento, referências ou observações (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="informacoes_adicionais"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Ex: Próximo à farmácia, 2º andar, sala 205..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Máximo 500 caracteres
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex items-center justify-between">
            <Button 
              type="button"
              variant="outline" 
              onClick={onVoltar}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar cadastro
            </Button>

            <Button 
              type="submit"
              disabled={isSubmitting}
              className="bg-brand-purple hover:bg-brand-purple/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};


