import { createColorRange } from './create-color-range'
import { setupColorRange } from './setup-color-range'
import { createSorter, oklabToSrgb } from './utils'
import { createColorFinder } from './create-color-finder'
import { createColorNodes } from './create-color-nodes'
import type { ColorRange } from './types'
import type { Context } from './context'

export function generate(context: Context, maxColors: number) {
  context.colorRanges = []

  const {
    colorCounters,
    colorRanges,
  } = context

  let colorRange: ColorRange | null = createColorRange({ end: colorCounters.length }, context)
  let colorRangesCount = 1
  colorRanges.push(colorRange)

  function getNextIndex() {
    let bestIndex = -1
    let maxScore = -1
    if (colorRangesCount === maxColors) return -1
    for (let i = 0; i < colorRangesCount; i++) {
      const range = colorRanges[i]
      if (range.length >= 2 && range.score > maxScore) {
        bestIndex = i
        maxScore = range.score
      }
    }
    return bestIndex
  }

  function split(colorRange: ColorRange, n: number) {
    const newColorRange = createColorRange({
      start: n + 1,
      end: colorRange.end,
      sorted: colorRange.sorted,
    }, context)
    colorRange.end -= (newColorRange.end - newColorRange.start)
    setupColorRange(colorRange, context)
    colorRanges.push(newColorRange)
    colorRangesCount++
  }

  while (colorRange && colorRange.length > 1) {
    const { start, end, weight, sort, sorted } = colorRange

    if (sort !== sorted) {
      const subCounters = colorCounters
        .slice(start, end)
        .sort(createSorter(sort))

      for (let len = subCounters.length, i = 0; i < len; i++) {
        colorCounters[start + i] = subCounters[i]
      }

      colorRange.sorted = sort
    }

    let index = -1
    const median = (weight + 1) >> 1
    for (let weight = 0, len = end - 2, i = start; i < len; i++) {
      weight += colorCounters[i].count
      if (weight > median) {
        index = i
        break
      }
    }
    split(colorRange, index)

    const nextIndex = getNextIndex()
    colorRange = nextIndex >= 0 ? colorRanges[nextIndex] : null
  }

  for (let len = colorRanges.length, i = 0; i < len; i++) {
    const colorRange = colorRanges[i]
    colorRange.color = oklabToSrgb(colorRange.oklab)
  }

  context.finder = createColorFinder(
    createColorNodes(context),
  )
}
