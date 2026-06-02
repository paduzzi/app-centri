import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import WatchlistClient from '@/features/watchlist/WatchlistClient'

interface WatchlistRow {
  id: string
  target_buy_price: number
  current_market_value: number | null
  notes: string | null
  created_at: string
  cards: {
    id: string
    name: string
    set: string
    card_number: string
    rarity: string
    language: string
    image_url: string | null
  } | null
}

export default async function WatchlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: watchlist } = await supabase
    .from('watchlists')
    .select(`
      id,
      target_buy_price,
      current_market_value,
      notes,
      created_at,
      cards (
        id,
        name,
        set,
        card_number,
        rarity,
        language,
        image_url
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <AppLayout>
      <WatchlistClient initialItems={(watchlist || []) as unknown as WatchlistRow[]} />
    </AppLayout>
  )
}
