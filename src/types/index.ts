export interface User {
  id: string
  email: string
  created_at: string
}

export interface Card {
  id: string
  user_id: string
  name: string
  set: string
  card_number: string
  rarity: string
  language: string
  image_url?: string
  created_at: string
}

export interface CardRecognitionResult {
  name: string
  set: string
  cardNumber: string
  rarity: string
  language: string
  confidence: number
}

export interface Scan {
  id: string
  user_id: string
  card_id?: string
  image_url: string
  recognition_result?: CardRecognitionResult
  market_data?: MarketData
  profit_analysis?: ProfitAnalysis
  listing_price?: number
  scan_type: 'card' | 'vinted_screenshot' | 'multi_card'
  status: 'pending' | 'processing' | 'completed' | 'error'
  created_at: string
}

export interface MarketData {
  cardName: string
  ebayAverage: number
  ebayLow: number
  ebayHigh: number
  cardmarketTrend: number
  cardmarketAverage: number
  vintedAverage: number
  currency: string
  lastUpdated: string
  sources: MarketSource[]
}

export interface MarketSource {
  provider: 'ebay' | 'cardmarket' | 'vinted' | 'mock'
  available: boolean
  error?: string
}

export interface ProfitAnalysis {
  listingPrice: number
  marketValue: number
  grossProfit: number
  netProfit: number
  roi: number
  verdict: 'BUY_NOW' | 'GOOD_DEAL' | 'PASS'
  fees: ProfitFees
}

export interface ProfitFees {
  platformFee: number
  shippingCost: number
  totalFees: number
}

export interface ProfitSettings {
  platformFeePercent: number
  shippingCost: number
  ebayWeight: number
  cardmarketWeight: number
  vintedWeight: number
}

export interface WatchlistItem {
  id: string
  user_id: string
  card_id: string
  card: Card
  target_buy_price: number
  current_market_value?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  card_id: string
  card: Card
  buy_price: number
  sell_price?: number
  fees: number
  status: 'bought' | 'sold' | 'watching'
  created_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  platform_fee_percent: number
  shipping_cost: number
  ebay_weight: number
  cardmarket_weight: number
  vinted_weight: number
  ai_provider: 'mock' | 'openai' | 'anthropic'
  ai_api_key?: string
  created_at: string
  updated_at: string
}

export interface VintedListing {
  listingPrice: number
  title: string
  description: string
  detectedCards?: Partial<CardRecognitionResult>[]
}

export interface DashboardStats {
  totalScans: number
  averageRoi: number
  theoreticalProfit: number
  bestOpportunities: BestOpportunity[]
}

export interface BestOpportunity {
  scanId: string
  cardName: string
  listingPrice: number
  marketValue: number
  roi: number
  verdict: 'BUY_NOW' | 'GOOD_DEAL' | 'PASS'
  createdAt: string
}

export interface MultiCardScanResult {
  cards: SingleCardResult[]
  totalMarketValue: number
  totalRoi: number
  listingPrice: number
}

export interface SingleCardResult {
  recognition: CardRecognitionResult
  marketData: MarketData
  profitAnalysis: ProfitAnalysis
}
