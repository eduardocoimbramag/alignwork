import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, CheckCircle, X } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useApp } from "@/contexts/AppContext";
import { NovoAgendamento, HorarioDisponivel, DisponibilidadeDia } from "@/types/consulta";

interface CalendarioAgendamentoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmar: (agendamento: NovoAgendamento) => void;
    tipoSelecionado: string;
}

export const CalendarioAgendamentoModal = ({
    isOpen,
    onClose,
    onConfirmar,
    tipoSelecionado
}: CalendarioAgendamentoModalProps) => {
    const { buscarAgendamentosPorData } = useApp();

    const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>();
    const [horaSelecionada, setHoraSelecionada] = useState<string>("");
    const [duracao, setDuracao] = useState<number>(30);

    // Gerar horários disponíveis (8h às 18h, intervalos de 30min)
    const gerarHorariosDisponiveis = (data: Date): HorarioDisponivel[] => {
        const horarios: HorarioDisponivel[] = [];
        const agendamentosDoDia = buscarAgendamentosPorData(data);

        // Gerar slots de 30 em 30 minutos das 8h às 18h
        for (let hora = 8; hora < 18; hora++) {
            for (let minuto = 0; minuto < 60; minuto += 30) {
                const horaFormatada = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;

                // Verificar se já existe agendamento neste horário
                const temAgendamento = agendamentosDoDia.some(ag => ag.horaInicio === horaFormatada);

                horarios.push({
                    hora: horaFormatada,
                    disponivel: !temAgendamento
                });
            }
        }

        return horarios;
    };

    // Horários disponíveis para a data selecionada
    const horariosDisponiveis = useMemo(() => {
        if (!dataSelecionada) return [];
        return gerarHorariosDisponiveis(dataSelecionada);
    }, [dataSelecionada]);

    const handleConfirmar = () => {
        if (dataSelecionada && horaSelecionada && duracao > 0) {
            onConfirmar({
                tipo: tipoSelecionado as any,
                data: dataSelecionada,
                hora: horaSelecionada,
                duracao: duracao
            });
            onClose();
        }
    };

    const handleFechar = () => {
        setDataSelecionada(undefined);
        setHoraSelecionada("");
        setDuracao(30);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleFechar}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        Agendar {tipoSelecionado}
                    </DialogTitle>
                    <p className="text-muted-foreground">
                        Selecione a data, horário e duração para o agendamento
                    </p>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
                    {/* Calendário */}
                    <div className="space-y-4">
                        <Label className="text-sm font-medium">Selecionar Data</Label>
                        <Calendar
                            mode="single"
                            selected={dataSelecionada}
                            onSelect={setDataSelecionada}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            className="rounded-md border"
                        />
                    </div>

                    {/* Horários e Duração */}
                    <div className="space-y-4">
                        {dataSelecionada ? (
                            <>
                                <div>
                                    <Label className="text-sm font-medium">
                                        Horários Disponíveis - {format(dataSelecionada, "dd 'de' MMMM", { locale: ptBR })}
                                    </Label>
                                    <div className="grid grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto">
                                        {horariosDisponiveis.map((horario) => (
                                            <Button
                                                key={horario.hora}
                                                variant={horaSelecionada === horario.hora ? "default" : "outline"}
                                                size="sm"
                                                disabled={!horario.disponivel}
                                                onClick={() => setHoraSelecionada(horario.hora)}
                                                className={`transition-all duration-200 ${!horario.disponivel
                                                        ? 'opacity-50 cursor-not-allowed'
                                                        : 'hover:bg-primary hover:text-primary-foreground'
                                                    }`}
                                            >
                                                {horario.hora}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <Label htmlFor="duracao" className="text-sm font-medium">
                                        Duração (minutos)
                                    </Label>
                                    <Input
                                        id="duracao"
                                        type="number"
                                        min="15"
                                        max="240"
                                        step="15"
                                        value={duracao}
                                        onChange={(e) => setDuracao(Number(e.target.value))}
                                        placeholder="Duração (min)"
                                        className="mt-2 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Mínimo: 15 min | Máximo: 240 min | Intervalos de 15 min
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-48 text-muted-foreground">
                                <div className="text-center">
                                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>Selecione uma data para ver os horários disponíveis</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Resumo da seleção */}
                {dataSelecionada && horaSelecionada && (
                    <div className="bg-muted/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-brand-green" />
                            <span className="font-medium">Resumo do Agendamento</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            <p><strong>Tipo:</strong> {tipoSelecionado}</p>
                            <p><strong>Data:</strong> {format(dataSelecionada, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                            <p><strong>Horário:</strong> {horaSelecionada}</p>
                            <p><strong>Duração:</strong> {duracao} minutos</p>
                        </div>
                    </div>
                )}

                {/* Botões */}
                <div className="flex gap-3 pt-4">
                    <Button
                        variant="outline"
                        onClick={handleFechar}
                        className="flex-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirmar}
                        disabled={!dataSelecionada || !horaSelecionada || duracao <= 0}
                        className="flex-1 bg-brand-green hover:bg-brand-green/90"
                    >
                        Confirmar Agendamento
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

