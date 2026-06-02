import type { CardRecognitionResult } from '@/types'

export interface CardRecognitionProvider {
  name: string
  isAvailable(): boolean
  recognize(imageUrl: string): Promise<CardRecognitionResult>
  recognizeMultiple(imageUrl: string): Promise<CardRecognitionResult[]>
}
