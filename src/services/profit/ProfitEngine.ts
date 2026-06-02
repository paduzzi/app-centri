import type { MarketData, ProfitAnalysis, ProfitSettings } from '@/types'

export const DEFAULT_SETTINGS: ProfitSettings = {
  platformFeePercent: 10,
  shippingCost: 3.5,
  ebayWeight: 0.5,
  cardmarketWeight: 0.3,
  vintedWeight: 0.2,
}

export function calculateMarketValue(data: MarketData, settings: ProfitSettings = DEFAULT_SETTINGS): number {
  const ebayValue = data.ebayAverage * settings.ebayWeight
  const cardmarketValue = data.cardmarketAverage * settings.cardmarketWeight
  const vintedValue = data.vintedAverage * settings.vintedWeight
  return parseFloat((ebayValue + cardmarketValue + vintedValue).toFixed(2))
}

export function calculateProfit(
  listingPrice: number,
  marketData: MarketData,
  settings: ProfitSettings = DEFAULT_SETTINGS
): ProfitAnalysis {
  const marketValue = calculateMarketValue(marketData, settings)

  const platformFee = parseFloat((marketValue * (settings.platformFeePercent / 100)).toFixed(2))
  const totalFees = parseFloat((platformFee + settings.shippingCost).toFixed(2))

  const grossProfit = parseFloat((marketValue - listingPrice).toFixed(2))
  const netProfit = parseFloat((grossProfit - totalFees).toFixed(2))
  const roi = listingPrice > 0
    ? parseFloat(((netProfit / listingPrice) * 100).toFixed(1))
    : 0

  const verdict = getVerdict(roi)

  return {
    listingPrice,
    marketValue,
    grossProfit,
    netProfit,
    roi,
    verdict,
    fees: {
      platformFee,
      shippingCost: settings.shippingCost,
      totalFees,
    },
  }
}

export function getVerdict(roi: number): 'BUY_NOW' | 'GOOD_DEAL' | 'PASS' {
  if (roi > 60) return 'BUY_NOW'
  if (roi >= 30) return 'GOOD_DEAL'
  return 'PASS'
}
