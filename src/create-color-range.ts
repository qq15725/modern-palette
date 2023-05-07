import { setupColorRange } from './setup-color-range'
import type { Context } from './context'
import type { ColorRange } from './types'

export function createColorRange(options: Partial<ColorRange>, context: Context): ColorRange {
  const colorRange = {
    start: 0,
    end: 0,
    length: 0,
    score: 0,
    weight: 0,
    sort: 'lab',
    sorted: null,
    color: 0x000000,
    oklab: [0, 0, 0],
    ...options,
  } as ColorRange

  setupColorRange(colorRange, context)

  return colorRange
}
