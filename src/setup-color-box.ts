import { sort3id } from './utils'
import type { Context } from './context'
import type { ColorBox } from './types'

export function setupColorBox(box: ColorBox, context: Context): void {
  const { colorSamples } = context
  const { start, end } = box

  const lab: [number, number, number] = [0, 0, 0]
  const er2: [number, number, number] = [0, 0, 0]

  box.length = end - start
  box.weight = 0
  for (let i = start; i < end; i++) {
    const counter = colorSamples[i]
    lab[0] += counter.oklab[0] * counter.count
    lab[1] += counter.oklab[1] * counter.count
    lab[2] += counter.oklab[2] * counter.count
    box.weight += counter.count
  }

  box.oklab = [
    lab[0] / box.weight,
    lab[1] / box.weight,
    lab[2] / box.weight,
  ]

  for (let i = start; i < end; i++) {
    const counter = colorSamples[i]
    const dL = counter.oklab[0] - box.oklab[0]
    const da = counter.oklab[1] - box.oklab[1]
    const db = counter.oklab[2] - box.oklab[2]
    er2[0] += dL * dL * counter.count
    er2[1] += da * da * counter.count
    er2[2] += db * db * counter.count
  }

  box.sort = sort3id(er2[0], er2[1], er2[2])

  box.score = Math.max(er2[0], er2[1], er2[2])
}
