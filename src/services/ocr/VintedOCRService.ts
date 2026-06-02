import type { VintedListing } from '@/types'

export async function extractVintedListing(imageUrl: string): Promise<VintedListing> {
  const aiProvider = process.env.AI_PROVIDER || 'mock'

  if (aiProvider === 'openai' && process.env.OPENAI_API_KEY) {
    return extractWithOpenAI(imageUrl)
  }

  return extractMock(imageUrl)
}

async function extractWithOpenAI(imageUrl: string): Promise<VintedListing> {
  const prompt = `Analyze this Vinted screenshot and extract:
1. The listing price (number only, in euros)
2. The listing title
3. The listing description

If you can see Pokemon cards, also identify:
- Card names visible in the image or description

Respond ONLY with valid JSON:
{
  "listingPrice": number,
  "title": "string",
  "description": "string"
}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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
    throw new Error(`OpenAI OCR error: ${response.status}`)
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>
  }
  const content = data.choices[0]?.message?.content || ''
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to parse OCR response')

  return JSON.parse(jsonMatch[0]) as VintedListing
}

async function extractMock(_imageUrl: string): Promise<VintedListing> {
  await new Promise(r => setTimeout(r, 400))

  const mockListings: VintedListing[] = [
    {
      listingPrice: 25,
      title: 'Lotto carte Pokemon Charizard V + Pikachu VMAX',
      description: '2 carte in ottime condizioni, mai usate. Charizard V Darkness Ablaze e Pikachu VMAX Vivid Voltage. Spedisco in busta rigida.',
    },
    {
      listingPrice: 15,
      title: 'Umbreon VMAX Evolving Skies ITA',
      description: 'Umbreon VMAX 215/203 Secret Rare in condizioni NM. Carta italiana. Spedizione tracciata.',
    },
    {
      listingPrice: 8,
      title: 'Carte Pokemon miste lotto 10 rare',
      description: 'Lotto di 10 carte rare Pokemon, mix di set diversi. Tutte in italiano. Condizioni buone.',
    },
  ]

  return mockListings[Math.floor(Math.random() * mockListings.length)]
}
