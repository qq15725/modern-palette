import { setupColorBox } from './setup-color-box'
import type { Context } from './context'
import type { ColorBox } from './types'

export function createColorBox(options: Partial<ColorBox>, context: Context): ColorBox {
  const ColorBox = {
    start: 0,
    end: 0,
    length: 0,
    score: 0,
    weight: 0,
    sort: 'lab',
    sorted: null,
    srgb: 0,
    oklab: [0, 0, 0],
    ...options,
  } as ColorBox

  setupColorBox(ColorBox, context)

  return ColorBox
}
