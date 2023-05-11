import { createColorBox } from './create-color-box'
import { setupColorBox } from './setup-color-box'
import { createSorter, oklabToSrgb } from './utils'
import { createColorBoxesIndexTree } from './create-color-boxes-index-tree'
import type { Palette } from './palette'
import type { ColorBox } from './types'
import type { Context } from './context'

export function generate(
  context: Context,
  options: Parameters<Palette['generate']>[0] = {},
) {
  const {
    maxColors: contextMaxColors,
    colorSamples,
  } = context

  const {
    maxColors = contextMaxColors,
    clearSamples = true,
  } = options

  let box: ColorBox | null = createColorBox({ end: colorSamples.length }, context)
  let boxesCount = 1
  const colorBoxes = [box]

  function getNextIndex() {
    let bestIndex = -1
    let maxScore = -1
    if (boxesCount === maxColors) return -1
    for (let i = 0; i < boxesCount; i++) {
      const box = colorBoxes[i]
      if (box.length >= 2 && box.score > maxScore) {
        bestIndex = i
        maxScore = box.score
      }
    }
    return bestIndex
  }

  function split(box: ColorBox, position: number) {
    const newBox = createColorBox({
      start: position + 1,
      end: box.end,
      sorted: box.sorted,
    }, context)
    box.end -= newBox.length
    setupColorBox(box, context)
    colorBoxes.push(newBox)
    boxesCount++
  }

  while (box && box.length > 1) {
    const { start, end, sort, sorted } = box

    if (sort !== sorted) {
      // A lot of time is spent here
      const array = colorSamples.slice(start, end).sort(createSorter(sort))
      for (let len = array.length, i = 0; i < len; i++) {
        colorSamples[start + i] = array[i]
      }
      box.sorted = sort
    }

    const median = (box.weight + 1) >> 1
    let index = start
    let weight = 0
    for (let len = end - 2; index < len; index++) {
      weight += colorSamples[index].count
      if (weight > median) break
    }

    split(box, index)

    const nextIndex = getNextIndex()
    box = nextIndex >= 0 ? colorBoxes[nextIndex] : null
  }

  for (let len = colorBoxes.length, i = 0; i < len; i++) {
    colorBoxes[i].srgb = oklabToSrgb(colorBoxes[i].oklab)
  }

  context.colorBoxes = colorBoxes
    .sort((a, b) => a.srgb - b.srgb)
  context.colorBoxesIndexTree = createColorBoxesIndexTree(context)

  if (clearSamples) {
    context.colorSamples = []
    context.colorSamplesCache.clear()
  }

  context.finderCache.clear()
}
