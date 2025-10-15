import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { CACHE_TIMES } from '@/constants/cache'

export type BucketStats = { confirmed: number; pending: number }
export type MegaStats = {
    today: BucketStats
    week: BucketStats
    month: BucketStats
    nextMonth: BucketStats
}

// O backend calcula tudo baseado no tz e no "agora" local
export function useDashboardMegaStats(tenantId: string, tz = 'America/Recife') {
    return useQuery({
        queryKey: ['dashboardMegaStats', tenantId, tz],
        queryFn: async () => {
            const { data } = await api.get<MegaStats>('/api/v1/appointments/mega-stats', {
                params: { tenantId, tz },
                headers: { 'Cache-Control': 'no-cache' }
            })
            return data
        },
        staleTime: CACHE_TIMES.APPOINTMENTS,
        refetchOnWindowFocus: true
    })
}
