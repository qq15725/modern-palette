import { rgbToOklab, rgbToRgbInt, rgbaToRgb } from '../utils'
import type { Color, Pixels } from '../types'

export class PixelsToColors implements ReadableWritablePair<Array<Color>, Pixels> {
  protected _colors: Array<Color> = []
  protected _rsControler!: ReadableStreamDefaultController<Array<Color>>
  protected _cache = new Map<number, Map<number, number>>()
  protected _previousPixels?: Pixels

  constructor(
    public statsMode: 'diff' | 'full',
    public premultipliedAlpha: boolean,
    public tint: Array<number>,
  ) {
    //
  }

  readable = new ReadableStream<Array<Color>>({
    start: controler => this._rsControler = controler,
  })

  writable = new WritableStream<Pixels>({
    write: pixels => {
      for (let len = pixels.length, i = 0; i < len; i += 4) {
        let r = pixels[i]
        let g = pixels[i + 1]
        let b = pixels[i + 2]
        const a = pixels[i + 3]

        if (this.statsMode === 'diff') {
          if (
            this._previousPixels
            && (
              r === this._previousPixels[i]
              && g === this._previousPixels[i + 1]
              && b === this._previousPixels[i + 2]
              && a === this._previousPixels[i + 3]
            )
          ) continue
        }

        ({ r, g, b } = rgbaToRgb(r, g, b, a, this.premultipliedAlpha, this.tint))
        const rgbInt = rgbToRgbInt(r, g, b)
        const color: Color = {
          rgbInt,
          lab: rgbToOklab(r, g, b),
          count: 1,
        }
        const key = rgbInt % 32768

        let map = this._cache.get(key)
        if (!map) {
          this._cache.set(key, map = new Map())
        }
        let index = map.get(rgbInt)
        if (index !== undefined) {
          this._colors[index].count++
          continue
        }
        index = this._colors.push(color) - 1
        map.set(rgbInt, index)
      }

      if (this.statsMode === 'diff') {
        this._previousPixels = pixels
      }
    },
    close: () => {
      this._rsControler.enqueue(this._colors.slice())
      this._rsControler.close()
      this._colors.length = 0
      this._cache.clear()
      this._previousPixels = undefined
    },
  })
}
