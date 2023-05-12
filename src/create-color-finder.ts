import { srgbToOklab } from './utils'
import { isContext } from './create-context'
import type { Oklab } from './types'
import type { Palette } from './palette'
import type { Context } from './context'

interface NearestColorNode {
  colorBoxIndex: number
  dist: number
}

export function createColorFinder(palette: Palette | Context) {
  const context = isContext(palette) ? palette : palette.context

  const {
    colorBoxesIndexTree,
    finderCache,
  } = context

  function findNearestNode(current: number, target: Oklab, nearest: NearestColorNode) {
    const { left, right, longest, oklab, colorBoxIndex } = colorBoxesIndexTree[current]

    const dist = Math.min(
      (target[0] - oklab[0]) ** 2
      + (target[1] - oklab[1]) ** 2
      + (target[2] - oklab[2]) ** 2,
      0xFFFFFFFF - 1,
    )

    if (dist < nearest.dist) {
      nearest.colorBoxIndex = colorBoxIndex
      nearest.dist = dist
    }

    let nearer: number
    let further: number

    if (left !== -1 || right !== -1) {
      const dx = target[longest] - oklab[longest]

      if (dx <= 0) {
        nearer = left
        further = right
      } else {
        nearer = right
        further = left
      }

      if (nearer !== -1) {
        findNearestNode(nearer, target, nearest)
      }

      if (further !== -1 && (dx ** 2) < nearest.dist) {
        findNearestNode(further, target, nearest)
      }
    }
  }

  function findNearestColorBoxIndex(target: Oklab) {
    const res: NearestColorNode = {
      dist: Number.MAX_SAFE_INTEGER,
      colorBoxIndex: -1,
    }

    findNearestNode(0, target, res)

    return res.colorBoxIndex
  }

  return (srgb: number) => {
    const key = srgb % 32768

    let map = finderCache.get(key)
    if (!map) {
      map = new Map()
      finderCache.set(key, map)
    }

    let index = map.get(srgb)
    if (index !== undefined) return index

    index = findNearestColorBoxIndex(srgbToOklab(srgb))
    map.set(srgb, index)

    return index
  }
}
