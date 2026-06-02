import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractVintedListing } from '@/services/ocr/VintedOCRService'
import { getMarketData } from '@/services/market'
import { calculateProfit } from '@/services/profit/ProfitEngine'
import type { ProfitSettings } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json() as { imageUrl: string }
    const { imageUrl } = body

    const listing = await extractVintedListing(imageUrl)

    const { data: settingsData } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const settings: ProfitSettings = settingsData ? {
      platformFeePercent: settingsData.platform_fee_percent,
      shippingCost: settingsData.shipping_cost,
      ebayWeight: settingsData.ebay_weight,
      cardmarketWeight: settingsData.cardmarket_weight,
      vintedWeight: settingsData.vinted_weight,
    } : {
      platformFeePercent: 10,
      shippingCost: 3.5,
      ebayWeight: 0.5,
      cardmarketWeight: 0.3,
      vintedWeight: 0.2,
    }

    let profitAnalysis = null
    let marketData = null

    if (listing.detectedCards && listing.detectedCards.length > 0) {
      const firstCard = listing.detectedCards[0]
      if (firstCard.name) {
        marketData = await getMarketData({ name: firstCard.name })
        profitAnalysis = calculateProfit(listing.listingPrice, marketData, settings)
      }
    } else {
      const nameFromTitle = listing.title
        .replace(/[^a-zA-Z\s]/g, '')
        .split(' ')
        .slice(0, 3)
        .join(' ')

      if (nameFromTitle.trim()) {
        marketData = await getMarketData({ name: nameFromTitle })
        profitAnalysis = calculateProfit(listing.listingPrice, marketData, settings)
      }
    }

    await supabase.from('scans').insert({
      user_id: user.id,
      image_url: imageUrl,
      scan_type: 'vinted_screenshot',
      listing_price: listing.listingPrice,
      market_data: marketData,
      profit_analysis: profitAnalysis,
      status: 'completed',
    })

    return NextResponse.json({ listing, marketData, profitAnalysis })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OCR failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
