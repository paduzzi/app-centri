'use client'

import { useState } from 'react'
import { Eye, Plus, Trash2, TrendingUp, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface WatchlistRow {
  id: string
  target_buy_price: number
  current_market_value: number | null
  notes: string | null
  created_at: string
  cards: {
    id: string
    name: string
    set: string
    card_number: string
    rarity: string
    language: string
    image_url: string | null
  } | null
}

interface Props {
  initialItems: WatchlistRow[]
}

export default function WatchlistClient({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems)
  const [showAdd, setShowAdd] = useState(false)
  const [cardName, setCardName] = useState('')
  const [cardSet, setCardSet] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshingId, setRefreshingId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  async function addToWatchlist() {
    if (!cardName || !targetPrice) return
    setLoading(true)

    // First create the card
    const { data: card, error: cardErr } = await supabase.from('cards').insert({
      name: cardName,
      set: cardSet || '',
      card_number: '',
      rarity: '',
      language: 'IT',
    }).select().single()

    if (cardErr || !card) {
      setLoading(false)
      return
    }

    const { data: watchItem, error: watchErr } = await supabase.from('watchlists').insert({
      card_id: card.id,
      target_buy_price: parseFloat(targetPrice),
      notes: notes || null,
    }).select(`
      id, target_buy_price, current_market_value, notes, created_at,
      cards (id, name, set, card_number, rarity, language, image_url)
    `).single()

    if (!watchErr && watchItem) {
      setItems(prev => [watchItem as unknown as WatchlistRow, ...prev])
      setShowAdd(false)
      setCardName('')
      setCardSet('')
      setTargetPrice('')
      setNotes('')
    }

    setLoading(false)
  }

  async function removeFromWatchlist(id: string) {
    await supabase.from('watchlists').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function refreshPrice(item: WatchlistRow) {
    if (!item.cards?.name) return
    setRefreshingId(item.id)

    const response = await fetch(`/api/market?name=${encodeURIComponent(item.cards.name)}&set=${encodeURIComponent(item.cards.set || '')}`)
    if (response.ok) {
      const data = await response.json() as { ebayAverage?: number }
      const newValue = data.ebayAverage || 0

      await supabase.from('watchlists').update({ current_market_value: newValue }).eq('id', item.id)
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, current_market_value: newValue } : i))
    }

    setRefreshingId(null)
  }

  const totalTargetValue = items.reduce((sum, i) => sum + (i.target_buy_price || 0), 0)
  const totalMarketValue = items.reduce((sum, i) => sum + (i.current_market_value || 0), 0)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Watchlist</h1>
          <p className="text-muted-foreground text-sm">{items.length} carte monitorate</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" />
          Aggiungi
        </Button>
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Target Totale</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(totalTargetValue)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3">
            <p className="text-xs text-muted-foreground">Valore Mercato</p>
            <p className="text-lg font-bold text-emerald-400">{formatCurrency(totalMarketValue)}</p>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAdd && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Aggiungi alla Watchlist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="cname">Nome Carta *</Label>
              <Input
                id="cname"
                placeholder="es. Charizard V"
                value={cardName}
                onChange={e => setCardName(e.target.value)}
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cset">Set</Label>
              <Input
                id="cset"
                placeholder="es. Darkness Ablaze"
                value={cardSet}
                onChange={e => setCardSet(e.target.value)}
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tprice">Prezzo Target (€) *</Label>
              <Input
                id="tprice"
                type="number"
                step="0.01"
                min="0"
                placeholder="es. 20.00"
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="wnotes">Note</Label>
              <Input
                id="wnotes"
                placeholder="Note opzionali..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="bg-muted/50"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addToWatchlist} disabled={loading || !cardName || !targetPrice} className="flex-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aggiungi'}
              </Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>Annulla</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Watchlist Items */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground space-y-2">
          <Eye className="w-12 h-12 mx-auto opacity-30" />
          <p className="text-sm">Nessuna carta nella watchlist</p>
          <Button variant="ghost" onClick={() => setShowAdd(true)} className="text-primary text-sm">
            <Plus className="w-4 h-4" />
            Aggiungi la prima carta
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            if (!item.cards) return null
            const delta = item.current_market_value
              ? ((item.current_market_value - item.target_buy_price) / item.target_buy_price) * 100
              : null

            return (
              <Card key={item.id} className="bg-card border-border">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{item.cards.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.cards.set || 'Set sconosciuto'} · {item.cards.rarity || 'Rarità sconosciuta'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => refreshPrice(item)}
                        disabled={refreshingId === item.id}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                      >
                        {refreshingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => removeFromWatchlist(item.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Target</p>
                      <p className="font-semibold text-primary">{formatCurrency(item.target_buy_price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Mercato</p>
                      <p className="font-semibold text-emerald-400">
                        {item.current_market_value ? formatCurrency(item.current_market_value) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Margine</p>
                      <p className={`font-semibold flex items-center gap-0.5 ${delta && delta > 0 ? 'text-emerald-400' : delta && delta < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                        {delta !== null ? (
                          <>
                            <TrendingUp className="w-3 h-3" />
                            {formatPercent(delta)}
                          </>
                        ) : '—'}
                      </p>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1">{item.notes}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
