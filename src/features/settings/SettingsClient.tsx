'use client'

import { useState } from 'react'
import { Save, Loader2, User, Sliders, Cpu, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SettingsRow {
  id: string
  platform_fee_percent: number
  shipping_cost: number
  ebay_weight: number
  cardmarket_weight: number
  vinted_weight: number
  ai_provider: string
  ai_api_key?: string | null
}

interface Props {
  initialSettings: SettingsRow | null
  userEmail: string
}

export default function SettingsClient({ initialSettings, userEmail }: Props) {
  const [platformFee, setPlatformFee] = useState(String(initialSettings?.platform_fee_percent ?? 10))
  const [shippingCost, setShippingCost] = useState(String(initialSettings?.shipping_cost ?? 3.5))
  const [ebayWeight, setEbayWeight] = useState(String(initialSettings?.ebay_weight ?? 0.5))
  const [cardmarketWeight, setCardmarketWeight] = useState(String(initialSettings?.cardmarket_weight ?? 0.3))
  const [vintedWeight, setVintedWeight] = useState(String(initialSettings?.vinted_weight ?? 0.2))
  const [aiProvider, setAiProvider] = useState(initialSettings?.ai_provider ?? 'mock')
  const [aiApiKey, setAiApiKey] = useState(initialSettings?.ai_api_key ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const weightTotal = parseFloat(ebayWeight) + parseFloat(cardmarketWeight) + parseFloat(vintedWeight)
  const isWeightValid = Math.abs(weightTotal - 1) < 0.01

  async function saveSettings() {
    setSaving(true)
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform_fee_percent: parseFloat(platformFee),
        shipping_cost: parseFloat(shippingCost),
        ebay_weight: parseFloat(ebayWeight),
        cardmarket_weight: parseFloat(cardmarketWeight),
        vinted_weight: parseFloat(vintedWeight),
        ai_provider: aiProvider,
        ai_api_key: aiApiKey || null,
      }),
    })

    if (response.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }

    setSaving(false)
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Impostazioni</h1>
        <p className="text-muted-foreground text-sm">Configura il tuo profilo e i parametri di calcolo</p>
      </div>

      {/* Account */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold">{userEmail[0]?.toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{userEmail}</p>
              <p className="text-xs text-muted-foreground">Utente PRO</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ROI Engine Parameters */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sliders className="w-4 h-4 text-muted-foreground" />
            Motore ROI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pfee">Fee Piattaforma (%)</Label>
              <Input
                id="pfee"
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={platformFee}
                onChange={e => setPlatformFee(e.target.value)}
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ship">Costo Spedizione (€)</Label>
              <Input
                id="ship"
                type="number"
                step="0.5"
                min="0"
                value={shippingCost}
                onChange={e => setShippingCost(e.target.value)}
                className="bg-muted/50"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Pesi Calcolo Valore</p>
              <span className={`text-xs px-2 py-0.5 rounded ${isWeightValid ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                Totale: {(weightTotal * 100).toFixed(0)}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="ewt" className="text-xs">eBay</Label>
                <Input
                  id="ewt"
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={ebayWeight}
                  onChange={e => setEbayWeight(e.target.value)}
                  className="bg-muted/50 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cwt" className="text-xs">Cardmkt</Label>
                <Input
                  id="cwt"
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={cardmarketWeight}
                  onChange={e => setCardmarketWeight(e.target.value)}
                  className="bg-muted/50 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="vwt" className="text-xs">Vinted</Label>
                <Input
                  id="vwt"
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={vintedWeight}
                  onChange={e => setVintedWeight(e.target.value)}
                  className="bg-muted/50 text-sm"
                />
              </div>
            </div>
            {!isWeightValid && (
              <p className="text-xs text-red-400">La somma dei pesi deve essere 1.00 (100%)</p>
            )}
          </div>

          <div className="bg-muted/20 rounded-xl p-3 space-y-1">
            <p className="text-xs font-medium flex items-center gap-1">
              <Info className="w-3 h-3" />
              Formula Valore Mercato
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              = eBay×{(parseFloat(ebayWeight) * 100).toFixed(0)}% + Cardmkt×{(parseFloat(cardmarketWeight) * 100).toFixed(0)}% + Vinted×{(parseFloat(vintedWeight) * 100).toFixed(0)}%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Provider */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Cpu className="w-4 h-4 text-muted-foreground" />
            Provider AI / OCR
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Provider</Label>
            <Select value={aiProvider} onValueChange={setAiProvider}>
              <SelectTrigger className="bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mock">Mock (Demo - Gratuito)</SelectItem>
                <SelectItem value="openai">OpenAI GPT-4o Vision</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {aiProvider === 'openai' && (
            <div className="space-y-1">
              <Label htmlFor="aikey">OpenAI API Key</Label>
              <Input
                id="aikey"
                type="password"
                placeholder="sk-..."
                value={aiApiKey}
                onChange={e => setAiApiKey(e.target.value)}
                className="bg-muted/50 font-mono text-sm"
              />
            </div>
          )}
          {aiProvider === 'mock' && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
              <p className="text-xs text-blue-400">
                In modalità Mock, le carte vengono riconosciute con dati simulati realistici.
                Configura OpenAI per il riconoscimento AI reale.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save */}
      <Button
        onClick={saveSettings}
        disabled={saving || !isWeightValid}
        className="w-full"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : saved ? (
          '✓ Salvato!'
        ) : (
          <>
            <Save className="w-4 h-4" />
            Salva Impostazioni
          </>
        )}
      </Button>
    </div>
  )
}
