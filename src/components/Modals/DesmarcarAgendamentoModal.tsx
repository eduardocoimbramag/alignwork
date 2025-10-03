import { useState, useMemo } from "react";
import { Search, Calendar, Clock, User, X, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useApp } from "@/contexts/AppContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface DesmarcarAgendamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DesmarcarAgendamentoModal = ({ isOpen, onClose }: DesmarcarAgendamentoModalProps) => {
  const { clientes, buscarAgendamentosDoCliente, desmarcarAgendamento } = useApp();
  const [termoBusca, setTermoBusca] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<string | null>(null);
  const [agendamentoParaDesmarcar, setAgendamentoParaDesmarcar] = useState<string | null>(null);

  // Busca clientes por nome ou CPF
  const clientesFiltrados = useMemo(() => {
    if (!termoBusca.trim()) return [];
    
    const termo = termoBusca.toLowerCase().trim();
    return clientes.filter(cliente => 
      cliente.nome.toLowerCase().includes(termo) ||
      cliente.cpf.replace(/\D/g, '').includes(termo.replace(/\D/g, ''))
    ).slice(0, 5); // Limitar a 5 resultados para autocomplete
  }, [clientes, termoBusca]);

  // Busca agendamentos do cliente selecionado (exceto os já desmarcados)
  const agendamentosDoCliente = useMemo(() => {
    if (!clienteSelecionado) return [];
    return buscarAgendamentosDoCliente(clienteSelecionado)
      .filter(agendamento => agendamento.status !== 'desmarcado')
      .sort((a, b) => {
        const dataA = new Date(a.data).getTime();
        const dataB = new Date(b.data).getTime();
        if (dataA !== dataB) return dataA - dataB;
        return a.horaInicio.localeCompare(b.horaInicio);
      });
  }, [clienteSelecionado, buscarAgendamentosDoCliente]);

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-brand-purple/20 text-brand-purple';
      case 'confirmado': return 'bg-yellow-100 text-yellow-800';
      case 'concluido': return 'bg-brand-green/20 text-brand-green';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSelecionarCliente = (cliente: any) => {
    setClienteSelecionado(cliente.id);
    setTermoBusca(cliente.nome);
  };

  const handleDesmarcar = () => {
    if (agendamentoParaDesmarcar) {
      desmarcarAgendamento(agendamentoParaDesmarcar);
      toast.success("Agendamento desmarcado com sucesso!");
      setAgendamentoParaDesmarcar(null);
      onClose();
      // Reset do modal
      setTermoBusca("");
      setClienteSelecionado(null);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset do modal
    setTermoBusca("");
    setClienteSelecionado(null);
    setAgendamentoParaDesmarcar(null);
  };

  const cliente = clienteSelecionado ? clientes.find(c => c.id === clienteSelecionado) : null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl font-bold text-foreground">
              <X className="w-6 h-6 mr-2 text-destructive" />
              Desmarcar Agendamento
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Campo de busca de cliente */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Buscar Cliente
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Digite o nome ou CPF do cliente..."
                  value={termoBusca}
                  onChange={(e) => {
                    setTermoBusca(e.target.value);
                    if (clienteSelecionado && e.target.value !== cliente?.nome) {
                      setClienteSelecionado(null);
                    }
                  }}
                  className="pl-10"
                />
              </div>

              {/* Resultados do autocomplete */}
              {termoBusca && !clienteSelecionado && clientesFiltrados.length > 0 && (
                <div className="border rounded-md bg-white shadow-md max-h-40 overflow-y-auto">
                  {clientesFiltrados.map((cliente) => (
                    <button
                      key={cliente.id}
                      onClick={() => handleSelecionarCliente(cliente)}
                      className="w-full text-left p-3 hover:bg-gray-50 flex items-center space-x-3 border-b last:border-b-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-purple flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{cliente.nome}</p>
                        <p className="text-sm text-muted-foreground">{cliente.cpf}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {termoBusca && !clienteSelecionado && clientesFiltrados.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum cliente encontrado</p>
                </div>
              )}
            </div>

            {/* Lista de agendamentos do cliente */}
            {cliente && (
              <div className="space-y-4">
                <Separator />
                
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Agendamentos de {cliente.nome}
                  </h3>
                  
                  {agendamentosDoCliente.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum agendamento ativo</p>
                      <p className="text-sm">Este cliente não possui agendamentos para desmarcar</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {agendamentosDoCliente.map((agendamento) => (
                        <div 
                          key={agendamento.id}
                          className="p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Clock className="w-4 h-4 text-brand-purple" />
                                <span className="font-semibold">
                                  {format(new Date(agendamento.data), "d 'de' MMMM", { locale: ptBR })} - {agendamento.horaInicio}
                                </span>
                                <Badge className={getBadgeVariant(agendamento.status)}>
                                  {agendamento.status === 'confirmado' ? 'Confirmado' : 
                                   agendamento.status === 'concluido' ? 'Concluído' : 'Pendente'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{agendamento.tipo}</p>
                              <p className="text-sm text-muted-foreground">Duração: {agendamento.duracao} min</p>
                            </div>
                            
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setAgendamentoParaDesmarcar(agendamento.id)}
                              className="ml-4"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Desmarcar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação */}
      <AlertDialog open={!!agendamentoParaDesmarcar} onOpenChange={() => setAgendamentoParaDesmarcar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-destructive" />
              Confirmar Desmarcação
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desmarcar este agendamento? Esta ação não pode ser desfeita.
              O agendamento ficará marcado como "Desmarcado" no sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDesmarcar} className="bg-destructive hover:bg-destructive/90">
              Sim, desmarcar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};