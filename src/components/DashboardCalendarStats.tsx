import { useDashboardMegaStats } from '@/hooks/useDashboardMegaStats'
import { Skeleton } from '@/components/ui/skeleton'

function DashboardCalendarStats({ tenantId }: { tenantId: string }) {
    const { data, isLoading, error } = useDashboardMegaStats(tenantId)

    if (isLoading) {
        return (
            <div className="space-y-1.5 mt-2">
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="mt-2 py-2 px-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-xs text-red-600">
                    Não foi possível carregar as estatísticas.
                </p>
            </div>
        )
    }

    const periods = [
        {
            label: 'Hoje',
            confirmed: data.today.confirmed,
            pending: data.today.pending,
            color: 'bg-brand-green',
            gradient: 'from-brand-purple/10 to-brand-pink/10'
        },
        {
            label: 'Essa semana',
            confirmed: data.week.confirmed,
            pending: data.week.pending,
            color: 'bg-brand-purple',
            gradient: 'from-brand-purple/10 to-brand-pink/10'
        },
        {
            label: 'Mês vigente',
            confirmed: data.month.confirmed,
            pending: data.month.pending,
            color: 'bg-brand-purple',
            gradient: 'from-brand-purple/10 to-brand-pink/10'
        },
        {
            label: 'Mês subsequente',
            confirmed: data.nextMonth.confirmed,
            pending: data.nextMonth.pending,
            color: 'bg-brand-purple',
            gradient: 'from-brand-purple/10 to-brand-pink/10'
        }
    ]

    return (
        <div className="space-y-1.5 mt-2">
            {periods.map((period) => (
                <div
                    key={period.label}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg bg-gradient-to-r ${period.gradient} border border-transparent hover:border-brand-purple/20 transition-all duration-200`}
                >
                    <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">
                            {period.label} — {period.confirmed + period.pending} consultas
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                            {period.confirmed} confirmadas, {period.pending} pendentes
                        </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${period.color} flex-shrink-0`} />
                </div>
            ))}
        </div>
    )
}

export { DashboardCalendarStats }
