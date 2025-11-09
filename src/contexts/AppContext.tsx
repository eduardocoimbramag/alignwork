import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Appointment } from '@/types/appointment';
import type { Patient } from '@/types/patient';
import { dayjs } from '@/lib/dayjs';

/**
 * CONTEXTO GLOBAL DA APLICAÇÃO
 * 
 * Este arquivo gerencia todos os dados que precisam ser compartilhados
 * entre diferentes partes do sistema (clientes, agendamentos, etc.)
 * 
 * Os dados são sincronizados com o backend na inicialização:
 * - Clientes (patients) são carregados do banco de dados
 * - Agendamentos (appointments) são carregados do banco de dados
 * - Alterações são refletidas tanto no contexto local quanto no backend
 */

// Tipos de dados que o sistema vai usar
export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  cpf: string;
  endereco: string;
  email?: string;
  observacoes?: string;
  dataCadastro: Date;
}

export interface ConsultaAnotacao {
  id: string;
  agendamentoId: string;
  clienteId: string;
  anotacoes: string;
  dataConsulta: Date;
}

export interface Prescription {
  id: string;
  drug: string;
  quantidade: string;
  intervalo: string;
  duracao: string;
  schedule: string; // Mantido para compatibilidade - será montado automaticamente
}

export interface Agendamento {
  id: string;
  clienteId: string;
  cliente: string; // Nome do cliente para facilitar exibição
  tipo: 'Consulta' | 'Tratamento' | 'Retorno';
  data: Date;
  horaInicio: string; // formato "HH:MM"
  duracao: number; // em minutos
  status: 'pendente' | 'confirmado' | 'concluido' | 'desmarcado';
  observacoes?: string;
  anotacoes?: string; // Anotações da consulta realizada
  prescriptions?: Prescription[];
}

export interface UserSettings {
  notificationsEnabled: boolean;
  emailReminders: boolean;
  theme: "system" | "light" | "dark";
  language?: string;
}

// Interface do contexto - define quais dados e funções estarão disponíveis
interface AppContextType {
  // Dados
  clientes: Cliente[];
  agendamentos: Agendamento[];
  consultasAnotacoes: ConsultaAnotacao[];
  settings: UserSettings;

  // Funções para gerenciar clientes
  adicionarCliente: (cliente: Omit<Cliente, 'id' | 'dataCadastro'>) => void;
  buscarClientes: (termo: string) => Cliente[];

  // Funções para gerenciar agendamentos
  adicionarAgendamento: (agendamento: Omit<Agendamento, 'id'> & { id?: string }) => void;
  atualizarStatusAgendamento: (id: string, status: Agendamento['status']) => void;
  desmarcarAgendamento: (id: string) => void;
  buscarAgendamentosPorData: (data: Date) => Agendamento[];
  buscarProximosAgendamentos: () => Agendamento[];
  buscarAgendamentosDoCliente: (clienteId: string) => Agendamento[];

  // Funções para gerenciar consultas
  salvarAnotacaoConsulta: (agendamentoId: string, anotacoes: string, prescriptions?: Prescription[]) => void;
  concluirConsulta: (agendamentoId: string, anotacoes?: string, prescriptions?: Prescription[]) => void;
  buscarHistoricoConsultas: (clienteId: string) => Agendamento[];

  // Funções para gerenciar configurações
  saveSettings: (settings: UserSettings) => void;
}

// Criação do contexto
const AppContext = createContext<AppContextType | undefined>(undefined);

// Arrays iniciais vazios - serão populados com dados do backend na inicialização
const clientesIniciais: Cliente[] = [];
const agendamentosIniciais: Agendamento[] = [];

// Configurações padrão
const settingsIniciais: UserSettings = {
  notificationsEnabled: true,
  emailReminders: true,
  theme: "system",
  language: "pt-br"
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciais);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(agendamentosIniciais);
  const [consultasAnotacoes, setConsultasAnotacoes] = useState<ConsultaAnotacao[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [settings, setSettings] = useState<UserSettings>(() => {
    // Hidratar configurações do localStorage na inicialização
    try {
      const savedSettings = localStorage.getItem('alignwork:settings');
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
    } catch (error) {
      console.warn('Erro ao carregar configurações do localStorage:', error);
    }
    return settingsIniciais;
  });

  // Sincronizar settings quando localStorage mudar (ex: quando ThemeProvider alterar o tema)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'alignwork:settings' && e.newValue) {
        try {
          const newSettings = JSON.parse(e.newValue);
          setSettings(newSettings);
        } catch (error) {
          console.warn('Erro ao sincronizar configurações do localStorage:', error);
        }
      }
    };

    // Escutar mudanças no localStorage de outras abas/janelas
    window.addEventListener('storage', handleStorageChange);
    
    // Escutar eventos customizados quando o tema mudar na mesma janela
    const handleThemeChange = () => {
      try {
        const savedSettings = localStorage.getItem('alignwork:settings');
        if (savedSettings) {
          const newSettings = JSON.parse(savedSettings);
          setSettings(prevSettings => {
            // Atualizar apenas o tema, mantendo outros valores
            if (newSettings.theme !== prevSettings.theme) {
              return { ...prevSettings, theme: newSettings.theme };
            }
            return prevSettings;
          });
        }
      } catch (error) {
        // Ignorar erros silenciosamente
      }
    };

    // Escutar evento customizado 'theme-changed' disparado pelo ThemeProvider
    window.addEventListener('theme-changed', handleThemeChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('theme-changed', handleThemeChange);
    };
  }, []);

  // Carregar clientes e agendamentos do backend na inicialização
  useEffect(() => {
    const loadData = async () => {
      try {
        // Obter tenantId do localStorage
        const tenantId = localStorage.getItem('alignwork:tenantId') || 'default-tenant';
        
        const { fetchAppointments, fetchPatients } = await import('@/services/api');
        
        // Carregar clientes e agendamentos em paralelo
        const [patientsResponse, appointmentsResponse] = await Promise.all([
          fetchPatients({
            tenantId,
            page: 1,
            page_size: 100
          }),
          fetchAppointments({
            tenantId,
            from: dayjs().subtract(3, 'month').startOf('day').toISOString(),
            to: dayjs().add(3, 'month').endOf('day').toISOString(),
            page: 1,
            page_size: 100
          })
        ]);
        
        // Transformar patients da API para o formato do contexto
        const clientesCarregados: Cliente[] = patientsResponse.data.map((patient: Patient) => ({
          id: patient.id.toString(),
          nome: patient.name,
          telefone: patient.phone,
          cpf: patient.cpf,
          endereco: patient.address,
          email: patient.email || '',
          observacoes: patient.notes || '',
          dataCadastro: new Date(patient.created_at)
        }));
        
        // Criar mapa de clientes para lookup rápido
        const clientesMap = new Map(clientesCarregados.map(c => [c.id, c]));
        
        // Transformar appointments da API para o formato do contexto
        const agendamentosCarregados = appointmentsResponse.data.map((appointment: Appointment) => {
              const startsAtLocal = dayjs.utc(appointment.starts_at).tz('America/Recife');
          const statusMap: Record<string, Agendamento['status']> = {
            'pending': 'pendente',
            'confirmed': 'confirmado',
            'cancelled': 'desmarcado'
          };
          
          // CORREÇÃO: Converter patient_id para string ao buscar no Map
          const patientIdStr = appointment.patient_id.toString();
          const cliente = clientesMap.get(patientIdStr);
          
          return {
            id: appointment.id.toString(),
            clienteId: patientIdStr,  // ← Usar string convertida
            cliente: cliente?.nome || `Cliente #${appointment.patient_id}`,  // ← Fallback melhorado
            tipo: 'Consulta' as const,
            data: startsAtLocal.toDate(),
            horaInicio: startsAtLocal.format('HH:mm'),
            duracao: appointment.duration_min,
            status: statusMap[appointment.status] || 'pendente'
          };
        });
        
        setClientes(clientesCarregados);
        setAgendamentos(agendamentosCarregados);
        
        // DEBUG: Verificar carregamento
        console.log('🔍 DEBUG: Dados carregados do backend');
        console.log(`   - Clientes: ${clientesCarregados.length}`);
        console.log(`   - Agendamentos: ${agendamentosCarregados.length}`);
        console.log('   - Clientes:', clientesCarregados);
        console.log('   - Agendamentos:', agendamentosCarregados);
        console.log(`✅ ${clientesCarregados.length} clientes e ${agendamentosCarregados.length} agendamentos carregados do backend`);
      } catch (error) {
        console.warn('Erro ao carregar dados do backend:', error);
        // Não exibir erro ao usuário - continua com array vazio
      } finally {
        setIsLoadingAppointments(false);
      }
    };

    loadData();
  }, []); // Executar apenas uma vez na montagem

  const adicionarCliente = (dadosCliente: Omit<Cliente, 'id' | 'dataCadastro'> | Cliente) => {
    // Se o cliente já tem ID e dataCadastro (vindo do backend), usar diretamente
    // Caso contrário, criar ID temporário (edge case - não deveria acontecer em produção)
    const novoCliente: Cliente = 'id' in dadosCliente && 'dataCadastro' in dadosCliente
      ? dadosCliente
      : {
          ...dadosCliente,
          id: Date.now().toString(), // Fallback temporário - clientes devem sempre vir do backend
          dataCadastro: new Date()
        };
    
    // Evitar duplicação: verificar se já existe um cliente com este ID
    setClientes(prev => {
      const jaExiste = prev.some(c => c.id === novoCliente.id);
      if (jaExiste) {
        // Atualizar o existente
        return prev.map(c => c.id === novoCliente.id ? novoCliente : c);
      }
      // Adicionar novo
      return [...prev, novoCliente];
    });
  };

  const buscarClientes = (termo: string): Cliente[] => {
    if (!termo.trim()) return clientes;

    const termoLimpo = termo.toLowerCase().trim();
    return clientes.filter(cliente =>
      cliente.nome.toLowerCase().includes(termoLimpo) ||
      cliente.cpf.replace(/\D/g, '').includes(termoLimpo.replace(/\D/g, ''))
    );
  };

  const adicionarAgendamento = (dadosAgendamento: Omit<Agendamento, 'id'> & { id?: string }) => {
    // Agendamentos devem sempre ter ID do backend (gerado pelo banco de dados)
    // O fallback Date.now() é apenas para casos edge de compatibilidade
    const novoAgendamento: Agendamento = {
      ...dadosAgendamento,
      id: dadosAgendamento.id ?? Date.now().toString() // Fallback - agendamentos devem vir do backend
    };
    
    // Evitar duplicação: verificar se já existe um agendamento com este ID
    setAgendamentos(prev => {
      const jaExiste = prev.some(ag => ag.id === novoAgendamento.id);
      if (jaExiste) {
        // Atualizar o existente (útil para otimistic updates)
        return prev.map(ag => ag.id === novoAgendamento.id ? novoAgendamento : ag);
      }
      // Adicionar novo
      return [...prev, novoAgendamento];
    });
  };

  const atualizarStatusAgendamento = (id: string, novoStatus: Agendamento['status']) => {
    setAgendamentos(prev =>
      prev.map(agendamento =>
        agendamento.id === id
          ? { ...agendamento, status: novoStatus }
          : agendamento
      )
    );
  };

  const desmarcarAgendamento = (id: string) => {
    atualizarStatusAgendamento(id, 'desmarcado');
  };

  const buscarAgendamentosDoCliente = (clienteId: string): Agendamento[] => {
    return agendamentos.filter(agendamento => agendamento.clienteId === clienteId);
  };

  const buscarAgendamentosPorData = (data: Date): Agendamento[] => {
    return agendamentos.filter(agendamento => {
      const agendamentoData = new Date(agendamento.data);
      return agendamentoData.toDateString() === data.toDateString();
    });
  };

  const salvarAnotacaoConsulta = (agendamentoId: string, anotacoes: string, prescriptions?: Prescription[]) => {
    setAgendamentos(prev =>
      prev.map(agendamento =>
        agendamento.id === agendamentoId
          ? { ...agendamento, anotacoes, ...(prescriptions ? { prescriptions } : {}) }
          : agendamento
      )
    );
  };

  const concluirConsulta = (agendamentoId: string, anotacoes?: string, prescriptions?: Prescription[]) => {
    setAgendamentos(prev =>
      prev.map(agendamento =>
        agendamento.id === agendamentoId
          ? { ...agendamento, status: 'concluido', anotacoes: anotacoes || agendamento.anotacoes, ...(prescriptions ? { prescriptions } : {}) }
          : agendamento
      )
    );
  };

  const buscarHistoricoConsultas = (clienteId: string): Agendamento[] => {
    return agendamentos
      .filter(agendamento => agendamento.clienteId === clienteId)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  };

  // Função para buscar próximos agendamentos (do dia atual em diante, limitado a 15)
  const buscarProximosAgendamentos = (): Agendamento[] => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zerar horas para comparar só a data

    return agendamentos
      .filter(agendamento => new Date(agendamento.data) >= hoje)
      .sort((a, b) => {
        // Ordenar por data e depois por hora
        const dataA = new Date(a.data).getTime();
        const dataB = new Date(b.data).getTime();
        if (dataA !== dataB) return dataA - dataB;
        return a.horaInicio.localeCompare(b.horaInicio);
      })
      .slice(0, 15);
  };

  const saveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('alignwork:settings', JSON.stringify(newSettings));
    } catch (error) {
      console.warn('Erro ao salvar configurações no localStorage:', error);
    }
  };

  const valor: AppContextType = {
    clientes,
    agendamentos,
    consultasAnotacoes,
    settings,
    adicionarCliente,
    buscarClientes,
    adicionarAgendamento,
    atualizarStatusAgendamento,
    desmarcarAgendamento,
    buscarAgendamentosPorData,
    buscarProximosAgendamentos,
    buscarAgendamentosDoCliente,
    salvarAnotacaoConsulta,
    concluirConsulta,
    buscarHistoricoConsultas,
    saveSettings
  };

  return (
    <AppContext.Provider value={valor}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
};