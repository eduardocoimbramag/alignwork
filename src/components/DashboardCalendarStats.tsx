import { useDashboardMegaStats } from '@/hooks/useDashboardMegaStats'

function DashboardCalendarStats({ tenantId }: { tenantId: string }) {
    const { data, isLoading, error } = useDashboardMegaStats(tenantId)

    if (isLoading) {
        return (
            <p className="text-sm text-muted-foreground">Carregando estatísticas…</p>
        )
    }

    if (error || !data) {
        return (
            <p className="text-sm text-muted-foreground">Não foi possível carregar as estatísticas.</p>
        )
    }

    return (
        <div className="space-y-1 text-sm text-muted-foreground">
            <div>Hoje — {data.today.confirmed} Confirmadas / {data.today.pending} Pendentes</div>
            <div>Essa semana — {data.week.confirmed} Confirmadas / {data.week.pending} Pendentes</div>
            <div>Esse mês — {data.month.confirmed} Confirmadas / {data.month.pending} Pendentes</div>
            <div>Próximo mês — {data.nextMonth.confirmed} Confirmadas / {data.nextMonth.pending} Pendentes</div>
        </div>
    )
}

export { DashboardCalendarStats }
