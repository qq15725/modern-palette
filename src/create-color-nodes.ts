import { diffSign, getColorFromSrgb, srgbU8ToOklabInt } from './utils'
import type { ColorNode } from './types'

function cmpFunc(name: number) {
  return (a: any, b: any) => diffSign(a.value[name], b.value[name])
}

export function createColorNodes(colors: number[]): ColorNode[] {
  const nodes: ColorNode[] = []
  const length = colors.length

  const colorUsed = new Map<number, boolean>()
  let lastColor = 0

  for (let i = 0; i < length; i++) {
    const c = colors[i]
    if (i !== 0 && c === lastColor) {
      colorUsed.set(i, true)
      continue
    }
    lastColor = c
  }

  insert({
    min: [-0xFFFF, -0xFFFF, -0xFFFF],
    max: [0xFFFF, 0xFFFF, 0xFFFF],
  })

  function getNext(box: Record<string, any>) {
    const ranges = {
      min: [0xFFFF, 0xFFFF, 0xFFFF],
      max: [-0xFFFF, -0xFFFF, -0xFFFF],
    }

    let nbColor = 0
    const tmpPal = []

    for (let i = 0; i < length; i++) {
      const c = colors[i]
      const lab = srgbU8ToOklabInt(c)

      if (
        colorUsed.has(i)
        || lab.l < box.min[0] || lab.a < box.min[1] || lab.b < box.min[2]
        || lab.l > box.max[0] || lab.a > box.max[1] || lab.b > box.max[2]
      ) continue

      if (lab.l < ranges.min[0]) ranges.min[0] = lab.l
      if (lab.a < ranges.min[1]) ranges.min[1] = lab.a
      if (lab.b < ranges.min[2]) ranges.min[2] = lab.b

      if (lab.l > ranges.max[0]) ranges.max[0] = lab.l
      if (lab.a > ranges.max[1]) ranges.max[1] = lab.a
      if (lab.b > ranges.max[2]) ranges.max[2] = lab.b

      tmpPal[nbColor] = {
        value: lab,
        palId: i,
      }

      nbColor++
    }
    let longest = 0

    if (!nbColor) return {
      palId: -1,
      component: longest,
    }

    /* define longest axis that will be the split component */
    const wL = ranges.max[0] - ranges.min[0]
    const wa = ranges.max[1] - ranges.min[1]
    const wb = ranges.max[2] - ranges.min[2]
    if (wb >= wL && wb >= wa) longest = 2
    if (wa >= wL && wa >= wb) longest = 1
    if (wL >= wa && wL >= wb) longest = 0

    return {
      palId: tmpPal.sort(cmpFunc(longest))[nbColor >> 1].palId,
      component: longest,
    }
  }

  function insert(box: Record<string, any>) {
    let nodeLeftId = -1
    let nodeRightId = -1
    const { palId, component } = getNext(box)

    if (palId < 0) return -1

    /* create new node with that color */
    const node = {
      split: component,
      paletteId: palId,
      c: getColorFromSrgb(colors[palId]),
    } as ColorNode

    const index = nodes.length
    nodes.push(node)

    colorUsed.set(palId, true)

    /* get the two boxes this node creates */
    const box1 = { max: [...box.max], min: [...box.min] }
    const box2 = { max: [...box.max], min: [...box.min] }
    const compValue = node.c.lab[component]
    box1.max[component] = compValue
    box2.min[component] = Math.min(compValue + 1, 0xFFFF)

    nodeLeftId = insert(box1)
    if (box2.min[component] <= box2.max[component]) {
      nodeRightId = insert(box2)
    }

    node.leftId = nodeLeftId
    node.rightId = nodeRightId

    return index
  }

  return nodes
}

