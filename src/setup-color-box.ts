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
    const sample = colorSamples[i]
    lab[0] += sample.oklab[0] * sample.count
    lab[1] += sample.oklab[1] * sample.count
    lab[2] += sample.oklab[2] * sample.count
    box.weight += sample.count
  }
  box.oklab = [
    lab[0] / box.weight,
    lab[1] / box.weight,
    lab[2] / box.weight,
  ]

  for (let i = start; i < end; i++) {
    const sample = colorSamples[i]
    const dL = sample.oklab[0] - box.oklab[0]
    const da = sample.oklab[1] - box.oklab[1]
    const db = sample.oklab[2] - box.oklab[2]
    er2[0] += dL * dL * sample.count
    er2[1] += da * da * sample.count
    er2[2] += db * db * sample.count
  }

  box.sort = sort3id(er2[0], er2[1], er2[2])

  box.score = Math.max(er2[0], er2[1], er2[2])
}
