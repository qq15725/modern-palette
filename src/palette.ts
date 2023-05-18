import type { Context } from './context'

export interface Palette {
  context: Context

  /**
   * Add sample color data
   */
  addSample(sample: string): Promise<Uint8ClampedArray | undefined>
  addSample(sample: number[] | number[][] | CanvasImageSource | BufferSource): Uint8ClampedArray | undefined

  /**
   * Generate palette colors from samples
   */
  generate(
    options?: {
      /**
       * Max colors count
       *
       * @default 256
       */
      maxColors?: number

      /**
       * Clear samples data
       *
       * @default true
       */
      clearSamples?: boolean
    },
  ): this

  /**
   * Get colors on the palette
   */
  getColors(format: 'rgb'): { value: [number, number, number]; percentage: number }[]
  getColors(format: 'hex'): { value: string; percentage: number }[]
  getColors(format: 'buffer'): Uint8ClampedArray
  getColors(): { value: number; percentage: number }[]

  /**
   * Find the nearest color on the palette
   */
  findNearestColor(color: [number, number, number]): { value: [number, number, number]; index: number } | undefined
  findNearestColor(color: string): { value: string; index: number } | undefined
  findNearestColor(color: number): { value: number; index: number } | undefined

  /**
   * Reset palette
   */
  reset(): void
}
