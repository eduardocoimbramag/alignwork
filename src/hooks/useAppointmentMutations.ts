import { useMutation } from '@tanstack/react-query'
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
    return useMutation({
        mutationFn: async (payload: Omit<CreateInput, 'tenantId'>) => {
            const startsAtUTC = dayjs.tz(payload.startsAtLocal, 'America/Recife').utc().toISOString()
            const body = { ...payload, tenantId, startsAt: startsAtUTC }
            const { data } = await api.post('/api/v1/appointments', body, {
                headers: { 'Cache-Control': 'no-cache' }
            })
            return data
        },
        onSuccess: (created: any) => invalidate(created?.startsAt) // UTC vindo do back
    })
}

export function useUpdateAppointmentStatus(tenantId: string) {
    const invalidate = useInvalidateAgenda(tenantId)
    return useMutation({
        mutationFn: async (payload: UpdateStatusInput) => {
            const { data } = await api.patch(`/api/v1/appointments/${payload.appointmentId}`, {
                status: payload.status
            }, { headers: { 'Cache-Control': 'no-cache' } })
            return data
        },
        onSuccess: (_data, vars) => invalidate(vars.startsAtUTC)
    })
}
