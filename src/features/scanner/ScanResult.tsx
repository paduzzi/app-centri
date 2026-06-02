'use client'

import { RotateCcw, TrendingUp, TrendingDown, Minus, ShoppingCart, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent, getVerdictBg, getVerdictLabel, getVerdictColor } from '@/lib/utils'
import type { CardRecognitionResult, MarketData, ProfitAnalysis, VintedListing, MultiCardScanResult } from '@/types'

type ScanMode = 'card' | 'vinted' | 'multi'

interface ScanResultData {
  mode: ScanMode
  recognition?: CardRecognitionResult
  marketData?: MarketData
  profitAnalysis?: ProfitAnalysis
  listing?: VintedListing
  multiResult?: MultiCardScanResult
}

interface Props {
  result: ScanResultData
  imagePreview: string | null
  onReset: () => void
}

export default function ScanResult({ result, imagePreview, onReset }: Props) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Risultato Analisi</h1>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="w-4 h-4" />
          Nuova
        </Button>
      </div>

      {imagePreview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imagePreview} alt="Scansione" className="w-full rounded-2xl max-h-48 object-contain bg-muted" />
      )}

      {result.mode === 'card' && result.recognition && (
        <SingleCardResult
          recognition={result.recognition}
          marketData={result.marketData}
          profitAnalysis={result.profitAnalysis}
        />
      )}

      {result.mode === 'vinted' && result.listing && (
        <VintedResult
          listing={result.listing}
          marketData={result.marketData}
          profitAnalysis={result.profitAnalysis}
        />
      )}

      {result.mode === 'multi' && result.multiResult && (
        <MultiCardResult result={result.multiResult} />
      )}
    </div>
  )
}

function VerdictBanner({ verdict, roi }: { verdict: 'BUY_NOW' | 'GOOD_DEAL' | 'PASS'; roi: number }) {
  const Icon = verdict === 'BUY_NOW' ? CheckCircle : verdict === 'GOOD_DEAL' ? TrendingUp : AlertTriangle
  return (
    <div className={`rounded-2xl p-4 border ${getVerdictBg(verdict)}`}>
      <div className="flex items-center gap-3">
        <Icon className="w-8 h-8 flex-shrink-0" />
        <div>
          <p className="text-2xl font-bold">{getVerdictLabel(verdict)}</p>
          <p className="text-sm opacity-80">ROI {formatPercent(roi)}</p>
        </div>
      </div>
    </div>
  )
}

function SingleCardResult({
  recognition,
  marketData,
  profitAnalysis,
}: {
  recognition: CardRecognitionResult
  marketData?: MarketData
  profitAnalysis?: ProfitAnalysis
}) {
  return (
    <div className="space-y-4">
      {profitAnalysis && (
        <VerdictBanner verdict={profitAnalysis.verdict} roi={profitAnalysis.roi} />
      )}

      {/* Card Info */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Carta Identificata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-xl font-bold">{recognition.name}</p>
            <p className="text-sm text-muted-foreground">{recognition.set} · #{recognition.cardNumber}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs bg-secondary border border-border rounded px-2 py-0.5">{recognition.rarity}</span>
            <span className="text-xs bg-secondary border border-border rounded px-2 py-0.5">{recognition.language}</span>
            <span className="text-xs bg-secondary border border-border rounded px-2 py-0.5">
              Conf. {(recognition.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </CardContent>
      </Card>

      {marketData && <MarketDataCard data={marketData} />}
      {profitAnalysis && <ProfitCard analysis={profitAnalysis} />}
    </div>
  )
}

function VintedResult({
  listing,
  marketData,
  profitAnalysis,
}: {
  listing: VintedListing
  marketData?: MarketData
  profitAnalysis?: ProfitAnalysis
}) {
  return (
    <div className="space-y-4">
      {profitAnalysis && (
        <VerdictBanner verdict={profitAnalysis.verdict} roi={profitAnalysis.roi} />
      )}

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Annuncio Vinted</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm leading-snug">{listing.title}</p>
            <span className="text-xl font-bold text-primary ml-2 flex-shrink-0">
              {formatCurrency(listing.listingPrice)}
            </span>
          </div>
          {listing.description && (
            <p className="text-xs text-muted-foreground line-clamp-3">{listing.description}</p>
          )}
        </CardContent>
      </Card>

      {marketData && <MarketDataCard data={marketData} />}
      {profitAnalysis && <ProfitCard analysis={profitAnalysis} />}
    </div>
  )
}

function MultiCardResult({ result }: { result: MultiCardScanResult }) {
  const totalVerdict = result.totalRoi > 60 ? 'BUY_NOW' : result.totalRoi >= 30 ? 'GOOD_DEAL' : 'PASS'
  return (
    <div className="space-y-4">
      <VerdictBanner verdict={totalVerdict} roi={result.totalRoi} />

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Riepilogo Lotto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Prezzo Lotto</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(result.listingPrice)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valore Totale</p>
              <p className="text-lg font-bold text-emerald-400">{formatCurrency(result.totalMarketValue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Carte</p>
              <p className="text-lg font-bold">{result.cards.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ROI Totale</p>
              <p className={`text-lg font-bold ${getVerdictColor(totalVerdict)}`}>{formatPercent(result.totalRoi)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {result.cards.map((card, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{card.recognition.name}</p>
                  <p className="text-xs text-muted-foreground">{card.recognition.set}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-emerald-400">{formatCurrency(card.marketData.ebayAverage)}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${getVerdictBg(card.profitAnalysis.verdict)}`}>
                    {getVerdictLabel(card.profitAnalysis.verdict)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function MarketDataCard({ data }: { data: MarketData }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Prezzi di Mercato</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <MarketItem label="eBay Media" value={data.ebayAverage} />
          <MarketItem label="eBay Min" value={data.ebayLow} muted />
          <MarketItem label="eBay Max" value={data.ebayHigh} muted />
        </div>
        <div className="border-t border-border/50 pt-3 grid grid-cols-2 gap-2">
          <MarketItem label="Cardmarket" value={data.cardmarketAverage} />
          <MarketItem label="Vinted Est." value={data.vintedAverage} />
        </div>
      </CardContent>
    </Card>
  )
}

function MarketItem({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${muted ? 'text-muted-foreground' : ''}`}>
        {formatCurrency(value)}
      </p>
    </div>
  )
}

function ProfitCard({ analysis }: { analysis: ProfitAnalysis }) {
  const isPositive = analysis.netProfit > 0

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Analisi Profitto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Prezzo Acquisto</p>
            <p className="text-base font-bold">{formatCurrency(analysis.listingPrice)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valore Mercato</p>
            <p className="text-base font-bold text-emerald-400">{formatCurrency(analysis.marketValue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Profitto Lordo</p>
            <p className={`text-base font-bold ${analysis.grossProfit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(analysis.grossProfit)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Commissioni Totali</p>
            <p className="text-base font-bold text-yellow-400">-{formatCurrency(analysis.fees.totalFees)}</p>
          </div>
        </div>

        <div className="border-t border-border/50 pt-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Profitto Netto</p>
            <p className={`text-2xl font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(analysis.netProfit)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : analysis.netProfit === 0 ? (
              <Minus className="w-5 h-5 text-muted-foreground" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
            <ShoppingCart className="w-4 h-4 text-muted-foreground ml-1" />
          </div>
        </div>

        <div className="bg-muted/30 rounded-xl p-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Fee piattaforma ({analysis.fees.platformFee > 0 ? formatCurrency(analysis.fees.platformFee) : 'N/A'})</span>
            <span>Spedizione ({formatCurrency(analysis.fees.shippingCost)})</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
