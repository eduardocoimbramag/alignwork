import { useQuery } from '@tanstack/react-query';
import { fetchAppointments } from '@/services/api';
import { dayjs } from '@/lib/dayjs';
import type { Appointment } from '@/types/appointment';
import { CACHE_TIMES } from '@/constants/cache';

const TZ = 'America/Recife';

export function useMonthAppointments(tenantId: string, year: number, month: number) {
    // Início do mês no timezone local
    const monthStart = dayjs()
        .tz(TZ)
        .year(year)
        .month(month)
        .startOf('month')
        .toISOString();

    // Início do próximo mês
    const nextMonthStart = dayjs()
        .tz(TZ)
        .year(year)
        .month(month)
        .add(1, 'month')
        .startOf('month')
        .toISOString();

    return useQuery<Appointment[]>({
        queryKey: ['appointments', tenantId, year, month],
        queryFn: async () => {
            // Buscar com paginação (pageSize grande para pegar mês inteiro)
            const response = await fetchAppointments({
                tenantId,
                from: monthStart,
                to: nextMonthStart,
                page: 1,
                page_size: 100, // Mês raramente terá >100 appointments
            });
            
            // Retornar apenas o array de appointments (backward compatibility)
            return response.data;
        },
        staleTime: CACHE_TIMES.APPOINTMENTS,
        refetchOnWindowFocus: true,
    });
}

