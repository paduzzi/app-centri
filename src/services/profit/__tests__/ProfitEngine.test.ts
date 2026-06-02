import { describe, it, expect } from 'vitest'
import { calculateMarketValue, calculateProfit, getVerdict, DEFAULT_SETTINGS } from '../ProfitEngine'
import type { MarketData } from '@/types'

const mockMarketData: MarketData = {
  cardName: 'Charizard V',
  ebayAverage: 80,
  ebayLow: 60,
  ebayHigh: 120,
  cardmarketTrend: 70,
  cardmarketAverage: 65,
  vintedAverage: 55,
  currency: 'EUR',
  lastUpdated: new Date().toISOString(),
  sources: [{ provider: 'mock', available: true }],
}

describe('ProfitEngine', () => {
  describe('calculateMarketValue', () => {
    it('calculates weighted market value correctly', () => {
      const value = calculateMarketValue(mockMarketData, DEFAULT_SETTINGS)
      // 80 * 0.5 + 65 * 0.3 + 55 * 0.2 = 40 + 19.5 + 11 = 70.5
      expect(value).toBe(70.5)
    })

    it('uses default settings when none provided', () => {
      const value = calculateMarketValue(mockMarketData)
      expect(typeof value).toBe('number')
      expect(value).toBeGreaterThan(0)
    })
  })

  describe('getVerdict', () => {
    it('returns BUY_NOW for ROI > 60%', () => {
      expect(getVerdict(61)).toBe('BUY_NOW')
      expect(getVerdict(100)).toBe('BUY_NOW')
    })

    it('returns GOOD_DEAL for ROI 30-60%', () => {
      expect(getVerdict(30)).toBe('GOOD_DEAL')
      expect(getVerdict(60)).toBe('GOOD_DEAL')
    })

    it('returns PASS for ROI < 30%', () => {
      expect(getVerdict(29)).toBe('PASS')
      expect(getVerdict(0)).toBe('PASS')
      expect(getVerdict(-10)).toBe('PASS')
    })
  })

  describe('calculateProfit', () => {
    it('calculates BUY_NOW for cheap listing', () => {
      const result = calculateProfit(10, mockMarketData, DEFAULT_SETTINGS)
      expect(result.verdict).toBe('BUY_NOW')
      expect(result.marketValue).toBe(70.5)
      expect(result.grossProfit).toBe(60.5)
      expect(result.roi).toBeGreaterThan(60)
    })

    it('calculates PASS for overpriced listing', () => {
      const result = calculateProfit(100, mockMarketData, DEFAULT_SETTINGS)
      expect(result.verdict).toBe('PASS')
      expect(result.netProfit).toBeLessThan(0)
    })

    it('includes fees in calculation', () => {
      const result = calculateProfit(50, mockMarketData, DEFAULT_SETTINGS)
      expect(result.fees.shippingCost).toBe(DEFAULT_SETTINGS.shippingCost)
      expect(result.fees.totalFees).toBe(result.fees.platformFee + result.fees.shippingCost)
      expect(result.netProfit).toBe(result.grossProfit - result.fees.totalFees)
    })

    it('handles zero listing price', () => {
      const result = calculateProfit(0, mockMarketData, DEFAULT_SETTINGS)
      expect(result.roi).toBe(0)
    })
  })
})
