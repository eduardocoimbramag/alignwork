import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useApp, Prescription } from "@/contexts/AppContext";
import { CalendarioAgendamentoModal } from "./CalendarioAgendamentoModal";
import { NovoAgendamento, TipoAgendamento } from "@/types/consulta";
import { Calendar, Edit, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface TelaConsultaModalProps {
  agendamentoId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TelaConsultaModal = ({ agendamentoId, isOpen, onClose }: TelaConsultaModalProps) => {
  const { agendamentos, salvarAnotacaoConsulta, concluirConsulta } = useApp();
  const [anotacoes, setAnotacoes] = useState("");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [drug, setDrug] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [intervalo, setIntervalo] = useState("");
  const [duracao, setDuracao] = useState("");

  // Estados para agendamento
  const [tipoAgendamento, setTipoAgendamento] = useState<TipoAgendamento | null>(null);
  const [novoAgendamento, setNovoAgendamento] = useState<NovoAgendamento | null>(null);
  const [isCalendarioOpen, setIsCalendarioOpen] = useState(false);

  const agendamento = agendamentos.find(a => a.id === agendamentoId);

  useEffect(() => {
    if (agendamento) {
      setAnotacoes(agendamento.anotacoes || "");
      setPrescriptions(agendamento.prescriptions || []);
    } else {
      setAnotacoes("");
      setPrescriptions([]);
    }
  }, [agendamento]);

  const addPrescription = () => {
    if (drug.trim() && quantidade.trim() && intervalo.trim() && duracao.trim()) {
      const intervaloComposto = `${quantidade.trim()} • ${intervalo.trim()} • ${duracao.trim()}`;
      setPrescriptions(p => [...p, {
        id: crypto.randomUUID(),
        drug: drug.trim(),
        quantidade: quantidade.trim(),
        intervalo: intervalo.trim(),
        duracao: duracao.trim(),
        schedule: intervaloComposto
      }]);
      setDrug("");
      setQuantidade("");
      setIntervalo("");
      setDuracao("");
    }
  };

  const removePrescription = (id: string) => {
    setPrescriptions(p => p.filter(i => i.id !== id));
  };

  // Funções para agendamento
  const handleTipoAgendamentoChange = (tipo: TipoAgendamento, checked: boolean) => {
    if (checked) {
      setTipoAgendamento(tipo);
      setIsCalendarioOpen(true);
    } else {
      setTipoAgendamento(null);
      setNovoAgendamento(null);
    }
  };

  const handleConfirmarAgendamento = (agendamento: NovoAgendamento) => {
    setNovoAgendamento(agendamento);
    toast.success(`${agendamento.tipo} agendado com sucesso!`);
  };

  const handleRemoverAgendamento = () => {
    setNovoAgendamento(null);
    setTipoAgendamento(null);
  };

  const handleEditarAgendamento = () => {
    setIsCalendarioOpen(true);
  };

  const handleSalvar = () => {
    if (agendamentoId) {
      salvarAnotacaoConsulta(agendamentoId, anotacoes, prescriptions);
      toast.success("Anotações salvas com sucesso!");
    }
  };

  const handleConcluir = () => {
    if (agendamentoId) {
      concluirConsulta(agendamentoId, anotacoes, prescriptions);
      toast.success("Consulta concluída com sucesso!");
      onClose();
    }
  };

  if (!agendamento) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Consulta: {agendamento.cliente}
          </DialogTitle>
          <p className="text-muted-foreground">
            {new Date(agendamento.data).toLocaleDateString('pt-BR')} às {agendamento.horaInicio} - {agendamento.tipo}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label htmlFor="anotacoes" className="text-sm font-medium">
              Anotações da Consulta
            </Label>
            <Textarea
              id="anotacoes"
              placeholder="Digite suas anotações sobre a consulta..."
              value={anotacoes}
              onChange={(e) => setAnotacoes(e.target.value)}
              className="mt-2 min-h-[200px] resize-none"
            />
          </div>

          {/* NOVA SEÇÃO: RECEITAS */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">
              Receitas
            </Label>

            {/* Inputs para adicionar receita */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="drug" className="text-xs text-muted-foreground">
                  Remédio
                </Label>
                <Input
                  id="drug"
                  placeholder="Ex.: Amoxicilina 500 mg"
                  value={drug}
                  onChange={(e) => setDrug(e.target.value)}
                  className="mt-1 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-invalid={!drug.trim()}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="quantidade" className="text-xs text-muted-foreground">
                    Quantidade
                  </Label>
                  <Input
                    id="quantidade"
                    placeholder="Ex.: 1 cápsula ou 100ml"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    className="mt-1 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-invalid={!quantidade.trim()}
                  />
                </div>
                <div>
                  <Label htmlFor="intervalo" className="text-xs text-muted-foreground">
                    Intervalo de uso
                  </Label>
                  <Input
                    id="intervalo"
                    placeholder="Ex.: 8H"
                    value={intervalo}
                    onChange={(e) => setIntervalo(e.target.value)}
                    className="mt-1 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-invalid={!intervalo.trim()}
                  />
                </div>
                <div>
                  <Label htmlFor="duracao" className="text-xs text-muted-foreground">
                    Duração
                  </Label>
                  <Input
                    id="duracao"
                    placeholder="Ex.: 7 Dias"
                    value={duracao}
                    onChange={(e) => setDuracao(e.target.value)}
                    className="mt-1 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-invalid={!duracao.trim()}
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={addPrescription}
              disabled={!drug.trim() || !quantidade.trim() || !intervalo.trim() || !duracao.trim()}
              className="w-full"
            >
              Adicionar
            </Button>

            {/* Lista de receitas */}
            {prescriptions.length > 0 && (
              <div className="space-y-2">
                <div className="divide-y divide-border">
                  {prescriptions.map((prescription) => (
                    <div key={prescription.id} className="flex items-center justify-between py-3">
                      <div className="flex-1">
                        <span className="font-medium">{prescription.drug}</span>
                        <span className="text-muted-foreground"> — {prescription.schedule}</span>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removePrescription(prescription.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* FIM DA SEÇÃO RECEITAS */}

          {/* NOVA SEÇÃO: AGENDAMENTO */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">
              Agendamento
            </Label>

            {/* Seleção de tipo de agendamento */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(['Consulta', 'Retorno', 'Procedimento', 'Tratamento'] as TipoAgendamento[]).map((tipo) => (
                  <div key={tipo} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tipo-${tipo}`}
                      checked={tipoAgendamento === tipo}
                      onCheckedChange={(checked) => handleTipoAgendamentoChange(tipo, checked as boolean)}
                      className="transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <Label
                      htmlFor={`tipo-${tipo}`}
                      className="text-sm font-medium cursor-pointer transition-all duration-200 hover:text-primary"
                    >
                      {tipo}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Exibição do agendamento selecionado */}
            {novoAgendamento && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[hsl(var(--primary))]" />
                    <span className="font-medium">Agendamento Confirmado</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditarAgendamento}
                      className="transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoverAgendamento}
                      className="text-destructive hover:text-destructive transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Remover
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Tipo:</strong> {novoAgendamento.tipo}</p>
                  <p><strong>Data:</strong> {format(novoAgendamento.data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                  <p><strong>Horário:</strong> {novoAgendamento.hora}</p>
                  <p><strong>Duração:</strong> {novoAgendamento.duracao} minutos</p>
                </div>
              </div>
            )}
          </div>
          {/* FIM DA SEÇÃO AGENDAMENTO */}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleSalvar}
              className="flex-1 hover:bg-[hsl(var(--primary))] hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Salvar Anotações
            </Button>
            <Button
              onClick={handleConcluir}
              className="flex-1 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white"
            >
              Concluir Consulta
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Modal de Calendário */}
      {tipoAgendamento && (
        <CalendarioAgendamentoModal
          isOpen={isCalendarioOpen}
          onClose={() => setIsCalendarioOpen(false)}
          onConfirmar={handleConfirmarAgendamento}
          tipoSelecionado={tipoAgendamento}
        />
      )}
    </Dialog>
  );
};