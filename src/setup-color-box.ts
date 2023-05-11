import { sort3id } from './utils'
import type { Context } from './context'
import type { ColorBox } from './types'

export function setupColorBox(box: ColorBox, context: Context): void {
  const { colorSamples } = context
  const { start, end } = box

  box.length = end - start
  box.weight = 0

  const oklab: [number, number, number] = [0, 0, 0]

  for (let i = start; i < end; i++) {
    const sample = colorSamples[i]
    oklab[0] += sample.oklab[0] * sample.count
    oklab[1] += sample.oklab[1] * sample.count
    oklab[2] += sample.oklab[2] * sample.count
    box.weight += sample.count
  }

  box.oklab = [
    oklab[0] / box.weight,
    oklab[1] / box.weight,
    oklab[2] / box.weight,
  ]

  const dist: [number, number, number] = [0, 0, 0]

  for (let i = start; i < end; i++) {
    const sample = colorSamples[i]
    dist[0] += (sample.oklab[0] - box.oklab[0]) ** 2 * sample.count
    dist[1] += (sample.oklab[1] - box.oklab[1]) ** 2 * sample.count
    dist[2] += (sample.oklab[2] - box.oklab[2]) ** 2 * sample.count
  }

  box.sort = sort3id(dist[0], dist[1], dist[2])

  box.score = Math.max(dist[0], dist[1], dist[2])
}
