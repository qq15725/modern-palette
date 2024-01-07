import { rgbUint24ToOklab, rgbaToRgbUint24 } from './utils'
import type { Oklab, QuantizedColors } from './types'

interface FinderLeaf {
  left: number
  right: number
  longest: keyof Oklab
  oklab: Oklab
  index: number
}

export type FinderTree = Array<FinderLeaf>

export class Finder {
  protected _cache = new Map<number, Map<number, number>>()
  protected _tree: FinderTree = []

  constructor(
    protected _premultipliedAlpha: boolean,
    protected _tint: Array<number>,
    colors: QuantizedColors = [],
  ) {
    colors.length && this.update(colors)
  }

  update(colors: QuantizedColors): void {
    colors = colors.sort((a, b) => a.rgbUint24 - b.rgbUint24)

    this._cache.clear()
    const tree: FinderTree = []
    const cache = new Map<number, boolean>()

    for (let prev = -1, len = colors.length, i = 0; i < len; i++) {
      const { rgbUint24 } = colors[i]
      if (rgbUint24 === prev) {
        cache.set(i, true)
        continue
      }
      prev = rgbUint24
    }

    insert({
      min: [-0xFFFF, -0xFFFF, -0xFFFF],
      max: [0xFFFF, 0xFFFF, 0xFFFF],
    })

    this._tree = tree

    function next(minMax: Record<string, any>) {
      const minMax1 = {
        min: [0xFFFF, 0xFFFF, 0xFFFF],
        max: [-0xFFFF, -0xFFFF, -0xFFFF],
      }

      let colorsCount = 0
      const tmp = []

      for (let len = colors.length, i = 0; i < len; i++) {
        const { oklab } = colors[i]
        if (
          cache.has(i)
          || oklab.l < minMax.min[0] || oklab.a < minMax.min[1] || oklab.b < minMax.min[2]
          || oklab.l > minMax.max[0] || oklab.a > minMax.max[1] || oklab.b > minMax.max[2]
        ) continue
        if (oklab.l < minMax1.min[0]) minMax1.min[0] = oklab.l
        if (oklab.a < minMax1.min[1]) minMax1.min[1] = oklab.a
        if (oklab.b < minMax1.min[2]) minMax1.min[2] = oklab.b
        if (oklab.l > minMax1.max[0]) minMax1.max[0] = oklab.l
        if (oklab.a > minMax1.max[1]) minMax1.max[1] = oklab.a
        if (oklab.b > minMax1.max[2]) minMax1.max[2] = oklab.b
        tmp[colorsCount++] = {
          oklab,
          index: i,
        }
      }

      let longest: keyof Oklab = 'l'

      if (!colorsCount) return { index: -1, longest }

      const wL = minMax1.max[0] - minMax1.min[0]
      const wa = minMax1.max[1] - minMax1.min[1]
      const wb = minMax1.max[2] - minMax1.min[2]
      if (wL >= wa && wL >= wb) {
        longest = 'l'
      } else if (wb >= wL && wb >= wa) {
        longest = 'b'
      } else if (wa >= wL && wa >= wb) {
        longest = 'a'
      }

      return {
        index: tmp.sort((a, b) => a.oklab[longest] - b.oklab[longest])[colorsCount >> 1].index,
        longest,
      }
    }

    function insert(minMax: Record<string, any>) {
      const { index, longest } = next(minMax)

      if (index < 0) return -1

      const { oklab } = colors[index]

      const node = {
        left: 0,
        right: 0,
        longest,
        oklab,
        index,
      }

      let longestIndex = 0
      switch (longest) {
        case 'l':
          longestIndex = 0
          break
        case 'a':
          longestIndex = 1
          break
        case 'b':
          longestIndex = 2
          break
      }

      const newIndex = tree.push(node) - 1
      cache.set(newIndex, true)

      const minMax1 = { max: [...minMax.max], min: [...minMax.min] }
      const minMax2 = { max: [...minMax.max], min: [...minMax.min] }
      minMax1.max[longestIndex] = oklab[longest]
      minMax2.min[longestIndex] = Math.min(oklab[longest] + 1, 0xFFFF)

      const left = insert(minMax1)
      let right = -1
      if (minMax2.min[longestIndex] <= minMax2.max[longestIndex]) {
        right = insert(minMax2)
      }

      node.left = left
      node.right = right

      return newIndex
    }
  }

  protected _findNearestIndexToOutput(current: number, target: Oklab, output: { dist: number; index: number }): void {
    const { left, right, longest, oklab, index } = this._tree[current]

    const dist = Math.min(
      (target.l - oklab.l) ** 2
      + (target.a - oklab.a) ** 2
      + (target.b - oklab.b) ** 2,
      0xFFFFFFFF - 1,
    )

    if (dist < output.dist) {
      output.index = index
      output.dist = dist
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
        this._findNearestIndexToOutput(nearer, target, output)
      }

      if (further !== -1 && (dx ** 2) < output.dist) {
        this._findNearestIndexToOutput(further, target, output)
      }
    }
  }

  findNearestIndex(r: number, g: number, b: number, a = 255): number {
    const rgbInt = rgbaToRgbUint24([r, g, b, a], this._premultipliedAlpha, this._tint)
    const key = rgbInt % 32768
    let map = this._cache.get(key)
    if (!map) {
      map = new Map()
      this._cache.set(key, map)
    }
    let index = map.get(rgbInt)
    if (index !== undefined) return index
    const output = {
      dist: Number.MAX_SAFE_INTEGER,
      index: -1,
    }
    this._findNearestIndexToOutput(0, rgbUint24ToOklab(rgbInt), output)
    index = output.index
    map.set(rgbInt, index)
    return index
  }
}
