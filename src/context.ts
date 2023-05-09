import type { Options } from './options'
import type { ColorBox, ColorNode, ColorSample } from './types'

export interface Context extends Required<Options> {
  __CONTEXT__: true

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
}
