import { sort3id } from './utils'
import type { ColorCounter, Lab, SortBy } from './types'

export interface Box {
  color: number
  avg: Lab
  majorAxis: SortBy
  weight: number
  cutScore: number
  start: number
  len: number
  sortedBy: SortBy | null
  setup(): this
}

export function createBox(counters: ColorCounter[]): Box {
  const box = {
    color: 0,
    avg: { l: 0, a: 0, b: 0 },
    majorAxis: 'lab',
    weight: 0,
    cutScore: 0,
    start: 0,
    len: counters.length,
    sortedBy: null,
  } as Box

  box.setup = () => {
    box.weight = 0

    /* Compute average color */
    let sL = 0; let sa = 0; let sb = 0
    const boxLength = box.start + box.len
    for (let i = box.start; i < boxLength; i++) {
      const ref = counters[i]
      sL += ref.lab.l * ref.count
      sa += ref.lab.a * ref.count
      sb += ref.lab.b * ref.count
      box.weight += ref.count
    }
    box.avg = {
      l: sL / box.weight,
      a: sa / box.weight,
      b: sb / box.weight,
    }

    /* Compute squared error of each color channel */
    const er2: [number, number, number] = [0, 0, 0]
    for (let i = box.start; i < boxLength; i++) {
      const ref = counters[i]
      const dL = ref.lab.l - box.avg.l
      const da = ref.lab.a - box.avg.a
      const db = ref.lab.b - box.avg.b
      er2[0] += dL * dL * ref.count
      er2[1] += da * da * ref.count
      er2[2] += db * db * ref.count
    }

    /* Define the best axis candidate for cutting the box */
    box.majorAxis = sort3id(er2[0], er2[1], er2[2])

    /* The box that has the axis with the biggest error amongst all boxes will but cut down */
    box.cutScore = Math.max(er2[0], er2[1], er2[2])

    return box
  }

  return box
}
