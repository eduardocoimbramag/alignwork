import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * CONTEXTO GLOBAL DA APLICAÇÃO
 * 
 * Este arquivo gerencia todos os dados que precisam ser compartilhados
 * entre diferentes partes do sistema (clientes, agendamentos, etc.)
 * 
 * É como um "banco de dados temporário" que fica na memória
 * enquanto o usuário usa o sistema.
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

// Dados simulados para demonstração (será substituído por dados reais do Supabase)
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

  const adicionarCliente = (dadosCliente: Omit<Cliente, 'id' | 'dataCadastro'>) => {
    const novoCliente: Cliente = {
      ...dadosCliente,
      id: Date.now().toString(), // ID simples para o MVP
      dataCadastro: new Date()
    };
    setClientes(prev => [...prev, novoCliente]);
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
    const novoAgendamento: Agendamento = {
      ...dadosAgendamento,
      id: dadosAgendamento.id ?? Date.now().toString()
    };
    setAgendamentos(prev => [...prev, novoAgendamento]);
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