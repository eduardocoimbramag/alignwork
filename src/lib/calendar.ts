/**
 * UTILITÁRIOS PARA CALENDÁRIO
 * 
 * Funções auxiliares para manipulação de datas no calendário
 * de agendamentos do AlignWork.
 */

import { format } from "date-fns";

/**
 * Converte uma data para chave YYYY-MM-DD para comparações rápidas
 */
export const getDateKey = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

/**
 * Converte uma string YYYY-MM-DD para objeto Date
 */
export const parseDateKey = (dateKey: string): Date => {
  return new Date(dateKey + "T00:00:00");
};

/**
 * Verifica se duas datas são do mesmo dia (ignorando horário)
 */
export const isSameDate = (date1: Date, date2: Date): boolean => {
  return getDateKey(date1) === getDateKey(date2);
};

/**
 * Conta agendamentos por status em uma data específica
 */
export interface AppointmentCounts {
  confirmed: number;
  pending: number;
}

export const countAppointmentsByStatus = (
  appointments: Array<{ status: string }>
): AppointmentCounts => {
  return appointments.reduce(
    (counts, appointment) => {
      if (appointment.status === "confirmado") {
        counts.confirmed++;
      } else if (appointment.status === "pendente") {
        counts.pending++;
      }
      return counts;
    },
    { confirmed: 0, pending: 0 }
  );
};

/**
 * Cria um mapa de contagens por data a partir de uma lista de agendamentos
 */
export const createAppointmentCountsMap = (
  appointments: Array<{ data: Date; status: string }>
): Map<string, AppointmentCounts> => {
  const countsMap = new Map<string, AppointmentCounts>();
  
  appointments.forEach((appointment) => {
    const dateKey = getDateKey(appointment.data);
    const currentCounts = countsMap.get(dateKey) || { confirmed: 0, pending: 0 };
    
    if (appointment.status === "confirmado") {
      currentCounts.confirmed++;
    } else if (appointment.status === "pendente") {
      currentCounts.pending++;
    }
    
    countsMap.set(dateKey, currentCounts);
  });
  
  return countsMap;
};
