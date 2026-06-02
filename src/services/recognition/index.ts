import type { CardRecognitionProvider } from './types'
import { MockRecognitionProvider } from './MockRecognitionProvider'
import { OpenAIRecognitionProvider } from './OpenAIRecognitionProvider'

export function getRecognitionProvider(): CardRecognitionProvider {
  const providerName = process.env.AI_PROVIDER || 'mock'

  if (providerName === 'openai') {
    const provider = new OpenAIRecognitionProvider()
    if (provider.isAvailable()) return provider
  }

  return new MockRecognitionProvider()
}

export { MockRecognitionProvider, OpenAIRecognitionProvider }
export type { CardRecognitionProvider }
