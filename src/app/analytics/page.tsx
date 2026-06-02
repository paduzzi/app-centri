import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import AnalyticsClient from '@/features/analytics/AnalyticsClient'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: scans } = await supabase
    .from('scans')
    .select('id, profit_analysis, recognition_result, listing_price, created_at, scan_type')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: true })
    .limit(100)

  return (
    <AppLayout>
      <AnalyticsClient scans={scans || []} />
    </AppLayout>
  )
}
