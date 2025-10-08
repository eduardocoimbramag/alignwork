import { useState, useMemo } from "react";
import { Clock, CheckCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useMonthAppointments } from "@/hooks/useMonthAppointments";
import { dayjs } from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types/appointment";

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
  tenantId?: string;
}

export const CalendarModal = ({ isOpen, onClose, tenantId = 'default-tenant' }: CalendarModalProps) => {
  // Data atual e selecionada
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Buscar appointments do mês atual da API
  const { data: appointments, isLoading } = useMonthAppointments(tenantId, year, month);

  // Navegar para mês anterior
  const handlePreviousMonth = () => {
    setCurrentDate(prev => dayjs(prev).subtract(1, 'month').toDate());
  };

  // Navegar para próximo mês
  const handleNextMonth = () => {
    setCurrentDate(prev => dayjs(prev).add(1, 'month').toDate());
  };

  // Formatar nome do mês
  const monthName = dayjs(currentDate).format('MMMM YYYY');

  // Verificar se uma data tem agendamentos
  const hasAppointments = (date: Date) => {
    if (!appointments) return false;
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    return appointments.some(apt =>
      dayjs(apt.starts_at).tz('America/Recife').format('YYYY-MM-DD') === dateStr
    );
  };

  // Contar agendamentos de uma data por status
  const getDateCounts = (date: Date) => {
    if (!appointments) return { confirmed: 0, pending: 0 };
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    const dayAppointments = appointments.filter(apt =>
      dayjs(apt.starts_at).tz('America/Recife').format('YYYY-MM-DD') === dateStr
    );

    return {
      confirmed: dayAppointments.filter(apt => apt.status === 'confirmed').length,
      pending: dayAppointments.filter(apt => apt.status === 'pending').length,
    };
  };

  // Obter agendamentos do dia selecionado
  const selectedDateAppointments = useMemo(() => {
    if (!appointments || !selectedDate) return [];
    const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
    return appointments
      .filter(apt =>
        dayjs(apt.starts_at).tz('America/Recife').format('YYYY-MM-DD') === dateStr
      )
      .sort((a, b) =>
        dayjs(a.starts_at).unix() - dayjs(b.starts_at).unix()
      );
  }, [appointments, selectedDate]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent">
              Calendário de Agendamentos
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Header de Navegação do Mês */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
              className="rounded-full hover:bg-brand-purple/10 hover:border-brand-purple transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <h3 className="text-xl font-semibold capitalize">
              {monthName}
            </h3>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              className="rounded-full hover:bg-brand-purple/10 hover:border-brand-purple transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Grid com Calendário e Detalhes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna do Calendário */}
            <div className="space-y-4">
              {/* Legenda */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-brand-lime"></div>
                  <span>Confirmados</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-brand-purple"></div>
                  <span>Pendentes</span>
                </div>
              </div>

              {/* Calendário */}
              <div className="bg-white rounded-lg border shadow-sm">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  month={currentDate}
                  onMonthChange={setCurrentDate}
                  disabled={isLoading}
                  className="w-full"
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
                    day: "h-12 w-full p-0 font-normal aria-selected:opacity-100 relative flex items-center justify-center rounded-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    day_selected: "bg-gradient-to-br from-brand-purple/20 to-brand-pink/20 text-foreground hover:bg-gradient-to-br hover:from-brand-pink/20 hover:to-brand-purple/20 focus:bg-gradient-to-br focus:from-brand-purple/20 focus:to-brand-pink/20",
                    day_today: "bg-brand-pink/30 text-foreground font-semibold",
                  }}
                  components={{
                    Day: ({ date, ...props }) => {
                      const counts = getDateCounts(date);
                      const hasAppts = counts.confirmed > 0 || counts.pending > 0;

                      return (
                        <button
                          {...props}
                          className={cn(
                            "h-12 w-full p-0 font-normal relative rounded-md transition-all duration-200",
                            "flex items-center justify-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            selectedDate && isSameDay(date, selectedDate)
                              ? 'bg-gradient-to-br from-brand-purple/20 to-brand-pink/20 text-foreground hover:bg-gradient-to-br hover:from-brand-pink/20 hover:to-brand-purple/20'
                              : hasAppts
                                ? 'hover:bg-gradient-to-br hover:from-brand-purple/10 hover:to-brand-pink/10'
                                : 'hover:bg-gray-100'
                          )}
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
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50 animate-spin" />
                    <p className="text-lg">Carregando...</p>
                  </div>
                ) : selectedDateAppointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-lg">Nenhum agendamento</p>
                    <p className="text-sm">Esta data está disponível</p>
                  </div>
                ) : (
                  selectedDateAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={cn(
                        "p-4 rounded-lg border-l-4 bg-white shadow-sm hover:shadow-md transition-shadow",
                        appointment.status === 'confirmed' && "border-brand-lime",
                        appointment.status === 'pending' && "border-brand-purple",
                        appointment.status === 'cancelled' && "border-gray-400"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-lg">
                              {dayjs(appointment.starts_at).tz('America/Recife').format('HH:mm')}
                            </span>
                            <Badge
                              variant="secondary"
                              className={cn(
                                appointment.status === 'confirmed' && 'bg-brand-lime/10 text-brand-lime hover:bg-brand-lime/20 border-brand-lime/20',
                                appointment.status === 'pending' && 'bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20 border-brand-purple/20',
                                appointment.status === 'cancelled' && 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-300'
                              )}
                            >
                              {appointment.status === 'confirmed' ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : appointment.status === 'cancelled' ? (
                                <X className="w-3 h-3 mr-1" />
                              ) : (
                                <Clock className="w-3 h-3 mr-1" />
                              )}
                              {appointment.status === 'confirmed' ? 'Confirmado' :
                                appointment.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                            </Badge>
                          </div>

                          <h4 className="font-medium text-foreground">
                            Paciente ID: {appointment.patient_id}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Duração: {appointment.duration_min} minutos
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};