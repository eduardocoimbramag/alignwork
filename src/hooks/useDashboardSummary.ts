import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { dayjs } from '@/lib/dayjs'

const TZ = 'America/Recife'

type Bucket = { total: number; confirmed: number; pending: number }
export type DashboardSummary = { today: Bucket; tomorrow: Bucket }

export function useDashboardSummary(tenantId: string) {
    const fromISO = dayjs().tz(TZ).startOf('day').toISOString()
    const toISO = dayjs().tz(TZ).add(2, 'day').startOf('day').toISOString() // [hoje, amanhã)

    return useQuery({
        queryKey: ['dashboardSummary', tenantId, fromISO, toISO],
        queryFn: async () => {
            const { data } = await api.get<DashboardSummary>('/v1/appointments/summary', {
                params: { tenantId, from: fromISO, to: toISO, tz: TZ },
                headers: { 'Cache-Control': 'no-cache' }
            })
            return data
        },
        staleTime: 30_000,
        refetchOnWindowFocus: true
    })
}
