import type { Card, MarketData } from '@/types'
import type { MarketDataProvider } from './types'

// Vinted non ha API pubblica ufficiale - questo provider è un adapter mock
// che simula prezzi basandosi su dati realistici di mercato
export class VintedProvider implements MarketDataProvider {
  name = 'vinted' as const

  isAvailable(): boolean {
    // Vinted non offre API ufficiale, restituisce sempre false per usare mock
    return false
  }

  async getMarketData(card: Card | { name: string; set?: string }): Promise<Partial<MarketData>> {
    return {
      sources: [{ provider: 'vinted', available: false, error: 'Vinted public API not available' }],
    }
  }
}
