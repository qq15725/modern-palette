import { createHistogram } from './create-histogram'
import { createBox } from './create-box'
import { IN_BROWSER, createSorter, loadImage, oklabIntToSrgbU8 } from './utils'
import { createColorNodes } from './create-color-nodes'
import { createColorFinder } from './create-color-finder'
import { convertColors } from './convert-colors'
import type { Options } from './options'
import type { Box } from './create-box'
import type { Palette } from './palette'

export function createPalette(options: Options = {}): Palette {
  const {
    maxColors = 256,
    statsMode = 'full',
  } = options

  const histogram = createHistogram(statsMode)

  const canvas = IN_BROWSER
    ? document.createElement('canvas')
    : null

  const context = {
    colors: [] as number[],
    finder: (_color: number) => -1,
    canvas,
    canvasContext: canvas?.getContext('2d'),
  }

  const palette = {} as Palette

  ;(palette as any).addSample = (sample: string | Uint8ClampedArray) => {
    if (typeof sample === 'string') {
      if (!context.canvas || !context.canvasContext) return

      return loadImage(sample).then(img => {
        context.canvas!.width = img.width
        context.canvas!.height = img.height
        context.canvasContext!.drawImage(img, 0, 0)
        histogram.addSample(
          context.canvasContext!.getImageData(0, 0, img.width, img.height).data,
        )
      })
    }

    histogram.addSample(sample)

    return undefined
  }

  palette.generate = () => {
    const counters = histogram.flush()
    let box: Box | null = createBox(counters).setup()
    const boxes = [box]
    let boxesCount = 1

    /**
     * Find the next box to split: pick the one with the highest cut score
     */
    function getNextBoxIdToSplit() {
      let bestBoxId = -1
      let maxScore = -1
      if (boxesCount === maxColors) return -1
      for (let i = 0; i < boxesCount; i++) {
        const box = boxes[i]
        if (box.len >= 2 && box.cutScore > maxScore) {
          bestBoxId = i
          maxScore = box.cutScore
        }
      }
      return bestBoxId
    }

    /**
     * Split given box in two at position n. The original box becomes the left part
     * of the split, and the new index box is the right part.
     */
    function splitBox(box: Box, n: number) {
      const newBox = createBox(counters)
      newBox.start = n + 1
      newBox.len = box.start + box.len - newBox.start
      newBox.sortedBy = box.sortedBy
      boxes.push(newBox)
      boxesCount++
      box.len -= newBox.len
      box.setup()
      newBox.setup()
    }

    while (box && box.len > 1) {
      /* sort the range by its major axis if it's not already sorted */
      if (box.sortedBy !== box.majorAxis) {
        const { start, len } = box
        const subRefs = counters
          .slice(start, start + len)
          .sort(createSorter(box.majorAxis))
        const subRefsLength = subRefs.length
        for (let i = 0; i < subRefsLength; i++) {
          counters[start + i] = subRefs[i]
        }
        box.sortedBy = box.majorAxis
      }

      /* locate the median where to split */
      const median = (box.weight + 1) >> 1

      /* if you have 2 boxes, the maximum is actually #0: you must have at
       * least 1 color on each side of the split, hence the -2 */
      let i: number
      let weight = 0
      const end = box.start + box.len - 2
      for (i = box.start; i < end; i++) {
        weight += counters[i].count
        if (weight > median) break
      }
      splitBox(box, i)

      const boxId = getNextBoxIdToSplit()
      box = boxId >= 0 ? boxes[boxId] : null
    }

    const colors = boxes
      .map(box => oklabIntToSrgbU8(box.avg))
      .sort((a, b) => a - b)

    context.colors = colors
    context.finder = createColorFinder(
      createColorNodes(colors),
    )
  }

  palette.getColors = ((type: any) => convertColors(context.colors, type)) as any

  palette.findNearestColor = (userColor) => {
    let color: number
    if (typeof userColor === 'string') {
      const str = userColor.replace(/^#/, '')
      const arr = [
        `${ str[0] }${ str[1] }`,
        `${ str[2] }${ str[3] }`,
        `${ str[4] }${ str[5] }`,
      ].map(val => parseInt(val, 16))
      color = (arr[0] << 16) | (arr[1] << 8) | arr[2]
    } else if (typeof userColor === 'object' && Array.isArray(userColor)) {
      color = (userColor[0] << 16) | (userColor[1] << 8) | userColor[2]
    } else {
      color = userColor
    }

    const { colors, finder } = context

    const result = colors[finder(color)]

    if (typeof userColor === 'string') {
      const r = (result >> 16 & 0xFF).toString(16).padStart(2, 'f')
      const g = (result >> 8 & 0xFF).toString(16).padStart(2, 'f')
      const b = (result & 0xFF).toString(16).padStart(2, 'f')
      return `#${ r }${ g }${ b }`
    } else if (typeof userColor === 'object' && Array.isArray(userColor)) {
      return [
        result >> 16 & 0xFF,
        result >> 8 & 0xFF,
        result & 0xFF,
      ] as any
    }

    return result
  }

  return palette
}
