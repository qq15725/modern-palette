import type { Context } from './context'
import type { ColorNode } from './types'

export function createColorBoxesIndexTree(context: Context): ColorNode[] {
  const { colorBoxes } = context

  const tree: ColorNode[] = []
  const usedColorBox = new Map<number, boolean>()

  for (let prev = -1, len = colorBoxes.length, i = 0; i < len; i++) {
    const { srgb } = colorBoxes[i]
    if (srgb === prev) {
      usedColorBox.set(i, true)
      continue
    }
    prev = srgb
  }

  insert({
    min: [-0xFFFF, -0xFFFF, -0xFFFF],
    max: [0xFFFF, 0xFFFF, 0xFFFF],
  })

  function getNext(minMax: Record<string, any>) {
    const minMax1 = {
      min: [0xFFFF, 0xFFFF, 0xFFFF],
      max: [-0xFFFF, -0xFFFF, -0xFFFF],
    }

    let colorsCount = 0
    const tmp = []

    for (let len = colorBoxes.length, i = 0; i < len; i++) {
      const { oklab } = colorBoxes[i]

      if (
        usedColorBox.has(i)
        || oklab[0] < minMax.min[0] || oklab[1] < minMax.min[1] || oklab[2] < minMax.min[2]
        || oklab[0] > minMax.max[0] || oklab[1] > minMax.max[1] || oklab[2] > minMax.max[2]
      ) continue

      if (oklab[0] < minMax1.min[0]) minMax1.min[0] = oklab[0]
      if (oklab[1] < minMax1.min[1]) minMax1.min[1] = oklab[1]
      if (oklab[2] < minMax1.min[2]) minMax1.min[2] = oklab[2]

      if (oklab[0] > minMax1.max[0]) minMax1.max[0] = oklab[0]
      if (oklab[1] > minMax1.max[1]) minMax1.max[1] = oklab[1]
      if (oklab[2] > minMax1.max[2]) minMax1.max[2] = oklab[2]

      tmp[colorsCount++] = {
        oklab,
        colorBoxIndex: i,
      }
    }
    let longest = 0

    if (!colorsCount) return { colorBoxIndex: -1, longest }

    const wL = minMax1.max[0] - minMax1.min[0]
    const wa = minMax1.max[1] - minMax1.min[1]
    const wb = minMax1.max[2] - minMax1.min[2]
    if (wL >= wa && wL >= wb) {
      longest = 0
    } else if (wb >= wL && wb >= wa) {
      longest = 2
    } else if (wa >= wL && wa >= wb) {
      longest = 1
    }

    return {
      colorBoxIndex: tmp.sort((a, b) => a.oklab[longest] - b.oklab[longest])[colorsCount >> 1].colorBoxIndex,
      longest,
    }
  }

  function insert(minMax: Record<string, any>) {
    const { colorBoxIndex, longest } = getNext(minMax)

    if (colorBoxIndex < 0) return -1

    const { oklab } = colorBoxes[colorBoxIndex]

    const node = {
      longest,
      oklab,
      colorBoxIndex,
    } as ColorNode

    const index = tree.push(node) - 1
    usedColorBox.set(colorBoxIndex, true)

    const minMax1 = { max: [...minMax.max], min: [...minMax.min] }
    const minMax2 = { max: [...minMax.max], min: [...minMax.min] }
    minMax1.max[longest] = oklab[longest]
    minMax2.min[longest] = Math.min(oklab[longest] + 1, 0xFFFF)

    const left = insert(minMax1)
    let right = -1
    if (minMax2.min[longest] <= minMax2.max[longest]) {
      right = insert(minMax2)
    }

    node.left = left
    node.right = right

    return index
  }

  return tree
}

