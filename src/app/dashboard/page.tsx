import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import DashboardClient from '@/features/analytics/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Fetch stats server-side
  const { data: scans } = await supabase
    .from('scans')
    .select('id, profit_analysis, recognition_result, listing_price, created_at')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(50)

  const totalScans = scans?.length || 0
  const rois = (scans || [])
    .map(s => (s.profit_analysis as { roi?: number } | null)?.roi || 0)
    .filter(r => r !== 0)

  const averageRoi = rois.length > 0
    ? rois.reduce((a, b) => a + b, 0) / rois.length
    : 0

  const profits = (scans || [])
    .map(s => (s.profit_analysis as { netProfit?: number } | null)?.netProfit || 0)
    .filter(p => p > 0)

  const theoreticalProfit = profits.reduce((a, b) => a + b, 0)

  const bestOpportunities = (scans || [])
    .filter(s => (s.profit_analysis as { roi?: number } | null)?.roi)
    .sort((a, b) => {
      const roiA = (a.profit_analysis as { roi?: number } | null)?.roi || 0
      const roiB = (b.profit_analysis as { roi?: number } | null)?.roi || 0
      return roiB - roiA
    })
    .slice(0, 5)
    .map(s => ({
      scanId: s.id,
      cardName: (s.recognition_result as { name?: string } | null)?.name || 'Carta sconosciuta',
      listingPrice: s.listing_price || 0,
      marketValue: (s.profit_analysis as { marketValue?: number } | null)?.marketValue || 0,
      roi: (s.profit_analysis as { roi?: number } | null)?.roi || 0,
      verdict: ((s.profit_analysis as { verdict?: string } | null)?.verdict || 'PASS') as 'BUY_NOW' | 'GOOD_DEAL' | 'PASS',
      createdAt: s.created_at,
    }))

  return (
    <AppLayout>
      <DashboardClient
        stats={{
          totalScans,
          averageRoi,
          theoreticalProfit,
          bestOpportunities,
        }}
        recentScans={scans || []}
      />
    </AppLayout>
  )
}
