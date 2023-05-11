export interface Options {
  /**
   * Max colors count
   *
   * @default 256
   */
  maxColors?: number

  /**
   * Sample statistical mode
   *
   * @default 'full'
   */
  statsMode?: 'diff' | 'full'

  /**
   * Samples color data
   */
  samples?: (number[] | number[][] | CanvasImageSource | BufferSource)[]
}
