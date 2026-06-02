import { describe, it, expect } from 'vitest'
import { MockProvider } from '../MockProvider'

describe('MockProvider', () => {
  const provider = new MockProvider()

  it('is always available', () => {
    expect(provider.isAvailable()).toBe(true)
  })

  it('returns market data for known card', async () => {
    const data = await provider.getMarketData({ name: 'Charizard' })
    expect(data.ebayAverage).toBeGreaterThan(0)
    expect(data.ebayLow).toBeGreaterThan(0)
    expect(data.ebayHigh).toBeGreaterThanOrEqual(data.ebayAverage!)
    expect(data.currency).toBe('EUR')
  })

  it('returns data for unknown card', async () => {
    const data = await provider.getMarketData({ name: 'UnknownPokemon123' })
    expect(data.ebayAverage).toBeGreaterThan(0)
    expect(data.sources?.[0].provider).toBe('mock')
    expect(data.sources?.[0].available).toBe(true)
  })

  it('has consistent structure', async () => {
    const data = await provider.getMarketData({ name: 'Mewtwo' })
    expect(data).toHaveProperty('ebayAverage')
    expect(data).toHaveProperty('ebayLow')
    expect(data).toHaveProperty('ebayHigh')
    expect(data).toHaveProperty('cardmarketTrend')
    expect(data).toHaveProperty('cardmarketAverage')
    expect(data).toHaveProperty('vintedAverage')
  })
})
