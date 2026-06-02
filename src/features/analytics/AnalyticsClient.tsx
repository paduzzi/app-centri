'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface Scan {
  id: string
  profit_analysis: unknown
  recognition_result: unknown
  listing_price: number | null
  created_at: string
  scan_type: string
}

export default function AnalyticsClient({ scans }: { scans: Scan[] }) {
  const stats = useMemo(() => {
    const withProfit = scans.filter(s => (s.profit_analysis as { roi?: number } | null)?.roi !== undefined)

    const verdictCounts = { BUY_NOW: 0, GOOD_DEAL: 0, PASS: 0 }
    let totalProfit = 0
    let totalRoi = 0

    withProfit.forEach(s => {
      const p = s.profit_analysis as { verdict?: string; netProfit?: number; roi?: number } | null
      if (p?.verdict) {
        const v = p.verdict as keyof typeof verdictCounts
        if (v in verdictCounts) verdictCounts[v]++
      }
      totalProfit += p?.netProfit || 0
      totalRoi += p?.roi || 0
    })

    const avgRoi = withProfit.length > 0 ? totalRoi / withProfit.length : 0

    // Top cards by profit
    const cardProfits: Record<string, { name: string; totalProfit: number; count: number }> = {}
    withProfit.forEach(s => {
      const rec = s.recognition_result as { name?: string } | null
      const p = s.profit_analysis as { netProfit?: number } | null
      const name = rec?.name || 'Sconosciuta'
      if (!cardProfits[name]) cardProfits[name] = { name, totalProfit: 0, count: 0 }
      cardProfits[name].totalProfit += p?.netProfit || 0
      cardProfits[name].count++
    })

    const topCards = Object.values(cardProfits)
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 5)

    // ROI over time (weekly buckets)
    const weeklyData: Record<string, { week: string; avgRoi: number; count: number; totalRoi: number }> = {}
    withProfit.forEach(s => {
      const date = new Date(s.created_at)
      const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`
      const weekLabel = date.toLocaleDateString('it-IT', { month: 'short', day: 'numeric' })
      if (!weeklyData[weekKey]) weeklyData[weekKey] = { week: weekLabel, avgRoi: 0, count: 0, totalRoi: 0 }
      weeklyData[weekKey].totalRoi += (s.profit_analysis as { roi?: number } | null)?.roi || 0
      weeklyData[weekKey].count++
    })

    const roiOverTime = Object.values(weeklyData).map(d => ({
      week: d.week,
      roi: parseFloat((d.totalRoi / d.count).toFixed(1)),
    }))

    return { verdictCounts, totalProfit, avgRoi, topCards, roiOverTime, totalScans: scans.length }
  }, [scans])

  const verdictData = [
    { name: 'Compra Ora', value: stats.verdictCounts.BUY_NOW, color: '#22c55e' },
    { name: 'Buon Affare', value: stats.verdictCounts.GOOD_DEAL, color: '#eab308' },
    { name: 'Passa', value: stats.verdictCounts.PASS, color: '#ef4444' },
  ].filter(d => d.value > 0)

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm">Statistiche e andamento nel tempo</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Scansioni Totali</p>
          <p className="text-xl font-bold">{stats.totalScans}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground">ROI Medio</p>
          <p className={`text-xl font-bold ${stats.avgRoi > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatPercent(stats.avgRoi)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 col-span-2">
          <p className="text-xs text-muted-foreground">Profitto Netto Teorico Totale</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(stats.totalProfit)}</p>
        </div>
      </div>

      {/* ROI Over Time */}
      {stats.roiOverTime.length > 1 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ROI nel Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stats.roiOverTime} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f1829', border: '1px solid #1e2d45', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v) => [`${v}%`, 'ROI']}
                />
                <Bar dataKey="roi" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Verdicts Distribution */}
      {verdictData.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Distribuzione Verdetti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ResponsiveContainer width="60%" height={140}>
                <PieChart>
                  <Pie
                    data={verdictData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    dataKey="value"
                  >
                    {verdictData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {verdictData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.value} scan</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Cards */}
      {stats.topCards.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Carte Più Redditizie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.topCards.map((card, i) => (
              <div key={card.name} className="flex items-center gap-3 py-1.5 border-b border-border/30 last:border-0">
                <span className="text-xs text-muted-foreground font-mono w-5">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{card.name}</p>
                  <p className="text-xs text-muted-foreground">{card.count} analisi</p>
                </div>
                <span className={`text-sm font-bold ${card.totalProfit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(card.totalProfit)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {scans.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Nessun dato disponibile</p>
          <p className="text-xs mt-1">Inizia a scansionare carte per vedere le statistiche</p>
        </div>
      )}
    </div>
  )
}
