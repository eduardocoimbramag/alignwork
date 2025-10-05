import { Calendar, Users, Clock, AlertTriangle, Plus, UserPlus, X, FileText, Eye } from "lucide-react";
import { useState } from "react";
import Header from "@/components/Layout/Header";
import StatsCard from "@/components/Dashboard/StatsCard";
import RecentAppointments from "@/components/Dashboard/RecentAppointments";
import InteractiveCalendar from "@/components/Calendar/InteractiveCalendar";
import { CadastroClienteModal } from "@/components/Modals/CadastroClienteModal";
import { NovoAgendamentoModal } from "@/components/Modals/NovoAgendamentoModal";
import { DesmarcarAgendamentoModal } from "@/components/Modals/DesmarcarAgendamentoModal";
import { HistoricoPacientesModal } from "@/components/Modals/HistoricoPacientesModal";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";

/**
 * PÁGINA PRINCIPAL - DASHBOARD
 * 
 * Esta é a tela inicial do sistema que o profissional vê quando faz login.
 * Mostra um resumo geral de:
 * - Estatísticas importantes (consultas hoje, total de clientes, etc.)
 * - Próximas consultas agendadas
 * - Clientes que não comparecem há tempo (para reengajamento)
 * 
 * É como um "painel de controle" do consultório/clínica.
 */

const Dashboard = () => {
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [modalAgendamentoAberto, setModalAgendamentoAberto] = useState(false);
  const [modalDesmarcarAberto, setModalDesmarcarAberto] = useState(false);
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false);
  const [proximasConsultasAberto, setProximasConsultasAberto] = useState(false);
  const [clientesInativosAberto, setClientesInativosAberto] = useState(false);

  const { buscarAgendamentosPorData, buscarProximosAgendamentos } = useApp();

  // Obter o dia da semana atual
  const hoje = new Date();
  const diasSemana = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const diaAtual = diasSemana[hoje.getDay()];

  // Contar consultas de hoje
  const consultasHoje = buscarAgendamentosPorData(hoje);
  const numeroConsultas = consultasHoje.length;
  const proximasConsultas = buscarProximosAgendamentos();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-brand-pink/30 via-background to-brand-lime/20">
        {/* Cabeçalho que aparece em todas as telas */}
        <Header />

        <main className="p-6">
          {/* Seção de boas-vindas */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Bom dia! 👋
            </h2>
            <p className="text-muted-foreground">
              Que você tenha uma ótima {diaAtual}. Hoje temos {numeroConsultas} consultas agendadas!
            </p>
          </div>

          {/* Grid de estatísticas principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Consultas Hoje"
              value={numeroConsultas}
              description={`${consultasHoje.filter(c => c.status === 'confirmado').length} confirmadas, ${consultasHoje.filter(c => c.status === 'pendente').length} pendentes`}
              icon={<Calendar className="w-5 h-5" />}
              gradient="from-brand-purple to-brand-pink"
            />

            <StatsCard
              title="Total de Clientes"
              value="0"
              description="Nenhum cliente cadastrado"
              icon={<Users className="w-5 h-5" />}
              gradient="from-brand-purple to-brand-pink"
            />

            <StatsCard
              title="Próxima Consulta"
              value={proximasConsultas.length > 0 ? proximasConsultas[0].horaInicio : "Nenhuma"}
              description={proximasConsultas.length > 0 ? `${proximasConsultas[0].cliente} - ${proximasConsultas[0].tipo}` : "Nenhuma consulta agendada"}
              icon={<Clock className="w-5 h-5" />}
              gradient="from-brand-lime to-brand-pink"
              actionButton={
                proximasConsultas.length > 0 ? (
                  <button
                    onClick={() => setProximasConsultasAberto(true)}
                    className="w-8 h-8 bg-brand-purple hover:bg-brand-purple/90 rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Eye className="w-4 h-4 text-white" />
                  </button>
                ) : undefined
              }
            />

            <StatsCard
              title="Clientes Inativos"
              value="0"
              description="Nenhum cliente inativo"
              icon={<AlertTriangle className="w-5 h-5" />}
              gradient="from-brand-pink to-brand-purple"
              actionButton={
                <button
                  onClick={() => setClientesInativosAberto(true)}
                  className="w-8 h-8 bg-brand-purple hover:bg-brand-purple/90 rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Eye className="w-4 h-4 text-white" />
                </button>
              }
            />
          </div>

          {/* Grid principal com informações detalhadas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna esquerda: Próximas consultas */}
            <RecentAppointments />

            {/* Coluna do meio: Calendário interativo */}
            <InteractiveCalendar />

            {/* Coluna direita: Ações rápidas */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="font-semibold text-foreground mb-4">Ações Rápidas</h3>
                <div className="space-y-3">
                  <Button
                    onClick={() => setModalAgendamentoAberto(true)}
                    className="w-full text-left p-3 transition-all justify-start text-black hover:bg-gray-200/80 transition-all duration-200"
                    variant="ghost"
                    style={{ backgroundColor: 'rgb(252, 249, 252)' }}
                  >
                    <Plus className="w-4 h-4 mr-2 text-black" />
                    <div>
                      <div className="font-medium text-black">Novo Agendamento</div>
                      <div className="text-sm text-gray-600">Agendar consulta</div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => setModalCadastroAberto(true)}
                    className="w-full text-left p-3 transition-all justify-start text-black hover:bg-gray-200/80 transition-all duration-200"
                    variant="ghost"
                    style={{ backgroundColor: 'rgb(252, 249, 252)' }}
                  >
                    <UserPlus className="w-4 h-4 mr-2 text-black" />
                    <div>
                      <div className="font-medium text-black">Cadastrar Cliente</div>
                      <div className="text-sm text-gray-600">Adicionar novo paciente</div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => setModalDesmarcarAberto(true)}
                    className="w-full text-left p-3 transition-all justify-start text-black hover:bg-gray-200/80 transition-all duration-200"
                    variant="ghost"
                    style={{ backgroundColor: 'rgb(252, 249, 252)' }}
                  >
                    <X className="w-4 h-4 mr-2 text-black" />
                    <div>
                      <div className="font-medium text-black">Desmarcar Agendamento</div>
                      <div className="text-sm text-gray-600">Cancelar consulta</div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => setModalHistoricoAberto(true)}
                    className="w-full text-left p-3 transition-all justify-start text-black hover:bg-gray-200/80 transition-all duration-200"
                    variant="ghost"
                    style={{ backgroundColor: 'rgb(252, 249, 252)' }}
                  >
                    <FileText className="w-4 h-4 mr-2 text-black" />
                    <div>
                      <div className="font-medium text-black">Histórico de Pacientes</div>
                      <div className="text-sm text-gray-600">Ver consultas anteriores</div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modais */}
      <CadastroClienteModal
        isOpen={modalCadastroAberto}
        onClose={() => setModalCadastroAberto(false)}
      />
      <NovoAgendamentoModal
        isOpen={modalAgendamentoAberto}
        onClose={() => setModalAgendamentoAberto(false)}
      />
      <DesmarcarAgendamentoModal
        isOpen={modalDesmarcarAberto}
        onClose={() => setModalDesmarcarAberto(false)}
      />
      <HistoricoPacientesModal
        isOpen={modalHistoricoAberto}
        onClose={() => setModalHistoricoAberto(false)}
      />

      {proximasConsultasAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Próximas Consultas</h2>
              <button
                onClick={() => setProximasConsultasAberto(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <RecentAppointments />
            </div>
          </div>
        </div>
      )}

      {clientesInativosAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Clientes Inativos</h2>
              <button
                onClick={() => setClientesInativosAberto(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-4">
                  Clientes que não comparecem há mais de 30 dias:
                </div>
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-2">Nenhum cliente inativo encontrado</div>
                  <div className="text-sm text-gray-400">Todos os clientes estão ativos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;