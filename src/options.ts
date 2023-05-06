export interface Options {
  /**
   * Max colors count
   *
   * @default 256
   */
  maxColors?: number

  /**
   * Sample statistical model
   *
   * @default 'full'
   */
  statsMode?: 'diff' | 'full'
}
