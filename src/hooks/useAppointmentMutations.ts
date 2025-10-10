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
            const body = { ...payload, tenantId, startsAt: startsAtUTC }
            const { data } = await api.post('/api/v1/appointments', body, {
                headers: { 'Cache-Control': 'no-cache' }
            })
            return data
        },
        onSuccess: async (created: any) => {
            invalidate(created?.startsAt) // UTC vindo do back
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
