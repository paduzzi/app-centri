import type { CardRecognitionResult } from '@/types'
import type { CardRecognitionProvider } from './types'

const MOCK_CARDS: CardRecognitionResult[] = [
  { name: 'Charizard V', set: 'Darkness Ablaze', cardNumber: '019/189', rarity: 'Ultra Rare', language: 'IT', confidence: 0.95 },
  { name: 'Pikachu VMAX', set: 'Vivid Voltage', cardNumber: '044/185', rarity: 'VMAX', language: 'IT', confidence: 0.92 },
  { name: 'Mewtwo GX', set: 'Hidden Fates', cardNumber: 'SV53/SV94', rarity: 'Shiny', language: 'EN', confidence: 0.88 },
  { name: 'Rayquaza VMAX', set: 'Evolving Skies', cardNumber: '218/203', rarity: 'Secret Rare', language: 'IT', confidence: 0.91 },
  { name: 'Umbreon VMAX', set: 'Evolving Skies', cardNumber: '215/203', rarity: 'Secret Rare', language: 'IT', confidence: 0.94 },
  { name: 'Lugia V', set: 'Silver Tempest', cardNumber: '186/195', rarity: 'Full Art', language: 'IT', confidence: 0.89 },
  { name: 'Gengar VMAX', set: 'Fusion Strike', cardNumber: '271/264', rarity: 'Secret Rare', language: 'IT', confidence: 0.87 },
  { name: 'Espeon VMAX', set: 'Evolving Skies', cardNumber: '209/203', rarity: 'Secret Rare', language: 'IT', confidence: 0.93 },
]

export class MockRecognitionProvider implements CardRecognitionProvider {
  name = 'mock'

  isAvailable(): boolean {
    return true
  }

  async recognize(_imageUrl: string): Promise<CardRecognitionResult> {
    await new Promise(r => setTimeout(r, 500))
    const idx = Math.floor(Math.random() * MOCK_CARDS.length)
    return MOCK_CARDS[idx]
  }

  async recognizeMultiple(_imageUrl: string): Promise<CardRecognitionResult[]> {
    await new Promise(r => setTimeout(r, 800))
    const count = Math.floor(Math.random() * 3) + 1
    const results: CardRecognitionResult[] = []
    const used = new Set<number>()

    while (results.length < count) {
      const idx = Math.floor(Math.random() * MOCK_CARDS.length)
      if (!used.has(idx)) {
        used.add(idx)
        results.push(MOCK_CARDS[idx])
      }
    }

    return results
  }
}
