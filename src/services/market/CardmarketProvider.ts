import type { Card, MarketData } from '@/types'
import type { MarketDataProvider } from './types'

export class CardmarketProvider implements MarketDataProvider {
  name = 'cardmarket' as const

  private readonly appToken = process.env.CARDMARKET_APP_TOKEN
  private readonly accessToken = process.env.CARDMARKET_ACCESS_TOKEN

  isAvailable(): boolean {
    return Boolean(this.appToken && this.accessToken)
  }

  async getMarketData(card: Card | { name: string; set?: string }): Promise<Partial<MarketData>> {
    if (!this.isAvailable()) {
      return { sources: [{ provider: 'cardmarket', available: false, error: 'Cardmarket API not configured' }] }
    }

    try {
      const encodedName = encodeURIComponent(card.name)
      const url = `https://api.cardmarket.com/ws/v2.0/output.json/products/${encodedName}/1/1/false`

      const response = await fetch(url, {
        headers: {
          Authorization: this.buildOAuthHeader('GET', url),
        },
      })

      if (!response.ok) {
        throw new Error(`Cardmarket API error: ${response.status}`)
      }

      const data = await response.json() as {
        product?: {
          priceGuide?: {
            TREND: number
            AVG: number
          }
        }
      }
      const product = data.product

      if (!product?.priceGuide) {
        return { sources: [{ provider: 'cardmarket', available: true, error: 'No price data' }] }
      }

      return {
        cardmarketTrend: product.priceGuide.TREND,
        cardmarketAverage: product.priceGuide.AVG,
        currency: 'EUR',
        lastUpdated: new Date().toISOString(),
        sources: [{ provider: 'cardmarket', available: true }],
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { sources: [{ provider: 'cardmarket', available: false, error: message }] }
    }
  }

  private buildOAuthHeader(method: string, url: string): string {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const nonce = Math.random().toString(36).substring(2)

    return [
      'OAuth',
      `realm="${url}"`,
      `oauth_consumer_key="${this.appToken}"`,
      `oauth_token="${this.accessToken}"`,
      `oauth_signature_method="PLAINTEXT"`,
      `oauth_timestamp="${timestamp}"`,
      `oauth_nonce="${nonce}"`,
      `oauth_version="1.0"`,
      `oauth_signature="${process.env.CARDMARKET_APP_SECRET}&${process.env.CARDMARKET_ACCESS_SECRET}"`,
    ].join(',')
  }
}
