import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { CACHE_TIMES } from '@/constants/cache'

type ClientsCountResponse = { count: number }

export function useClientsCount(tenantId?: string, status: 'active' | 'all' = 'active') {
    return useQuery({
        queryKey: ['clientsCount', tenantId, status],
        enabled: !!tenantId,
        queryFn: async () => {
            // Prefer endpoint dedicado de contagem; se não existir, adapte para meta.total
            const { data } = await api.get<ClientsCountResponse>('/api/v1/clients/count', {
                params: { tenantId, status }
            })
            return data
        },
        staleTime: CACHE_TIMES.APPOINTMENTS,
        refetchOnWindowFocus: true
    })
}


