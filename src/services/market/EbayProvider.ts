import type { Card, MarketData } from '@/types'
import type { MarketDataProvider } from './types'

export class EbayProvider implements MarketDataProvider {
  name = 'ebay' as const

  private readonly appId = process.env.EBAY_APP_ID
  private readonly oauthToken = process.env.EBAY_OAUTH_TOKEN

  isAvailable(): boolean {
    return Boolean(this.appId && this.oauthToken)
  }

  async getMarketData(card: Card | { name: string; set?: string }): Promise<Partial<MarketData>> {
    if (!this.isAvailable()) {
      return { sources: [{ provider: 'ebay', available: false, error: 'eBay API not configured' }] }
    }

    try {
      const query = `${card.name} ${(card as Card).set || ''} pokemon card`.trim()
      const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(query)}&category_ids=2536&filter=conditionIds:{3000}&limit=20`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.oauthToken}`,
          'Content-Type': 'application/json',
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_IT',
        },
      })

      if (!response.ok) {
        throw new Error(`eBay API error: ${response.status}`)
      }

      const data = await response.json() as {
        itemSummaries?: Array<{ price?: { value: string } }>
      }
      const items = data.itemSummaries || []
      const prices = items
        .map(item => parseFloat(item.price?.value || '0'))
        .filter(p => p > 0)
        .sort((a, b) => a - b)

      if (prices.length === 0) {
        return { sources: [{ provider: 'ebay', available: true, error: 'No results found' }] }
      }

      const low = prices[0]
      const high = prices[prices.length - 1]
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length

      return {
        ebayAverage: parseFloat(avg.toFixed(2)),
        ebayLow: parseFloat(low.toFixed(2)),
        ebayHigh: parseFloat(high.toFixed(2)),
        currency: 'EUR',
        lastUpdated: new Date().toISOString(),
        sources: [{ provider: 'ebay', available: true }],
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { sources: [{ provider: 'ebay', available: false, error: message }] }
    }
  }
}
