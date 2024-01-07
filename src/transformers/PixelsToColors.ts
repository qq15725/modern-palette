import { rgbUint24ToOklab, rgbaToRgbUint24 } from '../utils'
import type { Colors, Pixels } from '../types'

export class PixelsToColors implements ReadableWritablePair<Colors, Pixels> {
  protected _colors: Colors = []
  protected _rsControler!: ReadableStreamDefaultController<Colors>
  protected _cache = new Map<number, Map<number, number>>()
  protected _previousPixels?: Pixels

  constructor(
    public statsMode: 'diff' | 'full' = 'full',
    public premultipliedAlpha: boolean,
    public tint: Array<number>,
  ) {
    //
  }

  readable = new ReadableStream<Colors>({
    start: controler => this._rsControler = controler,
  })

  writable = new WritableStream<Pixels>({
    write: pixels => {
      for (let len = pixels.length, i = 0; i < len; i += 4) {
        const r = pixels[i]
        const g = pixels[i + 1]
        const b = pixels[i + 2]
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

        const rgbUint24 = rgbaToRgbUint24([r, g, b, a], this.premultipliedAlpha, this.tint)
        const oklab = rgbUint24ToOklab(rgbUint24)
        const color = {
          rgbUint24,
          oklab,
          refCount: 1,
        }
        const key = rgbUint24 % 32768

        let map = this._cache.get(key)
        if (!map) {
          map = new Map()
          this._cache.set(key, map)
        }

        let index = map.get(color.rgbUint24)
        if (index !== undefined) {
          color.refCount++
          continue
        }

        index = this._colors.push(color) - 1

        map.set(color.rgbUint24, index)
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
