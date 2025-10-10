import { Clock, CheckCircle, User, Play, Hourglass } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useState } from "react";
import { TelaConsultaModal } from "@/components/Modals/TelaConsultaModal";
import { ConfirmarConsultaModal } from "@/components/Modals/ConfirmarConsultaModal";
import { useTenant } from "@/contexts/TenantContext";
import { useUpdateAppointmentStatus } from "@/hooks/useAppointmentMutations";
import { dayjs } from "@/lib/dayjs";

const RecentAppointments = () => {
  const { buscarProximosAgendamentos, atualizarStatusAgendamento } = useApp();
  const { tenantId } = useTenant();
  const { mutateAsync: updateStatus, isPending } = useUpdateAppointmentStatus(tenantId);
  const [consultaAberta, setConsultaAberta] = useState<string | null>(null);
  const [confirmarId, setConfirmarId] = useState<string | null>(null);
  const proximasConsultas = buscarProximosAgendamentos();

  const handleStatusChange = (id: string, statusAtual: string) => {
    if (statusAtual === 'confirmado') {
      atualizarStatusAgendamento(id, 'concluido');
    } else if (statusAtual === 'concluido') {
      atualizarStatusAgendamento(id, 'confirmado');
    } else if (statusAtual === 'pendente') {
      setConfirmarId(id);
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-brand-pink/20 text-brand-purple hover:bg-brand-pink/30';
      case 'confirmado': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer';
      case 'concluido': return 'bg-brand-green/20 text-brand-green hover:bg-brand-green/30 cursor-pointer';
      case 'desmarcado': return 'bg-destructive/20 text-destructive hover:bg-destructive/30';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <Clock className="w-5 h-5 mr-2 text-brand-purple" />
          Próximas Consultas
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {proximasConsultas.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">Nenhuma consulta agendada</div>
            <div className="text-sm text-gray-400">As próximas consultas aparecerão aqui</div>
          </div>
        ) : (
          proximasConsultas.map((consulta) => (
            <div key={consulta.id} className="relative flex items-center justify-between p-3 rounded-lg border hover:bg-gray-200/80 transition-all duration-200" style={{ backgroundColor: 'rgb(252, 249, 252)' }}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-brand-purple flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{consulta.cliente}</p>
                  <p className="text-sm text-muted-foreground">{consulta.tipo}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end justify-center">
                  <p className="font-semibold text-foreground mb-1">{consulta.horaInicio}</p>
                  <div className="flex items-center justify-end gap-2">
                    <Badge
                      className={getBadgeVariant(consulta.status)}
                      onClick={() => handleStatusChange(consulta.id, consulta.status)}
                    >
                      {consulta.status === 'concluido' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {consulta.status === 'confirmado' ? 'Confirmado' :
                        consulta.status === 'concluido' ? 'Concluído' :
                          consulta.status === 'desmarcado' ? 'Desmarcado' : 'Pendente'}
                    </Badge>
                    {consulta.status === 'confirmado' && (
                      <button
                        onClick={() => setConsultaAberta(consulta.id)}
                        className="w-6 h-6 bg-brand-purple hover:bg-brand-purple/90 rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <Play className="w-3 h-3 text-white fill-white" />
                      </button>
                    )}
                    {consulta.status === 'pendente' && (
                      <button
                        onClick={() => setConfirmarId(consulta.id)}
                        className="w-6 h-6 bg-brand-purple hover:bg-brand-purple/90 rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <Hourglass className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        <TelaConsultaModal
          agendamentoId={consultaAberta}
          isOpen={!!consultaAberta}
          onClose={() => setConsultaAberta(null)}
        />

        {confirmarId && (() => {
          const c = proximasConsultas.find(x => x.id === confirmarId)
          const paciente = c?.cliente ?? 'Paciente'
          const data = c ? dayjs(c.data).format('DD/MM/YYYY') : ''
          const hora = c?.horaInicio ?? ''
          return (
            <ConfirmarConsultaModal
              isOpen={!!confirmarId}
              onClose={() => setConfirmarId(null)}
              paciente={paciente}
              data={data}
              hora={hora}
              isLoading={isPending}
              onConfirm={async () => {
                try {
                  await updateStatus({ appointmentId: confirmarId!, tenantId, status: 'confirmed' })
                  atualizarStatusAgendamento(confirmarId!, 'confirmado')
                } finally {
                  setConfirmarId(null)
                }
              }}
            />
          )
        })()}
      </CardContent>
    </Card>
  );
};

export default RecentAppointments;