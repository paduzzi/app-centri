import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMarketData } from '@/services/market'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const cardName = searchParams.get('name')
  const cardSet = searchParams.get('set') || undefined

  if (!cardName) {
    return NextResponse.json({ error: 'Card name required' }, { status: 400 })
  }

  try {
    const data = await getMarketData({ name: cardName, set: cardSet })
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch market data'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
