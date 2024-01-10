import {
  ImageToPixels,
  MedianCut,
  PixelsToColors,
} from './transformers'
import { Finder } from './Finder'
import type { PaletteOptions } from './options'
import type { ImageSource, QuantizedColor } from './types'

export type PaletteConfig = Required<PaletteOptions>

export class Palette {
  config: PaletteConfig
  colors: Array<QuantizedColor> = []
  finder?: Finder
  protected _stream: ReadableStream<Array<QuantizedColor>>
  protected _streamControler!: ReadableStreamDefaultController<ImageSource>

  constructor(options: PaletteOptions = {}) {
    this.config = this._resolveOptions(options)
    this._stream = this._createStream()
  }

  protected _resolveOptions(options: PaletteOptions): PaletteConfig {
    const {
      maxColors = 256,
      statsMode = 'full',
      algorithm = 'median-cut',
      premultipliedAlpha = false,
      tint = [0xFF, 0xFF, 0xFF],
      samples = [],
    } = options

    return {
      maxColors,
      statsMode,
      algorithm,
      premultipliedAlpha,
      tint,
      samples,
    }
  }

  protected _createStream() {
    let quantizer
    switch (this.config.algorithm) {
      case 'median-cut':
      default:
        quantizer = new MedianCut(this.config.maxColors)
        break
    }

    return new ReadableStream({
      start: controler => {
        this._streamControler = controler
        this.config.samples.forEach(sample => controler.enqueue(sample))
      },
    })
      .pipeThrough(new ImageToPixels())
      .pipeThrough(new PixelsToColors(this.config.statsMode, this.config.premultipliedAlpha, this.config.tint))
      .pipeThrough(quantizer)
  }

  addSample(sample: ImageSource): void {
    this._streamControler.enqueue(sample)
  }

  generate(): Promise<Array<QuantizedColor>> {
    return new Promise(resolve => {
      this._streamControler.close()
      this._stream.pipeTo(new WritableStream({
        write: colors => {
          this.colors = colors
          this.finder = new Finder(colors, this.config.premultipliedAlpha, this.config.tint)
          this._stream = this._createStream()
          resolve(colors)
        },
      }))
    })
  }

  match(color: Array<number> | string | number): { color: QuantizedColor; index: number } | undefined {
    let rgba: Array<number>
    if (typeof color === 'number') {
      rgba = [
        (color >> 24) & 0xFF,
        (color >> 16) & 0xFF,
        (color >> 8) & 0xFF,
        color & 0xFF,
      ]
    } else if (typeof color === 'string') {
      const str = color.replace(/^#/, '')
      rgba = [
        `${ str[0] }${ str[1] }`,
        `${ str[2] }${ str[3] }`,
        `${ str[4] }${ str[5] }`,
      ].map(val => parseInt(val, 16))
    } else if (Array.isArray(color)) {
      rgba = color
    } else {
      throw new TypeError('Unsupported color format')
    }

    const index = this.finder?.findNearestIndex(rgba[0], rgba[1], rgba[2], rgba[3])
    if (index === undefined || index < 0) return undefined
    const targetColor = this.colors[index]
    if (!targetColor) return undefined

    return {
      color: targetColor,
      index,
    }
  }

  toColors() {
    return this.colors.slice()
  }

  toHexColors() {
    return this.colors.map(color => color.hex)
  }

  toRgbColors() {
    return this.colors.map(color => color.rgb)
  }

  toRgbIntColors() {
    return this.colors.map(color => color.rgbInt)
  }

  toLabColors() {
    return this.colors.map(color => color.lab)
  }

  toUint8Array(length = this.colors.length * 4): Uint8ClampedArray {
    let lastRgb: any | undefined
    const array = new Uint8ClampedArray(length)
    for (let i = 0; i < length; i++) {
      const p = i * 4
      const rgb = this.colors[i]?.rgb ?? lastRgb
      if (rgb) {
        array[p] = rgb.r
        array[p + 1] = rgb.g
        array[p + 2] = rgb.b
        array[p + 3] = 255
        lastRgb = rgb
      }
    }
    return array
  }

  clear(): void {
    this.colors.length = 0
    this._stream = this._createStream()
  }
}
