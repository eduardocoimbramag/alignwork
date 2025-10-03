import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/contexts/AppContext";
import { Search, Calendar, Clock, FileText } from "lucide-react";
import { Agendamento, Cliente } from "@/contexts/AppContext";

interface HistoricoPacientesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoricoPacientesModal = ({ isOpen, onClose }: HistoricoPacientesModalProps) => {
  const { buscarClientes, buscarHistoricoConsultas } = useApp();
  const [termoBusca, setTermoBusca] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  
  const clientesEncontrados = buscarClientes(termoBusca);
  const historicoConsultas = clienteSelecionado ? buscarHistoricoConsultas(clienteSelecionado.id) : [];

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-brand-pink/20 text-brand-pink';
      case 'confirmado': return 'bg-yellow-100 text-yellow-800';
      case 'concluido': return 'bg-brand-green/20 text-brand-green';
      case 'desmarcado': return 'bg-destructive/20 text-destructive';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleReset = () => {
    setTermoBusca("");
    setClienteSelecionado(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold">
            <FileText className="w-5 h-5 mr-2 text-brand-purple" />
            Histórico de Pacientes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!clienteSelecionado ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="busca" className="text-sm font-medium">
                  Buscar Paciente
                </Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="busca"
                    placeholder="Digite o nome ou CPF do paciente..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {termoBusca && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <p className="text-sm text-muted-foreground">
                    {clientesEncontrados.length} paciente(s) encontrado(s)
                  </p>
                  {clientesEncontrados.map((cliente) => (
                    <Card 
                      key={cliente.id} 
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => setClienteSelecionado(cliente)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{cliente.nome}</p>
                            <p className="text-sm text-muted-foreground">{cliente.cpf}</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Ver Histórico
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{clienteSelecionado.nome}</h3>
                  <p className="text-sm text-muted-foreground">{clienteSelecionado.cpf}</p>
                </div>
                <Button variant="outline" onClick={handleReset}>
                  Buscar Outro Paciente
                </Button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                <p className="text-sm text-muted-foreground">
                  {historicoConsultas.length} consulta(s) encontrada(s)
                </p>
                
                {historicoConsultas.map((consulta) => (
                  <Card key={consulta.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              {new Date(consulta.data).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {consulta.horaInicio}
                            </div>
                            <span className="text-sm font-medium">{consulta.tipo}</span>
                          </div>
                          <Badge className={getBadgeVariant(consulta.status)}>
                            {consulta.status === 'confirmado' ? 'Confirmado' : 
                             consulta.status === 'concluido' ? 'Concluído' : 
                             consulta.status === 'desmarcado' ? 'Desmarcado' : 'Pendente'}
                          </Badge>
                        </div>
                        
                        {consulta.anotacoes && (
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-sm font-medium mb-1">Anotações:</p>
                            <p className="text-sm text-muted-foreground">{consulta.anotacoes}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {historicoConsultas.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma consulta encontrada para este paciente.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};