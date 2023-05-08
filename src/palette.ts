import type { Context } from './context'

export interface Palette {
  context: Context

  /**
   * Add sample color data
   */
  addSample(sample: string): Promise<Uint8ClampedArray | undefined>
  addSample(sample: HTMLImageElement): Uint8ClampedArray | undefined
  addSample(sample: number[]): Uint8ClampedArray | undefined
  addSample(sample: number[][]): Uint8ClampedArray | undefined
  addSample(sample: Uint8ClampedArray): Uint8ClampedArray | undefined

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
  ): void

  /**
   * Get colors on the palette
   */
  getColors(type: 'rgb'): { color: [number, number, number]; percentage: number }[]
  getColors(type: 'hex'): { color: string; percentage: number }[]
  getColors(type: 'buffer'): Uint8ClampedArray
  getColors(): { color: number; percentage: number }[]

  /**
   * Find the nearest color on the palette
   */
  findNearestColor(color: [number, number, number]): [number, number, number] | undefined
  findNearestColor(color: string): string | undefined
  findNearestColor(color: number): number | undefined
}
