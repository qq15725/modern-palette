import { srgbToOklab } from './utils'
import type { ColorNode, Oklab } from './types'

function diff(a: Oklab, b: Oklab): number {
  const dL = a[0] - b[0]
  const da = a[1] - b[1]
  const db = a[2] - b[2]
  const ret = dL * dL + da * da + db * db
  return Math.min(ret, 0xFFFFFFFF - 1)
}

interface CachedColor {
  color: number
  colorRangeIndex: number
}

interface NearestColorNode {
  index: number
  dist: number
}

export function createColorFinder(nodes: ColorNode[]) {
  function findNearestNode(index: number, target: Oklab, nearest: NearestColorNode) {
    const node = nodes[index]
    const current = node.colorRange.oklab
    const currentToTarget = diff(target, current)

    if (currentToTarget < nearest.dist) {
      nearest.index = index
      nearest.dist = currentToTarget
    }

    let nearerKdId: number
    let furtherKdId: number

    if (node.left !== -1 || node.right !== -1) {
      const dx = target[node.longest] - current[node.longest]

      if (dx <= 0) {
        nearerKdId = node.left
        furtherKdId = node.right
      } else {
        nearerKdId = node.right
        furtherKdId = node.left
      }

      if (nearerKdId !== -1) {
        findNearestNode(nearerKdId, target, nearest)
      }

      if (furtherKdId !== -1 && dx * dx < nearest.dist) {
        findNearestNode(furtherKdId, target, nearest)
      }
    }
  }

  function findNearestColorRangeIndex(target: Oklab) {
    const res: NearestColorNode = {
      dist: Number.MAX_SAFE_INTEGER,
      index: -1,
    }
    findNearestNode(0, target, res)
    return nodes[res.index]?.colorRangeIndex ?? -1
  }

  const cache = new Map<number, CachedColor[]>()

  return (color: number) => {
    const hash = color % 32768

    let cachedColors = cache.get(hash)

    if (cachedColors) {
      const cachedColorsLength = cachedColors.length
      for (let i = 0; i < cachedColorsLength; i++) {
        const cachedColor = cachedColors[i]
        if (cachedColor.color === color) return cachedColor.colorRangeIndex
      }
    } else {
      cachedColors = []
      cache.set(hash, cachedColors)
    }

    const cachedColor: CachedColor = {
      color,
      colorRangeIndex: findNearestColorRangeIndex(srgbToOklab(color)),
    }

    cachedColors.push(cachedColor)

    return cachedColor.colorRangeIndex
  }
}
