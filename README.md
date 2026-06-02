# Pokémon Flip Hunter Pro

Web app professionale per individuare opportunità di acquisto e rivendita di carte Pokémon. Ottimizzata per iPhone.

## Stack Tecnologico

- **Frontend**: Next.js 15 App Router · React · TypeScript · Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL + Storage + Auth)
- **Deployment**: Vercel
- **Test**: Vitest + Testing Library

## Funzionalità

1. **Scanner Carta** — Fotografa o carica una carta, riconoscimento AI, prezzi di mercato, verdetto ROI
2. **Vinted Analyzer** — Screenshot annuncio Vinted → OCR → analisi profitto automatica
3. **Multi-Card Scanner** — Lotto di carte → valore singolo + ROI totale lotto
4. **Watchlist** — Monitora carte con prezzi target + aggiornamento mercato live
5. **Dashboard** — Statistiche totali, ROI medio, profitto teorico, migliori opportunità
6. **Analytics** — Grafici ROI nel tempo, distribuzione verdetti, top carte

## Setup

### 1. Supabase

1. Crea un progetto su [supabase.com](https://supabase.com)
2. Vai su **SQL Editor** ed esegui il file `supabase/migrations/001_initial_schema.sql`
3. Vai su **Storage** → crea bucket `scan-images` con policy pubblica
4. Copia URL e chiavi API dalle Settings → API

### 2. Variabili d'Ambiente

```bash
cp .env.example .env.local
```

Compila il file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Opzionale: AI reale (senza = usa Mock gratuito)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

### 3. Sviluppo Locale

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

### 4. Deploy su Vercel

1. Importa repo su [vercel.com](https://vercel.com)
2. Aggiungi le variabili d'ambiente nel pannello Vercel
3. Deploy automatico ad ogni push su `main`

## Architettura

```
src/
├── app/                    # Next.js App Router
│   ├── auth/               # Login, Register, Callback
│   ├── dashboard/          # Dashboard principale
│   ├── scanner/            # Scanner carte e screenshot
│   ├── watchlist/          # Watchlist
│   ├── analytics/          # Grafici e statistiche
│   ├── settings/           # Impostazioni utente
│   └── api/                # API Routes (scan, ocr, market, settings)
├── features/
│   ├── analytics/          # Dashboard + grafici
│   ├── scanner/            # UI scanner + risultati
│   ├── watchlist/          # UI watchlist
│   └── settings/           # UI impostazioni
├── services/
│   ├── market/             # MockProvider, EbayProvider, CardmarketProvider
│   ├── recognition/        # MockRecognitionProvider, OpenAIRecognitionProvider
│   ├── ocr/                # VintedOCRService
│   └── profit/             # ProfitEngine (motore ROI)
├── lib/
│   └── supabase/           # Client, Server, Middleware
├── components/
│   ├── ui/                 # Badge, Button, Card, Input, ecc.
│   └── layout/             # AppLayout (nav bottom)
└── types/                  # TypeScript types
```

## Motore ROI

**Formula Valore Mercato:**
```
ValoreMercato = eBay×50% + Cardmarket×30% + Vinted×20%
```

**Verdetti:**
- `COMPRA ORA` — ROI > 60%
- `BUON AFFARE` — ROI 30–60%
- `PASSA` — ROI < 30%

I pesi e le commissioni sono configurabili dalle Impostazioni.

## Provider AI

| Provider | Tipo | Configurazione |
|----------|------|----------------|
| Mock (default) | Simulato | Nessuna — funziona subito |
| OpenAI GPT-4o | Vision AI reale | `OPENAI_API_KEY` |

## Test

```bash
npm test
```

13 test unitari per `ProfitEngine` e `MockProvider`.
