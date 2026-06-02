import type { Card, MarketData } from '@/types'
import type { MarketDataProvider } from './types'
import { MockProvider } from './MockProvider'
import { EbayProvider } from './EbayProvider'
import { CardmarketProvider } from './CardmarketProvider'
import { VintedProvider } from './VintedProvider'

const ebay = new EbayProvider()
const cardmarket = new CardmarketProvider()
const vinted = new VintedProvider()
const mock = new MockProvider()

export async function getMarketData(card: Card | { name: string; set?: string }): Promise<MarketData> {
  const [ebayData, cardmarketData, vintedData] = await Promise.all([
    ebay.isAvailable() ? ebay.getMarketData(card) : mock.getMarketData(card),
    cardmarket.isAvailable() ? cardmarket.getMarketData(card) : mock.getMarketData(card),
    vinted.isAvailable() ? vinted.getMarketData(card) : mock.getMarketData(card),
  ])

  const mockData = await mock.getMarketData(card)

  const sources = [
    ...(ebayData.sources || [{ provider: 'mock' as const, available: true }]),
    ...(cardmarketData.sources || [{ provider: 'mock' as const, available: true }]),
    ...(vintedData.sources || [{ provider: 'mock' as const, available: true }]),
  ]

  return {
    cardName: card.name,
    ebayAverage: ebayData.ebayAverage ?? mockData.ebayAverage ?? 0,
    ebayLow: ebayData.ebayLow ?? mockData.ebayLow ?? 0,
    ebayHigh: ebayData.ebayHigh ?? mockData.ebayHigh ?? 0,
    cardmarketTrend: cardmarketData.cardmarketTrend ?? mockData.cardmarketTrend ?? 0,
    cardmarketAverage: cardmarketData.cardmarketAverage ?? mockData.cardmarketAverage ?? 0,
    vintedAverage: vintedData.vintedAverage ?? mockData.vintedAverage ?? 0,
    currency: 'EUR',
    lastUpdated: new Date().toISOString(),
    sources,
  }
}

export { MockProvider, EbayProvider, CardmarketProvider, VintedProvider }
export type { MarketDataProvider }
