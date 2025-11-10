import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";
import { Check, ChevronsUpDown, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTenant } from "@/contexts/TenantContext";
import { useCreateAppointment } from "@/hooks/useAppointmentMutations";
import { dayjs } from "@/lib/dayjs";
import { useQuery } from "@tanstack/react-query";
import { fetchConsultoriosLight, type ConsultorioLight } from "@/services/api";
import { Building } from "lucide-react";

/**
 * MODAL DE NOVO AGENDAMENTO
 * 
 * Este modal permite criar novos agendamentos no sistema.
 * Inclui busca de clientes, seleção de data/hora e tipo de consulta.
 */

interface NovoAgendamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NovoAgendamentoModal = ({ isOpen, onClose }: NovoAgendamentoModalProps) => {
  const { clientes, buscarClientes, adicionarAgendamento } = useApp();
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { mutateAsync: createAppointment, isPending } = useCreateAppointment(tenantId);

  // Estados para o formulário
  const [formData, setFormData] = useState({
    clienteId: '',
    cliente: '',
    tipo: '' as 'Consulta' | 'Tratamento' | 'Retorno' | '',
    data: undefined as Date | undefined,
    horaInicio: '',
    duracao: 60,
    consultorioId: null as number | null
  });

  // Estados para controle de interface
  const [buscarCliente, setBuscarCliente] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<string>('');
  const [openCombobox, setOpenCombobox] = useState(false);
  const [openComboboxConsultorio, setOpenComboboxConsultorio] = useState(false);
  const [buscarConsultorio, setBuscarConsultorio] = useState('');
  const [openCalendar, setOpenCalendar] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  // Query para buscar consultórios
  const { data: consultorios = [], isLoading: isLoadingConsultorios } = useQuery({
    queryKey: ['consultorios', 'light', tenantId],
    queryFn: () => fetchConsultoriosLight(tenantId),
    enabled: !!tenantId && isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });

  // Filtrar clientes baseado na busca
  const clientesFiltrados = useMemo(() => {
    return buscarClientes(buscarCliente);
  }, [buscarCliente, buscarClientes]);

  // Filtrar consultórios baseado na busca
  const consultoriosFiltrados = useMemo(() => {
    if (!buscarConsultorio) return consultorios;
    const termo = buscarConsultorio.toLowerCase();
    return consultorios.filter(c => c.label.toLowerCase().includes(termo));
  }, [buscarConsultorio, consultorios]);

  // Limpar formulário
  const limparFormulario = () => {
    setFormData({
      clienteId: '',
      cliente: '',
      tipo: '' as any,
      data: undefined,
      horaInicio: '',
      duracao: 60,
      consultorioId: null
    });
    setBuscarCliente('');
    setClienteSelecionado('');
    setBuscarConsultorio('');
    setErros({});
  };

  // Validar formulário
  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {};

    if (!formData.clienteId) {
      novosErros.cliente = 'Selecione um cliente';
    }

    if (!formData.tipo) {
      novosErros.tipo = 'Selecione o tipo de consulta';
    }

    if (!formData.data) {
      novosErros.data = 'Selecione a data';
    }

    if (!formData.horaInicio) {
      novosErros.horaInicio = 'Informe o horário';
    } else {
      // Validar formato de hora
      const regexHora = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!regexHora.test(formData.horaInicio)) {
        novosErros.horaInicio = 'Formato inválido (HH:MM)';
      }
    }

    if (formData.duracao < 15 || formData.duracao > 480) {
      novosErros.duracao = 'Duração deve ser entre 15 e 480 minutos';
    }

    if (!formData.consultorioId) {
      novosErros.consultorio = 'Selecione um consultório';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Selecionar cliente
  const selecionarCliente = (cliente: any) => {
    setFormData(prev => ({
      ...prev,
      clienteId: cliente.id,
      cliente: cliente.nome
    }));
    setClienteSelecionado(cliente.nome);
    setBuscarCliente(cliente.nome);
    setOpenCombobox(false);
  };

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      toast({
        title: "Erro no formulário",
        description: "Por favor, corrija os campos destacados",
        variant: "destructive"
      });
      return;
    }

    try {
      // Montar "YYYY-MM-DD HH:mm" no fuso local para o backend
      const dataLocal = dayjs(formData.data!).format('YYYY-MM-DD');
      const startsAtLocal = `${dataLocal} ${formData.horaInicio}`;

      const createdAppointment = await createAppointment({
        patientId: formData.clienteId,
        startsAtLocal,
        durationMin: formData.duracao,
        status: 'pending',
        consultorioId: formData.consultorioId || undefined
      });

      // Atualização otimista local: refletir imediatamente na UI usando dados retornados do backend
      // Isso melhora a UX eliminando delay visual, enquanto o contexto será sincronizado
      // na próxima carga ou refetch automático
      adicionarAgendamento({
        id: createdAppointment.id.toString(), // ID do banco de dados
        clienteId: formData.clienteId,
        cliente: formData.cliente,
        tipo: formData.tipo as any,
        data: formData.data!,
        horaInicio: formData.horaInicio,
        duracao: formData.duracao,
        status: 'pendente'
      });

      toast({
        title: "Agendamento criado!",
        description: `Consulta marcada para ${formData.cliente}`,
      });

      limparFormulario();
      onClose();
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      
      // Extrair mensagem de erro apropriada
      let errorMessage = "Tente novamente em alguns instantes";
      
      // ApiError customizado (do nosso api.ts)
      if (error?.detail) {
        // Se for array de erros de validação do Pydantic
        if (Array.isArray(error.detail)) {
          errorMessage = error.detail
            .map((err: any) => {
              const field = err.loc?.join('.') || '';
              const msg = err.msg || err.message || '';
              return field ? `${field}: ${msg}` : msg;
            })
            .join('; ');
        } else if (typeof error.detail === 'string') {
          errorMessage = error.detail;
        } else if (typeof error.detail === 'object') {
          errorMessage = JSON.stringify(error.detail);
        }
      } else if (error?.message && error.message !== 'Erro na requisição') {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro ao agendar",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Fechar modal
  const handleClose = () => {
    limparFormulario();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Novo Agendamento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Seleção de Cliente */}
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className={`w-full justify-between ${erros.cliente ? 'border-red-500' : ''}`}
                >
                  {clienteSelecionado || "Buscar cliente..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput
                    placeholder="Digite nome ou CPF..."
                    value={buscarCliente}
                    onValueChange={setBuscarCliente}
                  />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      {clientesFiltrados.map((cliente) => (
                        <CommandItem
                          key={cliente.id}
                          value={`${cliente.nome} ${cliente.cpf}`}
                          onSelect={() => selecionarCliente(cliente)}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${clienteSelecionado === cliente.nome ? "opacity-100" : "opacity-0"
                              }`}
                          />
                          <div>
                            <div className="font-medium">{cliente.nome}</div>
                            <div className="text-sm text-muted-foreground">{cliente.cpf}</div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {erros.cliente && <p className="text-sm text-red-500">{erros.cliente}</p>}
          </div>

          {/* Seleção de Consultório */}
          <div className="space-y-2">
            <Label>Consultório *</Label>
            <Popover open={openComboboxConsultorio} onOpenChange={setOpenComboboxConsultorio}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openComboboxConsultorio}
                  className={`w-full justify-between ${erros.consultorio ? 'border-red-500' : ''}`}
                  disabled={isLoadingConsultorios}
                >
                  {isLoadingConsultorios ? (
                    "Carregando..."
                  ) : formData.consultorioId ? (
                    consultorios.find(c => c.id === formData.consultorioId)?.label || "Selecionar consultório…"
                  ) : (
                    "Selecionar consultório…"
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput
                    placeholder="Buscar consultório..."
                    value={buscarConsultorio}
                    onValueChange={setBuscarConsultorio}
                  />
                  <CommandList>
                    {consultorios.length === 0 && !isLoadingConsultorios ? (
                      <CommandEmpty>
                        Nenhum consultório encontrado. Cadastre um consultório em Configurações → Consultórios.
                      </CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {consultoriosFiltrados.map((consultorio) => (
                          <CommandItem
                            key={consultorio.id}
                            value={consultorio.label}
                            onSelect={() => {
                              setFormData(prev => ({ ...prev, consultorioId: consultorio.id }));
                              setBuscarConsultorio('');
                              setOpenComboboxConsultorio(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${formData.consultorioId === consultorio.id ? "opacity-100" : "opacity-0"}`}
                            />
                            <Building className="mr-2 h-4 w-4" />
                            {consultorio.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {erros.consultorio && <p className="text-sm text-red-500">{erros.consultorio}</p>}
          </div>

          {/* Tipo de Consulta */}
          <div className="space-y-2">
            <Label>Tipo de Consulta *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(valor) => setFormData(prev => ({ ...prev, tipo: valor as any }))}
            >
              <SelectTrigger className={erros.tipo ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Consulta">Consulta</SelectItem>
                <SelectItem value="Tratamento">Tratamento</SelectItem>
                <SelectItem value="Retorno">Retorno</SelectItem>
              </SelectContent>
            </Select>
            {erros.tipo && <p className="text-sm text-red-500">{erros.tipo}</p>}
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label>Data *</Label>
            <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${!formData.data && "text-muted-foreground"
                    } ${erros.data ? 'border-red-500' : ''}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.data ? format(formData.data, "dd 'de' MMMM", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.data}
                  onSelect={(data) => {
                    setFormData(prev => ({ ...prev, data }));
                    setOpenCalendar(false);
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {erros.data && <p className="text-sm text-red-500">{erros.data}</p>}
          </div>

          {/* Hora de Início */}
          <div className="space-y-2">
            <Label htmlFor="horaInicio">Hora de Início *</Label>
            <Input
              id="horaInicio"
              type="time"
              value={formData.horaInicio}
              onChange={(e) => setFormData(prev => ({ ...prev, horaInicio: e.target.value }))}
              className={erros.horaInicio ? 'border-red-500' : ''}
            />
            {erros.horaInicio && <p className="text-sm text-red-500">{erros.horaInicio}</p>}
          </div>

          {/* Duração */}
          <div className="space-y-2">
            <Label htmlFor="duracao">Duração (minutos) *</Label>
            <Select
              value={formData.duracao.toString()}
              onValueChange={(valor) => setFormData(prev => ({ ...prev, duracao: parseInt(valor) }))}
            >
              <SelectTrigger className={erros.duracao ? 'border-red-500' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="45">45 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1h 30min</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
                <SelectItem value="180">3 horas</SelectItem>
              </SelectContent>
            </Select>
            {erros.duracao && <p className="text-sm text-red-500">{erros.duracao}</p>}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-brand-purple to-brand-pink hover:from-brand-purple/80 hover:to-brand-pink/80 disabled:opacity-50"
              disabled={isPending}
            >
              Agendar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};