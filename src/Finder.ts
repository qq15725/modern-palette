import { rgbToOklab, rgbToRgbInt, rgbaToRgb } from './utils'
import type { Oklab, QuantizedColor } from './types'

interface FinderColorNode {
  left: number
  right: number
  longest: keyof Oklab
  lab: Oklab
  index: number
}

export class Finder {
  protected _cache = new Map<number, Map<number, number>>()
  protected _colorMap: Array<FinderColorNode> = []

  constructor(
    colors: Array<QuantizedColor> = [],
    protected _premultipliedAlpha = false,
    protected _tint = [0xFF, 0xFF, 0xFF],
  ) {
    colors.length && this.setup(colors)
  }

  setup(colors: Array<QuantizedColor>): void {
    colors = colors.sort((a, b) => a.rgbInt - b.rgbInt)

    this._cache.clear()
    const colorMap: Array<FinderColorNode> = []
    const cache = new Map<number, boolean>()

    for (let prev = -1, len = colors.length, i = 0; i < len; i++) {
      const { rgbInt } = colors[i]
      if (rgbInt === prev) {
        cache.set(i, true)
        continue
      }
      prev = rgbInt
    }

    colormapInsert({
      min: [-0xFFFF, -0xFFFF, -0xFFFF],
      max: [0xFFFF, 0xFFFF, 0xFFFF],
    })

    this._colorMap = colorMap

    function getNextColor(minMax: Record<string, any>) {
      const minMax1 = {
        min: [0xFFFF, 0xFFFF, 0xFFFF],
        max: [-0xFFFF, -0xFFFF, -0xFFFF],
      }

      const tmp = []

      for (let len = colors.length, i = 0; i < len; i++) {
        const { lab } = colors[i]
        if (
          cache.has(i)
          || lab.l < minMax.min[0] || lab.a < minMax.min[1] || lab.b < minMax.min[2]
          || lab.l > minMax.max[0] || lab.a > minMax.max[1] || lab.b > minMax.max[2]
        ) continue

        if (lab.l < minMax1.min[0]) minMax1.min[0] = lab.l
        if (lab.a < minMax1.min[1]) minMax1.min[1] = lab.a
        if (lab.b < minMax1.min[2]) minMax1.min[2] = lab.b

        if (lab.l > minMax1.max[0]) minMax1.max[0] = lab.l
        if (lab.a > minMax1.max[1]) minMax1.max[1] = lab.a
        if (lab.b > minMax1.max[2]) minMax1.max[2] = lab.b

        tmp.push({
          lab,
          index: i,
        })
      }

      let longest: keyof Oklab = 'l'
      let longestIndex = 0

      if (!tmp.length) return { index: -1, longest, longestIndex }

      const wL = minMax1.max[0] - minMax1.min[0]
      const wa = minMax1.max[1] - minMax1.min[1]
      const wb = minMax1.max[2] - minMax1.min[2]
      if (wb >= wL && wb >= wa) {
        longest = 'b'
        longestIndex = 2
      }
      if (wa >= wL && wa >= wb) {
        longest = 'a'
        longestIndex = 1
      }
      if (wL >= wa && wL >= wb) {
        longest = 'l'
        longestIndex = 0
      }
      return {
        index: tmp.sort((a, b) => a.lab[longest] - b.lab[longest])[tmp.length >> 1].index,
        longest,
        longestIndex,
      }
    }

    function colormapInsert(minMax: Record<string, any>) {
      const { index, longest, longestIndex } = getNextColor(minMax)

      if (index < 0) return -1
      cache.set(index, true)

      const { lab } = colors[index]

      const node = {
        left: 0,
        right: 0,
        longest,
        lab,
        index,
      }

      const newIndex = colorMap.push(node) - 1

      const minMax1 = { max: [...minMax.max], min: [...minMax.min] }
      const minMax2 = { max: [...minMax.max], min: [...minMax.min] }
      minMax1.max[longestIndex] = lab[longest]
      minMax2.min[longestIndex] = Math.min(lab[longest] + 1, 0xFFFF)

      const left = colormapInsert(minMax1)
      let right = -1
      if (minMax2.min[longestIndex] <= minMax2.max[longestIndex]) {
        right = colormapInsert(minMax2)
      }

      node.left = left
      node.right = right

      return newIndex
    }
  }

  protected _colormapNearestNode(current: number, target: Oklab, output: { dist: number; index: number }): void {
    const { left, right, longest, lab, index } = this._colorMap[current]

    const dist = Math.min(
      (target.l - lab.l) ** 2
      + (target.a - lab.a) ** 2
      + (target.b - lab.b) ** 2,
      0xFFFFFFFF - 1,
    )

    if (dist < output.dist) {
      output.index = index
      output.dist = dist
    }

    let nearer: number
    let further: number

    if (left !== -1 || right !== -1) {
      const dx = target[longest] - lab[longest]

      if (dx <= 0) {
        nearer = left
        further = right
      } else {
        nearer = right
        further = left
      }

      if (nearer !== -1) {
        this._colormapNearestNode(nearer, target, output)
      }

      if (further !== -1 && (dx ** 2) < output.dist) {
        this._colormapNearestNode(further, target, output)
      }
    }
  }

  findNearestIndex(r: number, g: number, b: number, a = 255): number {
    ({ r, g, b } = rgbaToRgb(r, g, b, a, this._premultipliedAlpha, this._tint))
    const rgbInt = rgbToRgbInt(r, g, b)
    const key = rgbInt % 32768
    let map = this._cache.get(key)
    if (!map) {
      this._cache.set(key, map = new Map())
    }
    let index = map.get(rgbInt)
    if (index !== undefined) return index
    const output = {
      dist: Number.MAX_SAFE_INTEGER,
      index: -1,
    }
    this._colormapNearestNode(0, rgbToOklab(r, g, b), output)
    index = output.index
    map.set(rgbInt, index)
    return index
  }
}
