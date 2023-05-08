import { diffSign } from './utils'
import type { Context } from './context'
import type { ColorNode } from './types'

function cmpFunc(name: number) {
  return (a: any, b: any) => diffSign(a.value[name], b.value[name])
}

export function createColorBoxesIndexTree(context: Context): ColorNode[] {
  const { colorBoxes } = context

  const tree: ColorNode[] = []
  const used = new Map<number, boolean>()

  for (let prevSrgb = -1, len = colorBoxes.length, i = 0; i < len; i++) {
    const { srgb } = colorBoxes[i]
    if (srgb === prevSrgb) {
      used.set(i, true)
      continue
    }
    prevSrgb = srgb
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

    let nbColor = 0
    const tmp = []

    for (let len = colorBoxes.length, i = 0; i < len; i++) {
      const { oklab } = colorBoxes[i]

      if (
        used.has(i)
        || oklab[0] < minMax.min[0] || oklab[1] < minMax.min[1] || oklab[2] < minMax.min[2]
        || oklab[0] > minMax.max[0] || oklab[1] > minMax.max[1] || oklab[2] > minMax.max[2]
      ) continue

      if (oklab[0] < minMax1.min[0]) minMax1.min[0] = oklab[0]
      if (oklab[1] < minMax1.min[1]) minMax1.min[1] = oklab[1]
      if (oklab[2] < minMax1.min[2]) minMax1.min[2] = oklab[2]

      if (oklab[0] > minMax1.max[0]) minMax1.max[0] = oklab[0]
      if (oklab[1] > minMax1.max[1]) minMax1.max[1] = oklab[1]
      if (oklab[2] > minMax1.max[2]) minMax1.max[2] = oklab[2]

      tmp[nbColor] = {
        value: oklab,
        index: i,
      }

      nbColor++
    }
    let longest = 0

    if (!nbColor) return { index: -1, longest }

    /* define longest axis that will be the split component */
    const wL = minMax1.max[0] - minMax1.min[0]
    const wa = minMax1.max[1] - minMax1.min[1]
    const wb = minMax1.max[2] - minMax1.min[2]
    if (wb >= wL && wb >= wa) longest = 2
    if (wa >= wL && wa >= wb) longest = 1
    if (wL >= wa && wL >= wb) longest = 0

    return {
      index: tmp.sort(cmpFunc(longest))[nbColor >> 1].index,
      longest,
    }
  }

  function insert(minMax: Record<string, any>) {
    const { index, longest } = getNext(minMax)

    if (index < 0) return -1

    let left = -1
    let right = -1

    /* create new node with that color */
    const node = {
      longest,
      oklab: colorBoxes[index].oklab,
      colorBoxIndex: index,
    } as ColorNode

    const newIndex = tree.push(node) - 1
    used.set(index, true)

    /* get the two boxes this node creates */
    const minMax1 = { max: [...minMax.max], min: [...minMax.min] }
    const minMax2 = { max: [...minMax.max], min: [...minMax.min] }
    const compValue = node.oklab[longest]
    minMax1.max[longest] = compValue
    minMax2.min[longest] = Math.min(compValue + 1, 0xFFFF)

    left = insert(minMax1)
    if (minMax2.min[longest] <= minMax2.max[longest]) {
      right = insert(minMax2)
    }

    node.left = left
    node.right = right

    return newIndex
  }

  return tree
}

