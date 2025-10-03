/**
 * TIPOS PARA CONSULTA E AGENDAMENTO
 * 
 * Este arquivo define os tipos específicos para a funcionalidade
 * de agendamento dentro do modal de consulta.
 */

export type TipoAgendamento = 'Consulta' | 'Retorno' | 'Procedimento' | 'Tratamento';

export interface NovoAgendamento {
    tipo: TipoAgendamento;
    data: Date;
    hora: string; // formato "HH:MM"
    duracao: number; // em minutos
}

export interface HorarioDisponivel {
    hora: string; // formato "HH:MM"
    disponivel: boolean;
}

export interface DisponibilidadeDia {
    data: Date;
    horarios: HorarioDisponivel[];
}

