import type { ImageSource } from './types'

export interface PaletteOptions {
  /**
   * The maximum number of colors to use in the palette（2 - 256）
   *
   * @default 256
   */
  maxColors?: number

  /**
   * Statistics mode
   *
   * @default 'full'
   */
  statsMode?:
  // Compute full frame histograms
    | 'diff'
  // Compute histograms only for the part that differs from previous frame
    | 'full'

  /**
   * Premultiplied alpha
   *
   * @default false
   */
  premultipliedAlpha?: boolean

  /**
   * Tint
   *
   * @default [0xFF, 0xFF, 0xFF]
   */
  tint?: Array<number>

  /**
   * Algorithm for color Image Quantization
   *
   * @default median-cut
   */
  algorithm?: 'median-cut'

  /**
   * Samples color data
   */
  samples?: Array<ImageSource>
}
