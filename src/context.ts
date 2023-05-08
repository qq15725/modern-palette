import type { ColorBox, ColorNode, ColorSample, FindedColorBox } from './types'

export interface Context {
  /**
   * Palette sampling
   */
  colorSamples: ColorSample[]
  colorSamplesIndexTree: Map<number, Map<number, number>>

  /**
   * Palettegen
   */
  colorBoxes: ColorBox[]
  colorBoxesIndexTree: ColorNode[]

  /**
   * Paletteuse
   */
  finder?: (srgb: number) => FindedColorBox | undefined
}
