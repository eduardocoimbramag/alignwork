import { useDashboardSummary } from '@/hooks/useDashboardSummary'

export function DashboardCalendarCard({ tenantId }: { tenantId: string }) {
    const { data, isLoading, error } = useDashboardSummary(tenantId)

    if (isLoading) return /* <SkeletonCard/> */ null
    if (error || !data) return /* <ErrorCard/> */ null

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-brand-pink/10 to-brand-purple/10">
                <div>
                    <div className="text-sm font-medium">Hoje - {data.today.total} consultas</div>
                    <div className="text-xs text-muted-foreground">
                        {data.today.confirmed} confirmadas, {data.today.pending} pendentes
                    </div>
                </div>
                <div className="w-3 h-3 rounded-full bg-brand-green" />
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-brand-pink/10 to-brand-purple/10">
                <div>
                    <div className="text-sm font-medium">Amanhã - {data.tomorrow.total} consultas</div>
                    <div className="text-xs text-muted-foreground">
                        {data.tomorrow.confirmed} confirmadas, {data.tomorrow.pending} pendentes
                    </div>
                </div>
                <div className="w-3 h-3 rounded-full bg-brand-pink" />
            </div>
        </div>
    )
}
