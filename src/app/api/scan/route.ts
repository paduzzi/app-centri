import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRecognitionProvider } from '@/services/recognition'
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
    const body = await request.json() as {
      imageUrl: string
      scanType: 'card' | 'multi_card'
      listingPrice?: number
    }
    const { imageUrl, scanType, listingPrice } = body

    // Get user settings
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

    const provider = getRecognitionProvider()

    if (scanType === 'multi_card') {
      const cards = await provider.recognizeMultiple(imageUrl)
      const results = await Promise.all(
        cards.map(async card => {
          const market = await getMarketData(card)
          const profit = listingPrice
            ? calculateProfit(listingPrice / cards.length, market, settings)
            : calculateProfit(0, market, settings)
          return { recognition: card, marketData: market, profitAnalysis: profit }
        })
      )

      const totalMarketValue = results.reduce((sum, r) => sum + r.marketData.ebayAverage, 0)
      const totalRoi = listingPrice && listingPrice > 0
        ? ((totalMarketValue - listingPrice) / listingPrice) * 100
        : 0

      const scanResult = {
        scan_type: 'multi_card',
        multi_card_results: { cards: results, totalMarketValue, totalRoi, listingPrice: listingPrice || 0 },
      }

      await supabase.from('scans').insert({
        user_id: user.id,
        image_url: imageUrl,
        scan_type: 'multi_card',
        listing_price: listingPrice,
        recognition_result: cards[0],
        market_data: results[0]?.marketData,
        profit_analysis: results[0]?.profitAnalysis,
        status: 'completed',
      })

      return NextResponse.json(scanResult)
    }

    const recognition = await provider.recognize(imageUrl)
    const market = await getMarketData(recognition)
    const profit = listingPrice
      ? calculateProfit(listingPrice, market, settings)
      : calculateProfit(0, market, settings)

    const { data: scan } = await supabase.from('scans').insert({
      user_id: user.id,
      image_url: imageUrl,
      scan_type: scanType || 'card',
      listing_price: listingPrice,
      recognition_result: recognition,
      market_data: market,
      profit_analysis: profit,
      status: 'completed',
    }).select().single()

    return NextResponse.json({
      scan_id: scan?.id,
      recognition,
      marketData: market,
      profitAnalysis: profit,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scan failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
