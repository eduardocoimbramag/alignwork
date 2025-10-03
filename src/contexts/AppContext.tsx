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
  adicionarAgendamento: (agendamento: Omit<Agendamento, 'id'>) => void;
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
const clientesIniciais: Cliente[] = [
  {
    id: '1',
    nome: 'Maria Silva',
    telefone: '(11) 99999-9999',
    cpf: '123.456.789-00',
    endereco: 'Rua das Flores, 123 - São Paulo',
    email: 'maria@email.com',
    dataCadastro: new Date('2024-01-15')
  },
  {
    id: '2',
    nome: 'João Santos',
    telefone: '(11) 88888-8888',
    cpf: '987.654.321-00',
    endereco: 'Av. Principal, 456 - São Paulo',
    email: 'joao@email.com',
    dataCadastro: new Date('2024-02-20')
  }
];

const agendamentosIniciais: Agendamento[] = [
  {
    id: '1',
    clienteId: '1',
    cliente: 'Maria Silva',
    tipo: 'Consulta',
    data: new Date(),
    horaInicio: '09:00',
    duracao: 60,
    status: 'confirmado'
  },
  {
    id: '2',
    clienteId: '2',
    cliente: 'João Santos',
    tipo: 'Retorno',
    data: new Date(),
    horaInicio: '10:30',
    duracao: 30,
    status: 'pendente'
  },
  {
    id: '3',
    clienteId: '1',
    cliente: 'Maria Silva',
    tipo: 'Tratamento',
    data: new Date(Date.now() + 24 * 60 * 60 * 1000), // amanhã
    horaInicio: '14:00',
    duracao: 90,
    status: 'confirmado'
  }
];

// Configurações padrão
const settingsIniciais: UserSettings = {
  notificationsEnabled: true,
  emailReminders: true,
  theme: "system",
  language: "pt-br"
};

// Provedor do contexto - componente que vai "envolver" toda a aplicação
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

  // Função para adicionar novo cliente
  const adicionarCliente = (dadosCliente: Omit<Cliente, 'id' | 'dataCadastro'>) => {
    const novoCliente: Cliente = {
      ...dadosCliente,
      id: Date.now().toString(), // ID simples para o MVP
      dataCadastro: new Date()
    };
    setClientes(prev => [...prev, novoCliente]);
  };

  // Função para buscar clientes por nome ou CPF
  const buscarClientes = (termo: string): Cliente[] => {
    if (!termo.trim()) return clientes;

    const termoLimpo = termo.toLowerCase().trim();
    return clientes.filter(cliente =>
      cliente.nome.toLowerCase().includes(termoLimpo) ||
      cliente.cpf.replace(/\D/g, '').includes(termoLimpo.replace(/\D/g, ''))
    );
  };

  // Função para adicionar novo agendamento
  const adicionarAgendamento = (dadosAgendamento: Omit<Agendamento, 'id'>) => {
    const novoAgendamento: Agendamento = {
      ...dadosAgendamento,
      id: Date.now().toString()
    };
    setAgendamentos(prev => [...prev, novoAgendamento]);
  };

  // Função para atualizar status do agendamento (pendente -> confirmado -> concluído)
  const atualizarStatusAgendamento = (id: string, novoStatus: Agendamento['status']) => {
    setAgendamentos(prev =>
      prev.map(agendamento =>
        agendamento.id === id
          ? { ...agendamento, status: novoStatus }
          : agendamento
      )
    );
  };

  // Função para desmarcar agendamento
  const desmarcarAgendamento = (id: string) => {
    atualizarStatusAgendamento(id, 'desmarcado');
  };

  // Função para buscar agendamentos de um cliente específico
  const buscarAgendamentosDoCliente = (clienteId: string): Agendamento[] => {
    return agendamentos.filter(agendamento => agendamento.clienteId === clienteId);
  };

  // Função para buscar agendamentos de uma data específica
  const buscarAgendamentosPorData = (data: Date): Agendamento[] => {
    return agendamentos.filter(agendamento => {
      const agendamentoData = new Date(agendamento.data);
      return agendamentoData.toDateString() === data.toDateString();
    });
  };

  // Função para salvar anotação da consulta
  const salvarAnotacaoConsulta = (agendamentoId: string, anotacoes: string, prescriptions?: Prescription[]) => {
    setAgendamentos(prev =>
      prev.map(agendamento =>
        agendamento.id === agendamentoId
          ? { ...agendamento, anotacoes, ...(prescriptions ? { prescriptions } : {}) }
          : agendamento
      )
    );
  };

  // Função para concluir consulta
  const concluirConsulta = (agendamentoId: string, anotacoes?: string, prescriptions?: Prescription[]) => {
    setAgendamentos(prev =>
      prev.map(agendamento =>
        agendamento.id === agendamentoId
          ? { ...agendamento, status: 'concluido', anotacoes: anotacoes || agendamento.anotacoes, ...(prescriptions ? { prescriptions } : {}) }
          : agendamento
      )
    );
  };

  // Função para buscar histórico de consultas do cliente
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
      .slice(0, 15); // Limitar a 15 itens
  };

  // Função para salvar configurações
  const saveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('alignwork:settings', JSON.stringify(newSettings));
    } catch (error) {
      console.warn('Erro ao salvar configurações no localStorage:', error);
    }
  };

  // Valor que será disponibilizado para toda a aplicação
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

// Hook personalizado para usar o contexto de forma mais fácil
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
};