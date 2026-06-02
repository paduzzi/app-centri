'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, Layers, Image as ImageIcon, Loader2, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import ScanResult from './ScanResult'
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

export default function ScannerClient() {
  const [mode, setMode] = useState<ScanMode>('card')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [listingPrice, setListingPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ScanResultData | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFile = useCallback((file: File) => {
    setImageFile(file)
    setResult(null)
    setError('')
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) handleFile(file)
  }, [handleFile])

  function reset() {
    setImagePreview(null)
    setImageFile(null)
    setResult(null)
    setError('')
    setListingPrice('')
  }

  async function handleScan() {
    if (!imageFile) return

    setLoading(true)
    setError('')

    try {
      // Upload to Supabase Storage
      const fileName = `${Date.now()}-${imageFile.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('scan-images')
        .upload(fileName, imageFile)

      if (uploadError) throw new Error(uploadError.message)

      const { data: { publicUrl } } = supabase.storage
        .from('scan-images')
        .getPublicUrl(uploadData.path)

      const price = listingPrice ? parseFloat(listingPrice) : undefined

      if (mode === 'vinted') {
        const response = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: publicUrl }),
        })
        const data = await response.json() as {
          listing?: VintedListing
          marketData?: MarketData
          profitAnalysis?: ProfitAnalysis
          error?: string
        }
        if (!response.ok) throw new Error(data.error || 'OCR fallito')
        setResult({ mode: 'vinted', listing: data.listing, marketData: data.marketData, profitAnalysis: data.profitAnalysis })
      } else {
        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: publicUrl,
            scanType: mode === 'multi' ? 'multi_card' : 'card',
            listingPrice: price,
          }),
        })
        const data = await response.json() as {
          recognition?: CardRecognitionResult
          marketData?: MarketData
          profitAnalysis?: ProfitAnalysis
          multi_card_results?: MultiCardScanResult
          error?: string
        }
        if (!response.ok) throw new Error(data.error || 'Scansione fallita')

        if (mode === 'multi') {
          setResult({ mode: 'multi', multiResult: data.multi_card_results })
        } else {
          setResult({
            mode: 'card',
            recognition: data.recognition,
            marketData: data.marketData,
            profitAnalysis: data.profitAnalysis,
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la scansione')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return <ScanResult result={result} imagePreview={imagePreview} onReset={reset} />
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Scanner</h1>
        <p className="text-muted-foreground text-sm">Analizza carte Pokémon e opportunità</p>
      </div>

      {/* Mode Tabs */}
      <Tabs value={mode} onValueChange={v => { setMode(v as ScanMode); reset() }}>
        <TabsList className="w-full bg-card border border-border">
          <TabsTrigger value="card" className="flex-1 text-xs">
            <Camera className="w-3.5 h-3.5 mr-1" />
            Carta
          </TabsTrigger>
          <TabsTrigger value="vinted" className="flex-1 text-xs">
            <ImageIcon className="w-3.5 h-3.5 mr-1" />
            Vinted
          </TabsTrigger>
          <TabsTrigger value="multi" className="flex-1 text-xs">
            <Layers className="w-3.5 h-3.5 mr-1" />
            Multi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="card" className="mt-4">
          <ModeDescription
            title="Scansiona Carta"
            desc="Fotografa o carica una singola carta Pokémon per valutarne il prezzo di mercato."
          />
        </TabsContent>
        <TabsContent value="vinted" className="mt-4">
          <ModeDescription
            title="Analizza Annuncio Vinted"
            desc="Carica uno screenshot di un annuncio Vinted. Estrarremo automaticamente prezzo e dati della carta."
          />
        </TabsContent>
        <TabsContent value="multi" className="mt-4">
          <ModeDescription
            title="Lotto Multi-Carta"
            desc="Carica una foto con più carte. Analizzeremo ognuna e calcolerai il ROI del lotto intero."
          />
        </TabsContent>
      </Tabs>

      {/* Upload Area */}
      {!imagePreview ? (
        <div
          className="border-2 border-dashed border-border rounded-2xl p-8 text-center space-y-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
          <div>
            <p className="font-medium text-sm">Tocca per caricare</p>
            <p className="text-xs text-muted-foreground mt-1">o trascina un&apos;immagine qui</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full rounded-2xl max-h-64 object-contain bg-muted"
          />
          <button
            onClick={reset}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 border border-border flex items-center justify-center hover:bg-background transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Camera Button */}
      {!imagePreview && (
        <Button
          variant="outline"
          className="w-full border-border"
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera className="w-4 h-4" />
          Apri Fotocamera
        </Button>
      )}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {/* Listing Price */}
      {imagePreview && mode !== 'vinted' && (
        <div className="space-y-1.5">
          <Label htmlFor="price">Prezzo annuncio (€)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="es. 25.00"
            value={listingPrice}
            onChange={e => setListingPrice(e.target.value)}
            className="bg-muted/50 border-border"
          />
          <p className="text-xs text-muted-foreground">
            Inserisci il prezzo a cui viene venduta la carta per calcolare il ROI
          </p>
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 flex items-center gap-2">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Scan Button */}
      {imagePreview && (
        <Button
          onClick={handleScan}
          disabled={loading}
          className="w-full h-12 text-base font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analisi in corso...
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              {mode === 'vinted' ? 'Analizza Screenshot' : mode === 'multi' ? 'Analizza Lotto' : 'Analizza Carta'}
            </>
          )}
        </Button>
      )}

      {result === null && imagePreview && (
        <Button variant="ghost" onClick={reset} className="w-full text-muted-foreground">
          <RotateCcw className="w-4 h-4" />
          Ricomincia
        </Button>
      )}
    </div>
  )
}

function ModeDescription({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-muted/30 rounded-xl p-3 space-y-1">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  )
}
