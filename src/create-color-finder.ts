import { getColorFromSrgb } from './utils'
import type { ColorInfo, ColorNode } from './types'

function diff(a: ColorInfo, b: ColorInfo): number {
  const dL = a.lab[0] - b.lab[0]
  const da = a.lab[1] - b.lab[1]
  const db = a.lab[2] - b.lab[2]
  const ret = dL * dL + da * da + db * db
  return Math.min(ret, 0xFFFFFFFF - 1)
}

export interface ColorFinder {
  (color: number): number
}

interface CachedColor {
  color: number
  palEntry: number
}

interface NearestColor {
  nodePos: number
  distSqd: number
}

export function createColorFinder(nodes: ColorNode[]): ColorFinder {
  function findNearestNode(nodePos: number, target: ColorInfo, nearest: NearestColor) {
    const kd = nodes[nodePos]
    const current = kd.c
    const currentToTarget = diff(target, current)

    if (currentToTarget < nearest.distSqd) {
      nearest.nodePos = nodePos
      nearest.distSqd = currentToTarget
    }

    let nearerKdId: number
    let furtherKdId: number

    if (kd.leftId !== -1 || kd.rightId !== -1) {
      const dx = target.lab[kd.split] - current.lab[kd.split]

      if (dx <= 0) {
        nearerKdId = kd.leftId
        furtherKdId = kd.rightId
      } else {
        nearerKdId = kd.rightId
        furtherKdId = kd.leftId
      }

      if (nearerKdId !== -1) {
        findNearestNode(nearerKdId, target, nearest)
      }

      if (furtherKdId !== -1 && dx * dx < nearest.distSqd) {
        findNearestNode(furtherKdId, target, nearest)
      }
    }
  }

  function findNearestPaletteId(target: ColorInfo) {
    const res: NearestColor = {
      distSqd: Number.MAX_SAFE_INTEGER,
      nodePos: -1,
    }
    findNearestNode(0, target, res)
    return nodes[res.nodePos]?.paletteId ?? -1
  }

  const cache = new Map<number, CachedColor[]>()
  const cacheSize = 1 << 15

  return (color: number) => {
    const hash = color % cacheSize

    let cachedColors = cache.get(hash)

    if (cachedColors) {
      const cachedColorsLength = cachedColors.length
      for (let i = 0; i < cachedColorsLength; i++) {
        const cachedColor = cachedColors[i]
        if (cachedColor.color === color) return cachedColor.palEntry
      }
    } else {
      cachedColors = []
      cache.set(hash, cachedColors)
    }

    const cachedColor: CachedColor = {
      color,
      palEntry: findNearestPaletteId(getColorFromSrgb(color)),
    }

    cachedColors.push(cachedColor)

    return cachedColor.palEntry
  }
}
