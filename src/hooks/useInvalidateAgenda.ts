import { useQueryClient } from '@tanstack/react-query'
import { dayjs } from '@/lib/dayjs'

export function useInvalidateAgenda(tenantId: string) {
    const qc = useQueryClient()
    return (startsAtUTC?: string) => {
        if (startsAtUTC) {
            const dayKey = dayjs(startsAtUTC).format('YYYY-MM-DD')
            qc.invalidateQueries({ queryKey: ['appointmentsByDay', tenantId, dayKey] })
        }
        qc.invalidateQueries({ queryKey: ['dashboardSummary', tenantId] })
        qc.invalidateQueries({ queryKey: ['calendarMonth', tenantId] }) // se existir
    }
}
