import type { ColorCounter, ColorRange } from './types'

export interface Context {
  context2d: CanvasRenderingContext2D | null
  colorCounters: ColorCounter[]
  colorCountersIndexMap: Map<number, Map<number, number>>
  colorRanges: ColorRange[]
  previousSample: Uint8ClampedArray | null
  finder?: (color: number) => number
}
