import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { dayjs } from '@/lib/dayjs';
import type { Appointment } from '@/types/appointment';

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

    return useQuery({
        queryKey: ['appointments', tenantId, year, month],
        queryFn: async () => {
            const { data } = await api.get<Appointment[]>('/v1/appointments/', {
                params: {
                    tenantId,
                    from: monthStart,
                    to: nextMonthStart,
                },
                headers: { 'Cache-Control': 'no-cache' }
            });
            return data;
        },
        staleTime: 30_000, // 30 segundos
        refetchOnWindowFocus: true,
    });
}

