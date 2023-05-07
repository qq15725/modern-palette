import { diffSign } from './utils'
import type { Context } from './context'
import type { ColorNode } from './types'

function cmpFunc(name: number) {
  return (a: any, b: any) => diffSign(a.value[name], b.value[name])
}

export function createColorNodes(context: Context): ColorNode[] {
  const { colorRanges } = context

  const nodes: ColorNode[] = []
  const colorUsed = new Map<number, boolean>()
  let lastColor = 0

  for (let len = colorRanges.length, i = 0; i < len; i++) {
    const color = colorRanges[i].color
    if (i !== 0 && color === lastColor) {
      colorUsed.set(i, true)
      continue
    }
    lastColor = color
  }

  insert({
    min: [-0xFFFF, -0xFFFF, -0xFFFF],
    max: [0xFFFF, 0xFFFF, 0xFFFF],
  })

  function getNext(box: Record<string, any>) {
    const range = {
      min: [0xFFFF, 0xFFFF, 0xFFFF],
      max: [-0xFFFF, -0xFFFF, -0xFFFF],
    }

    let nbColor = 0
    const tmp = []

    for (let len = colorRanges.length, i = 0; i < len; i++) {
      const { oklab } = colorRanges[i]

      if (
        colorUsed.has(i)
        || oklab[0] < box.min[0] || oklab[1] < box.min[1] || oklab[2] < box.min[2]
        || oklab[0] > box.max[0] || oklab[1] > box.max[1] || oklab[2] > box.max[2]
      ) continue

      if (oklab[0] < range.min[0]) range.min[0] = oklab[0]
      if (oklab[1] < range.min[1]) range.min[1] = oklab[1]
      if (oklab[2] < range.min[2]) range.min[2] = oklab[2]

      if (oklab[0] > range.max[0]) range.max[0] = oklab[0]
      if (oklab[1] > range.max[1]) range.max[1] = oklab[1]
      if (oklab[2] > range.max[2]) range.max[2] = oklab[2]

      tmp[nbColor] = {
        value: oklab,
        index: i,
      }

      nbColor++
    }
    let longest = 0

    if (!nbColor) return {
      index: -1,
      longest,
    }

    /* define longest axis that will be the split component */
    const wL = range.max[0] - range.min[0]
    const wa = range.max[1] - range.min[1]
    const wb = range.max[2] - range.min[2]
    if (wb >= wL && wb >= wa) longest = 2
    if (wa >= wL && wa >= wb) longest = 1
    if (wL >= wa && wL >= wb) longest = 0

    return {
      index: tmp.sort(cmpFunc(longest))[nbColor >> 1].index,
      longest,
    }
  }

  function insert(box: Record<string, any>) {
    let left = -1
    let right = -1
    const { index, longest } = getNext(box)

    if (index < 0) return -1

    /* create new node with that color */
    const node = {
      longest,
      colorRange: colorRanges[index],
      colorRangeIndex: index,
    } as ColorNode

    const len = nodes.length
    nodes.push(node)

    colorUsed.set(index, true)

    /* get the two boxes this node creates */
    const box1 = { max: [...box.max], min: [...box.min] }
    const box2 = { max: [...box.max], min: [...box.min] }
    const compValue = node.colorRange.oklab[longest]
    box1.max[longest] = compValue
    box2.min[longest] = Math.min(compValue + 1, 0xFFFF)

    left = insert(box1)
    if (box2.min[longest] <= box2.max[longest]) {
      right = insert(box2)
    }

    node.left = left
    node.right = right

    return len
  }

  return nodes
}

