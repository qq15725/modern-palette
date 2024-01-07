import { oklabToRgbUint24 } from '../utils'
import type { Color, Colors, Oklab, OklabSort, QuantizedColors } from '../types'

interface Box {
  length: number
  score: number
  weight: number
  oklab: Oklab
  start: number
  end: number
  sort: OklabSort
  sorted: OklabSort | null
}

export class MedianCut implements ReadableWritablePair<QuantizedColors, Colors> {
  static createSorter(sort: OklabSort) {
    const k0 = sort[0] as 'l' | 'a' | 'b'
    const k1 = sort[1] as 'l' | 'a' | 'b'
    const k2 = sort[2] as 'l' | 'a' | 'b'

    return (a: Color, b: Color) => {
      return (a.oklab[k0] - b.oklab[k0])
        || (a.oklab[k1] - b.oklab[k1])
        || (a.oklab[k2] - b.oklab[k2])
    }
  }

  protected _rsControler!: ReadableStreamDefaultController<QuantizedColors>

  constructor(
    public maxColors: number,
  ) {
    //
  }

  readable = new ReadableStream<QuantizedColors>({
    start: controler => this._rsControler = controler,
  })

  writable = new WritableStream<Colors>({
    write: colors => {
      const boxes = this._colorsToBoxes(colors)
      const quantizedColors = this._boxesToQuantizedColors(boxes)
      this._rsControler.enqueue(quantizedColors)
    },
    close: () => {
      this._rsControler.close()
    },
  })

  protected _colorsToBoxes(colors: Colors): Array<Box> {
    const sort3id = (x: number, y: number, z: number): OklabSort => {
      if (x >= y) {
        if (y >= z) return 'lab'
        if (x >= z) return 'lba'
        return 'bla'
      }
      if (x >= z) return 'alb'
      if (y >= z) return 'abl'
      return 'bal'
    }

    const update = (box: Box): void => {
      const { start, end } = box
      box.length = end - start
      box.weight = 0
      const oklab: Oklab = { l: 0, a: 0, b: 0 }
      for (let i = start; i < end; i++) {
        const color = colors[i]
        oklab.l += color.oklab.l * color.refCount
        oklab.a += color.oklab.a * color.refCount
        oklab.b += color.oklab.b * color.refCount
        box.weight += color.refCount
      }
      box.oklab.l = oklab.l / box.weight
      box.oklab.a = oklab.a / box.weight
      box.oklab.b = oklab.b / box.weight
      const dist: Oklab = { l: 0, a: 0, b: 0 }
      for (let i = start; i < end; i++) {
        const color = colors[i]
        dist.l += (color.oklab.l - box.oklab.l) ** 2 * color.refCount
        dist.a += (color.oklab.a - box.oklab.a) ** 2 * color.refCount
        dist.b += (color.oklab.b - box.oklab.b) ** 2 * color.refCount
      }
      box.sort = sort3id(dist.l, dist.a, dist.b)
      box.score = Math.max(dist.l, dist.a, dist.b)
    }

    const split = (box: Box, position: number): Box => {
      const newBox = {
        start: position + 1,
        end: box.end,
        sorted: box.sorted,
        length: 0,
        score: 0,
        weight: 0,
        sort: 'lab',
        oklab: { l: 0, a: 0, b: 0 },
      } as Box
      update(newBox)
      box.end -= newBox.length
      update(box)
      return newBox
    }

    let box: Box | null = {
      start: 0,
      end: colors.length,
      sorted: null,
      length: 0,
      score: 0,
      weight: 0,
      sort: 'lab',
      oklab: { l: 0, a: 0, b: 0 },
    }

    update(box)
    const boxes = [box]
    let boxesLength = 1

    const next = (): number => {
      let bestIndex = -1
      let maxScore = -1
      if (boxesLength === this.maxColors) return -1
      for (let i = 0; i < boxesLength; i++) {
        const box = boxes[i]
        if (box.length >= 2 && box.score > maxScore) {
          bestIndex = i
          maxScore = box.score
        }
      }
      return bestIndex
    }

    while (box && box.length > 1) {
      const { start, end, sort, sorted } = box

      if (sort !== sorted) {
        // A lot of time is spent here
        const array = colors.slice(start, end).sort(MedianCut.createSorter(sort))
        for (let len = array.length, i = 0; i < len; i++) {
          colors[start + i] = array[i]
        }
        box.sorted = sort
      }

      const median = (box.weight + 1) >> 1
      let index = start
      let weight = 0
      for (let len = end - 2; index < len; index++) {
        weight += colors[index].refCount
        if (weight > median) break
      }

      const newBox = split(box, index)
      boxes.push(newBox)
      boxesLength++

      const nextIndex = next()
      box = nextIndex >= 0 ? boxes[nextIndex] : null
    }

    return boxes
  }

  protected _boxesToQuantizedColors(boxes: Array<Box>): QuantizedColors {
    const totalWeight = boxes.reduce((total, val) => total + val.weight, 0)
    return boxes.map(box => {
      return {
        rgbUint24: oklabToRgbUint24(box.oklab),
        oklab: box.oklab,
        refCount: box.weight,
        percentage: box.weight / totalWeight,
      }
    }).sort((a, b) => b.refCount - a.refCount)
  }
}
