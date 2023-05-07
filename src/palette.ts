import type { Context } from './context'

export interface Palette {
  context: Context

  /**
   * Add sample color data
   */
  addSample(sample: string): Promise<void>
  addSample(sample: Uint8ClampedArray): void

  /**
   * Generate palette colors from samples
   */
  generate(): void

  /**
   * Get colors on the palette
   */
  getColors(type: 'rgb'): [number, number, number][]
  getColors(type: 'hex'): string[]
  getColors(type: 'buffer'): Uint8ClampedArray
  getColors(): number[]

  /**
   * Find the nearest color on the palette
   */
  findNearestColor(color: [number, number, number]): [number, number, number] | undefined
  findNearestColor(color: string): string | undefined
  findNearestColor(color: number): number | undefined
}
