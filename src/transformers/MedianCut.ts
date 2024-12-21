import type { Color, Oklab, OklabSort, QuantizedColor } from '../types'
import { oklabToRgb, rgbToRgbInt } from '../utils'

interface Box {
  count: number
  score: number
  weight: number
  avg: Oklab
  start: number
  end: number
  sort: OklabSort
  sorted: OklabSort | null
}

export class MedianCut implements ReadableWritablePair<Array<QuantizedColor>, Array<Color>> {
  static createSorter(sort: OklabSort) {
    const k0 = sort[0] as 'l' | 'a' | 'b'
    const k1 = sort[1] as 'l' | 'a' | 'b'
    const k2 = sort[2] as 'l' | 'a' | 'b'

    return (a: Color, b: Color) => {
      return (a.lab[k0] - b.lab[k0])
        || (a.lab[k1] - b.lab[k1])
        || (a.lab[k2] - b.lab[k2])
    }
  }

  protected _rsControler!: ReadableStreamDefaultController<Array<QuantizedColor>>

  constructor(
    public maxColors: number,
  ) {
    //
  }

  readable = new ReadableStream<Array<QuantizedColor>>({
    start: controler => this._rsControler = controler,
  })

  writable = new WritableStream<Array<Color>>({
    write: (colors) => {
      this._rsControler.enqueue(
        this._boxesToQuantizedColors(
          this._colorsToBoxes(colors),
        ),
      )
    },
    close: () => {
      this._rsControler.close()
    },
  })

  protected _colorsToBoxes(colors: Array<Color>): Array<Box> {
    let box: Box | null = {
      start: 0,
      end: colors.length - 1,
      sorted: null,
      count: 0,
      score: 0,
      weight: 0,
      sort: 'lab',
      avg: { l: 0, a: 0, b: 0 },
    }
    const boxes = [box]
    let boxesLength = 1

    const sort3id = (x: number, y: number, z: number): OklabSort => {
      if (x >= y) {
        if (y >= z)
          return 'lab'
        if (x >= z)
          return 'lba'
        return 'bla'
      }
      if (x >= z)
        return 'alb'
      if (y >= z)
        return 'abl'
      return 'bal'
    }

    const update = (box: Box): void => {
      const { start, end } = box
      box.count = end - start + 1
      box.weight = 0
      const lab: Oklab = { l: 0, a: 0, b: 0 }
      for (let i = start; i <= end; i++) {
        const color = colors[i]
        lab.l += color.lab.l * color.count
        lab.a += color.lab.a * color.count
        lab.b += color.lab.b * color.count
        box.weight += color.count
      }
      box.avg.l = lab.l / box.weight
      box.avg.a = lab.a / box.weight
      box.avg.b = lab.b / box.weight
      const dist: Oklab = { l: 0, a: 0, b: 0 }
      for (let i = start; i <= end; i++) {
        const color = colors[i]
        dist.l += (color.lab.l - box.avg.l) ** 2 * color.count
        dist.a += (color.lab.a - box.avg.a) ** 2 * color.count
        dist.b += (color.lab.b - box.avg.b) ** 2 * color.count
      }
      box.sort = sort3id(dist.l, dist.a, dist.b)
      box.score = Math.max(dist.l, dist.a, dist.b)
    }

    const split = (box: Box, position: number): void => {
      const newBox = {
        start: position + 1,
        end: box.end,
        sorted: box.sorted,
        count: 0,
        score: 0,
        weight: 0,
        sort: 'lab',
        avg: { l: 0, a: 0, b: 0 },
      } as Box
      update(newBox)
      box.end -= newBox.count
      update(box)
      boxes.push(newBox)
      boxesLength++
    }

    const next = (): number => {
      let bestIndex = -1
      let maxScore = -1
      if (boxesLength === this.maxColors)
        return -1
      for (let i = 0; i < boxesLength; i++) {
        const box = boxes[i]
        if (box.count >= 2 && box.score > maxScore) {
          bestIndex = i
          maxScore = box.score
        }
      }
      return bestIndex
    }

    update(box)

    while (box && box.count > 1) {
      const { start, end, sort, sorted } = box

      if (sort !== sorted) {
        // A lot of time is spent here
        const array = colors.slice(start, end + 1).sort(MedianCut.createSorter(sort))
        for (let len = array.length, i = 0; i < len; i++) {
          colors[start + i] = array[i]
        }
        box.sorted = sort
      }

      const totalWeight = box.weight
      const medianWeight = (totalWeight + 1) >> 1
      let index = start
      let weight = 0
      for (; index < end - 1; index++) {
        weight += colors[index].count
        if (weight > medianWeight)
          break
      }

      split(box, index)

      const nextIndex = next()
      box = nextIndex >= 0 ? boxes[nextIndex] : null
      // debug
      // console.log(start, end, end - start + 1, totalWeight, sort, index, weight, medianWeight)
    }

    return boxes
  }

  protected _boxesToQuantizedColors(boxes: Array<Box>): Array<QuantizedColor> {
    const totalWeight = boxes.reduce((total, val) => total + val.weight, 0)
    return boxes.map((box) => {
      const { r, g, b } = oklabToRgb(box.avg)
      return {
        rgbInt: rgbToRgbInt(r, g, b),
        rgb: { r, g, b },
        hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
        lab: box.avg,
        count: box.weight,
        percentage: box.weight / totalWeight,
      }
    }).sort((a, b) => a.rgbInt - b.rgbInt)
  }
}
