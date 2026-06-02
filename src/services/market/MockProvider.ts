import type { Card, MarketData } from '@/types'
import type { MarketDataProvider } from './types'

const MOCK_PRICES: Record<string, { low: number; avg: number; high: number }> = {
  'Charizard': { low: 45, avg: 75, high: 130 },
  'Pikachu': { low: 8, avg: 15, high: 35 },
  'Mewtwo': { low: 20, avg: 40, high: 80 },
  'Rayquaza': { low: 15, avg: 28, high: 55 },
  'Umbreon': { low: 25, avg: 50, high: 95 },
  'Espeon': { low: 20, avg: 42, high: 80 },
  'Lugia': { low: 30, avg: 55, high: 100 },
  'Ho-Oh': { low: 25, avg: 48, high: 90 },
}

function getMockPrice(cardName: string): { low: number; avg: number; high: number } {
  const key = Object.keys(MOCK_PRICES).find(k =>
    cardName.toLowerCase().includes(k.toLowerCase())
  )
  if (key) return MOCK_PRICES[key]

  const seed = cardName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const low = 2 + (seed % 20)
  const avg = low * 1.5 + (seed % 10)
  const high = avg * 1.8 + (seed % 15)
  return { low: parseFloat(low.toFixed(2)), avg: parseFloat(avg.toFixed(2)), high: parseFloat(high.toFixed(2)) }
}

export class MockProvider implements MarketDataProvider {
  name = 'mock' as const

  isAvailable(): boolean {
    return true
  }

  async getMarketData(card: Card | { name: string; set?: string }): Promise<Partial<MarketData>> {
    await new Promise(r => setTimeout(r, 300))

    const prices = getMockPrice(card.name)

    return {
      ebayAverage: prices.avg,
      ebayLow: prices.low,
      ebayHigh: prices.high,
      cardmarketTrend: prices.avg * 0.9,
      cardmarketAverage: prices.avg * 0.85,
      vintedAverage: prices.avg * 0.7,
      currency: 'EUR',
      lastUpdated: new Date().toISOString(),
      sources: [{ provider: 'mock', available: true }],
    }
  }
}
