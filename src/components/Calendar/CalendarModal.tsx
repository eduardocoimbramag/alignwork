import { useState, useMemo } from "react";
import { Clock, CheckCircle, X } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useApp } from "@/contexts/AppContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  getDateKey,
  createAppointmentCountsMap,
  type AppointmentCounts
} from "@/lib/calendar";

/**
 * MODAL DO CALENDÁRIO COMPLETO
 * 
 * Este componente mostra o calendário em tela cheia quando o usuário
 * clica no calendário do dashboard. Aqui ele pode:
 * 
 * - Ver todos os meses e navegar entre eles
 * - Ver contagens de agendamentos por dia com badges posicionados
 * - Clicar em uma data para ver detalhes dos agendamentos
 * - Navegar por teclado com foco visível
 */

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalendarModal = ({ isOpen, onClose }: CalendarModalProps) => {
  // Integração com o contexto global de dados
  const { buscarAgendamentosPorData, agendamentos } = useApp();

  // Data selecionada para mostrar os agendamentos
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Criar mapa de contagens por data usando useMemo para performance
  const appointmentCountsMap = useMemo(() => {
    return createAppointmentCountsMap(agendamentos);
  }, [agendamentos]);

  // Função que obtém contagens para uma data específica
  const getDateCounts = (date: Date): AppointmentCounts => {
    const dateKey = getDateKey(date);
    return appointmentCountsMap.get(dateKey) || { confirmed: 0, pending: 0 };
  };

  // Agendamentos da data selecionada
  const selectedDateAppointments = selectedDate ? buscarAgendamentosPorData(selectedDate) : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold text-foreground">
            Calendário de Agendamentos
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Coluna do Calendário */}
          <div className="space-y-4">
            {/* Legenda atualizada */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-brand-lime"></div>
                <span>Agendamentos Confirmados</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-brand-purple"></div>
                <span>Pendentes</span>
              </div>
            </div>

            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-lg border shadow-sm pointer-events-auto w-full"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                month: "space-y-4 w-full",
                caption: "flex justify-center pt-1 relative items-center px-8",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-input hover:bg-accent hover:text-accent-foreground rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] flex-1 text-center",
                row: "flex w-full mt-2 gap-1",
                cell: "relative flex-1 text-center text-sm p-0 focus-within:relative focus-within:z-20",
                day: "h-12 w-full p-0 font-normal aria-selected:opacity-100 relative flex items-center justify-center rounded-md transition-[background-position] duration-1000 ease-in-out focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                day_selected: "bg-gradient-to-br from-brand-purple/20 to-brand-pink/20 text-foreground hover:bg-gradient-to-br hover:from-brand-pink/20 hover:to-brand-purple/20 focus:bg-gradient-to-br focus:from-brand-purple/20 focus:to-brand-pink/20",
                day_today: "bg-brand-pink/30 text-foreground font-semibold",
              }}
              components={{
                Day: ({ date, ...props }) => {
                  const counts = getDateCounts(date);
                  const hasAppointments = counts.confirmed > 0 || counts.pending > 0;

                  return (
                    <button
                      {...props}
                      className={`
                        h-12 w-full p-0 font-normal relative rounded-md transition-[background-position] duration-1000 ease-in-out
                        flex items-center justify-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                        ${selectedDate && isSameDay(date, selectedDate)
                          ? 'bg-gradient-to-br from-brand-purple/20 to-brand-pink/20 text-foreground hover:bg-gradient-to-br hover:from-brand-pink/20 hover:to-brand-purple/20'
                          : hasAppointments
                            ? 'hover:bg-gradient-to-br hover:from-brand-purple/10 hover:to-brand-pink/10'
                            : 'hover:bg-gray-100'
                        }
                      `}
                    >
                      <span className="text-sm relative z-10">{format(date, 'd')}</span>

                      {/* Badge de Confirmados - canto superior direito */}
                      {counts.confirmed > 0 && (
                        <div className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full text-[10px] leading-none w-5 h-5 bg-brand-lime text-white font-semibold z-20">
                          {counts.confirmed}
                        </div>
                      )}

                      {/* Badge de Pendentes - canto inferior esquerdo */}
                      {counts.pending > 0 && (
                        <div className="absolute -bottom-1 -left-1 inline-flex items-center justify-center rounded-full text-[10px] leading-none w-5 h-5 bg-brand-purple text-white font-semibold z-20">
                          {counts.pending}
                        </div>
                      )}
                    </button>
                  );
                }
              }}
            />
          </div>

          {/* Coluna dos Agendamentos */}
          <div className="space-y-4">
            <div>
              <h3
                className="text-lg font-semibold text-foreground mb-2"
                aria-live="polite"
              >
                {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: ptBR }) : "Selecione uma data"}
              </h3>
              <Separator />
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedDateAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-lg">Nenhum agendamento</p>
                  <p className="text-sm">Esta data está disponível</p>
                </div>
              ) : (
                selectedDateAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-lg">{appointment.horaInicio}</span>
                          <Badge
                            variant="secondary"
                            className={
                              appointment.status === 'confirmado'
                                ? 'bg-brand-lime/10 text-brand-lime hover:bg-brand-lime/20 border-brand-lime/20'
                                : appointment.status === 'desmarcado'
                                  ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20'
                                  : 'bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20 border-brand-purple/20'
                            }
                          >
                            {appointment.status === 'confirmado' ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : appointment.status === 'desmarcado' ? (
                              <X className="w-3 h-3 mr-1" />
                            ) : (
                              <Clock className="w-3 h-3 mr-1" />
                            )}
                            {appointment.status === 'confirmado' ? 'Confirmado' :
                              appointment.status === 'desmarcado' ? 'Desmarcado' :
                                appointment.status === 'concluido' ? 'Concluído' : 'Pendente'}
                          </Badge>
                        </div>

                        <h4 className="font-medium text-foreground">{appointment.cliente}</h4>
                        <p className="text-sm text-muted-foreground">{appointment.tipo}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};