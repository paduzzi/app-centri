'use client'

import { TrendingUp, Camera, DollarSign, Target, ArrowUpRight, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent, getVerdictBg, getVerdictLabel } from '@/lib/utils'
import type { DashboardStats } from '@/types'
import { RoiChart } from './RoiChart'
import Link from 'next/link'

interface RecentScan {
  id: string
  profit_analysis: unknown
  recognition_result: unknown
  listing_price: number | null
  created_at: string
}

interface Props {
  stats: DashboardStats
  recentScans: RecentScan[]
}

export default function DashboardClient({ stats, recentScans }: Props) {
  const chartData = recentScans
    .filter(s => (s.profit_analysis as { roi?: number } | null)?.roi)
    .slice(0, 10)
    .reverse()
    .map((s, i) => ({
      date: new Date(s.created_at).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' }),
      roi: (s.profit_analysis as { roi?: number } | null)?.roi || 0,
      index: i,
    }))

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Panoramica delle tue opportunità</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Scansioni Totali"
          value={stats.totalScans.toString()}
          icon={<Camera className="w-4 h-4" />}
          color="text-blue-400"
        />
        <StatCard
          label="ROI Medio"
          value={formatPercent(stats.averageRoi)}
          icon={<TrendingUp className="w-4 h-4" />}
          color={stats.averageRoi > 0 ? 'text-emerald-400' : 'text-red-400'}
          positive={stats.averageRoi > 0}
        />
        <StatCard
          label="Profitto Teorico"
          value={formatCurrency(stats.theoreticalProfit)}
          icon={<DollarSign className="w-4 h-4" />}
          color="text-emerald-400"
          colSpan
        />
      </div>

      {/* ROI Chart */}
      {chartData.length > 1 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ROI nel Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <RoiChart data={chartData} />
          </CardContent>
        </Card>
      )}

      {/* Best Opportunities */}
      {stats.bestOpportunities.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Migliori Opportunità</CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.bestOpportunities.map(opp => (
              <div
                key={opp.scanId}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{opp.cardName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(opp.listingPrice)} → {formatCurrency(opp.marketValue)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getVerdictBg(opp.verdict)}`}>
                    {getVerdictLabel(opp.verdict)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">
                    {formatPercent(opp.roi)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Scans */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Scansioni Recenti</CardTitle>
          <Clock className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          {recentScans.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">Nessuna scansione ancora</p>
              <Link href="/scanner" className="text-primary text-sm hover:underline mt-1 inline-block">
                Inizia a scansionare →
              </Link>
            </div>
          ) : (
            recentScans.slice(0, 5).map(scan => {
              const recognition = scan.recognition_result as { name?: string } | null
              const profitAnalysis = scan.profit_analysis as { verdict?: string; roi?: number } | null
              const verdict = (profitAnalysis?.verdict || 'PASS') as 'BUY_NOW' | 'GOOD_DEAL' | 'PASS'
              return (
                <div
                  key={scan.id}
                  className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{recognition?.name || 'Carta sconosciuta'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(scan.created_at).toLocaleDateString('it-IT')}
                      {scan.listing_price ? ` · ${formatCurrency(scan.listing_price)}` : ''}
                    </p>
                  </div>
                  {profitAnalysis?.verdict && (
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded border ${getVerdictBg(verdict)}`}>
                        {getVerdictLabel(verdict)}
                      </span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 pb-4">
        <Link
          href="/scanner"
          className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl p-4 hover:bg-primary/15 transition-colors"
        >
          <div>
            <p className="text-sm font-semibold text-primary">Scansiona</p>
            <p className="text-xs text-muted-foreground">Nuova carta</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-primary" />
        </Link>
        <Link
          href="/analytics"
          className="flex items-center justify-between bg-secondary/50 border border-border rounded-xl p-4 hover:bg-secondary/70 transition-colors"
        >
          <div>
            <p className="text-sm font-semibold">Analytics</p>
            <p className="text-xs text-muted-foreground">Statistiche</p>
          </div>
          <TrendingUp className="w-5 h-5 text-muted-foreground" />
        </Link>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  color,
  positive,
  colSpan,
}: {
  label: string
  value: string
  icon: React.ReactNode
  color: string
  positive?: boolean
  colSpan?: boolean
}) {
  return (
    <div
      className={`bg-card border border-border rounded-xl p-4 space-y-2 ${colSpan ? 'col-span-2' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {positive !== undefined && (
        <p className="text-xs text-muted-foreground">
          {positive ? '↑ In crescita' : '↓ Attenzione'}
        </p>
      )}
    </div>
  )
}
