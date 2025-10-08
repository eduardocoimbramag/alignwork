import { useState } from "react";
import { Calendar, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarModal } from "./CalendarModal";
import { DashboardCalendarStats } from "@/components/DashboardCalendarStats";

/**
 * COMPONENTE DE CALENDÁRIO INTERATIVO
 * 
 * Este é o calendário que aparece no dashboard principal.
 * Quando o profissional clica nele, abre um modal maior
 * mostrando todos os meses, dias e agendamentos.
 * 
 * Funcionalidades:
 * - Mostra estatísticas de agendamentos (hoje, semana, mês, próximo mês)
 * - Ao clicar, abre modal com calendário completo
 * - Integra com dados de agendamentos em tempo real
 */

const InteractiveCalendar = ({ tenantId }: { tenantId: string }) => {
  // Estado para controlar se o modal está aberto ou fechado
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Data atual para mostrar no card
  const currentDate = new Date();
  const monthName = currentDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <>
      {/* Card do calendário no dashboard */}
      <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Calendário</CardTitle>
          <Calendar className="w-5 h-5 text-brand-purple group-hover:scale-110 transition-transform" />
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* Título do mês atual */}
            <div>
              <h3 className="text-xl font-bold text-foreground capitalize">
                {monthName}
              </h3>
              <DashboardCalendarStats tenantId={tenantId} />
            </div>

            {/* Botão para abrir calendário completo */}
            <Button
              onClick={() => setIsModalOpen(true)}
              className="w-full mt-4 bg-gradient-to-r from-brand-purple to-brand-pink hover:from-brand-purple/80 hover:to-brand-pink/80 transition-all"
            >
              <span className="flex-1">Ver Calendário Completo</span>
              <ChevronRight className="w-4 h-4 ml-2 flex-shrink-0" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal com calendário completo */}
      <CalendarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tenantId={tenantId}
      />
    </>
  );
};

export default InteractiveCalendar;