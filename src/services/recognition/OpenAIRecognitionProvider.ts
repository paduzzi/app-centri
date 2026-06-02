import type { CardRecognitionResult } from '@/types'
import type { CardRecognitionProvider } from './types'

export class OpenAIRecognitionProvider implements CardRecognitionProvider {
  name = 'openai'

  private readonly apiKey = process.env.OPENAI_API_KEY

  isAvailable(): boolean {
    return Boolean(this.apiKey)
  }

  async recognize(imageUrl: string): Promise<CardRecognitionResult> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key not configured')
    }

    const prompt = `Analyze this Pokemon card image and extract:
- Card name (in Italian if the card is in Italian)
- Set name
- Card number (e.g. 019/189)
- Rarity (Common, Uncommon, Rare, Ultra Rare, Secret Rare, VMAX, V, GX, EX, etc.)
- Language (IT, EN, FR, DE, JP, etc.)

Respond ONLY with valid JSON in this exact format:
{
  "name": "string",
  "set": "string",
  "cardNumber": "string",
  "rarity": "string",
  "language": "string",
  "confidence": number between 0 and 1
}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      const err = await response.json() as { error?: { message?: string } }
      throw new Error(`OpenAI API error: ${err.error?.message || response.status}`)
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>
    }
    const content = data.choices[0]?.message?.content || ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Failed to parse OpenAI response')

    const result = JSON.parse(jsonMatch[0]) as CardRecognitionResult
    return result
  }

  async recognizeMultiple(imageUrl: string): Promise<CardRecognitionResult[]> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key not configured')
    }

    const prompt = `Analyze this image that may contain multiple Pokemon cards.
For EACH card visible, extract:
- Card name
- Set name
- Card number
- Rarity
- Language

Respond ONLY with a valid JSON array:
[
  {
    "name": "string",
    "set": "string",
    "cardNumber": "string",
    "rarity": "string",
    "language": "string",
    "confidence": number
  }
]`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      const err = await response.json() as { error?: { message?: string } }
      throw new Error(`OpenAI API error: ${err.error?.message || response.status}`)
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>
    }
    const content = data.choices[0]?.message?.content || ''
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('Failed to parse OpenAI response')

    return JSON.parse(jsonMatch[0]) as CardRecognitionResult[]
  }
}
