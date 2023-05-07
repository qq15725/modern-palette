import { sort3id } from './utils'
import type { Context } from './context'
import type { ColorRange } from './types'

export function setupColorRange(colorRange: ColorRange, context: Context): void {
  const { colorCounters } = context
  const { start, end } = colorRange

  const lab: [number, number, number] = [0, 0, 0]
  const er2: [number, number, number] = [0, 0, 0]

  colorRange.length = end - start
  colorRange.weight = 0
  for (let i = start; i < end; i++) {
    const counter = colorCounters[i]
    lab[0] += counter.oklab[0] * counter.count
    lab[1] += counter.oklab[1] * counter.count
    lab[2] += counter.oklab[2] * counter.count
    colorRange.weight += counter.count
  }

  colorRange.oklab = [
    lab[0] / colorRange.weight,
    lab[1] / colorRange.weight,
    lab[2] / colorRange.weight,
  ]

  for (let i = start; i < end; i++) {
    const counter = colorCounters[i]
    const dL = counter.oklab[0] - colorRange.oklab[0]
    const da = counter.oklab[1] - colorRange.oklab[1]
    const db = counter.oklab[2] - colorRange.oklab[2]
    er2[0] += dL * dL * counter.count
    er2[1] += da * da * counter.count
    er2[2] += db * db * counter.count
  }

  colorRange.sort = sort3id(er2[0], er2[1], er2[2])

  colorRange.score = Math.max(er2[0], er2[1], er2[2])
}
