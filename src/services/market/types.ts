import type { Card, MarketData } from '@/types'

export interface MarketDataProvider {
  name: 'ebay' | 'cardmarket' | 'vinted' | 'mock'
  isAvailable(): boolean
  getMarketData(card: Card | { name: string; set?: string }): Promise<Partial<MarketData>>
}
