import { srgbToOklab } from './utils'
import { isContext } from './create-context'
import type { Oklab } from './types'
import type { Palette } from './palette'
import type { Context } from './context'

function diff(a: Oklab, b: Oklab): number {
  const dL = a[0] - b[0]
  const da = a[1] - b[1]
  const db = a[2] - b[2]
  const ret = dL * dL + da * da + db * db
  return Math.min(ret, 0xFFFFFFFF - 1)
}

interface NearestColorNode {
  index: number
  dist: number
}

export function createColorFinder(palette: Palette | Context) {
  const context = isContext(palette) ? palette : palette.context

  const { colorBoxesIndexTree: tree } = context

  function findNearestNode(index: number, target: Oklab, nearest: NearestColorNode) {
    const node = tree[index]
    const current = node.oklab
    const currentToTarget = diff(target, current)

    if (currentToTarget < nearest.dist) {
      nearest.index = index
      nearest.dist = currentToTarget
    }

    let nearer: number
    let further: number

    if (node.left !== -1 || node.right !== -1) {
      const dx = target[node.longest] - current[node.longest]

      if (dx <= 0) {
        nearer = node.left
        further = node.right
      } else {
        nearer = node.right
        further = node.left
      }

      if (nearer !== -1) {
        findNearestNode(nearer, target, nearest)
      }

      if (further !== -1 && dx * dx < nearest.dist) {
        findNearestNode(further, target, nearest)
      }
    }
  }

  function findNearestColorBoxIndex(target: Oklab) {
    const res: NearestColorNode = {
      dist: Number.MAX_SAFE_INTEGER,
      index: -1,
    }
    findNearestNode(0, target, res)
    return tree[res.index]?.colorBoxIndex ?? -1
  }

  const cache = new Map<number, number>()
  return (srgb: number) => {
    let index = cache.get(srgb)
    if (index) return index
    index = findNearestColorBoxIndex(srgbToOklab(srgb))
    cache.set(srgb, index)
    return index
  }
}
