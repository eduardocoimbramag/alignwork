import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { dayjs } from '@/lib/dayjs'
import { useInvalidateAgenda } from './useInvalidateAgenda'

type CreateInput = {
    tenantId: string
    patientId: string
    startsAtLocal: string   // "YYYY-MM-DD HH:mm" no fuso local
    durationMin: number
    status?: 'pending' | 'confirmed'
}

type UpdateStatusInput = {
    tenantId: string
    appointmentId: string
    status: 'pending' | 'confirmed' | 'cancelled'
    startsAtUTC?: string
}

export function useCreateAppointment(tenantId: string) {
    const invalidate = useInvalidateAgenda(tenantId)
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (payload: Omit<CreateInput, 'tenantId'>) => {
            const startsAtUTC = dayjs.tz(payload.startsAtLocal, 'America/Recife').utc().toISOString()
            
            // Preparar body com campos esperados pelo backend (sem startsAtLocal)
            const body = {
                tenantId,
                patientId: payload.patientId,
                startsAt: startsAtUTC,
                durationMin: payload.durationMin,
                status: payload.status || 'pending'
            }
            
            console.log('📤 Enviando para backend:', body)
            
            try {
                const { data } = await api.post('/api/v1/appointments/', body, {
                    headers: { 'Cache-Control': 'no-cache' }
                })
                console.log('✅ Resposta do backend:', data)
                return data
            } catch (error: any) {
                console.error('❌ Erro do backend:', {
                    status: error?.response?.status,
                    data: error?.response?.data,
                    message: error?.message
                })
                throw error
            }
        },
        onSuccess: async (created: any) => {
            invalidate(created?.starts_at) // UTC vindo do back (snake_case)
            // Refetch imediato dos contadores (evita janelas de race)
            await qc.refetchQueries({ queryKey: ['dashboardMegaStats', tenantId] })
            await qc.refetchQueries({ queryKey: ['dashboardSummary', tenantId] })
        }
    })
}

export function useUpdateAppointmentStatus(tenantId: string) {
    const invalidate = useInvalidateAgenda(tenantId)
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (payload: UpdateStatusInput) => {
            const { data } = await api.patch(`/api/v1/appointments/${payload.appointmentId}`, {
                status: payload.status
            }, { headers: { 'Cache-Control': 'no-cache' } })
            return data
        },
        onSuccess: async (_data, vars) => {
            invalidate(vars.startsAtUTC)
            await qc.refetchQueries({ queryKey: ['dashboardMegaStats', tenantId] })
            await qc.refetchQueries({ queryKey: ['dashboardSummary', tenantId] })
        }
    })
}
