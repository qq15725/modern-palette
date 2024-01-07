import {
  ImageToPixels,
  MedianCut,
  PixelsToColors,
} from './transformers'
import { Finder } from './Finder'
import type { ImageSource, QuantizedColors } from './types'

export interface PaletteOptions {
  /**
   * Max colors count
   *
   * @default 256
   */
  maxColors?: number

  /**
   * Sample statistical mode
   *
   * @default 'full'
   */
  statsMode?: 'diff' | 'full'

  /**
   * Premultiplied alpha
   *
   * @default false
   */
  premultipliedAlpha?: boolean

  /**
   * Tint
   *
   * @default [0xFF, 0xFF, 0xFF]
   */
  tint?: Array<number>

  /**
   * Algorithm for color Image Quantization
   *
   * @default median-cut
   */
  algorithm?: 'median-cut'

  /**
   * Samples color data
   */
  samples?: Array<ImageSource>
}

export class Palette {
  colors: QuantizedColors = []
  protected _rsControler!: ReadableStreamDefaultController<ImageSource>
  protected _readable: ReadableStream<QuantizedColors>
  protected _finder: Finder

  constructor(options: PaletteOptions = {}) {
    const {
      maxColors = 256,
      statsMode = 'full',
      algorithm = 'median-cut',
      premultipliedAlpha = false,
      tint = [0xFF, 0xFF, 0xFF],
      samples,
    } = options

    let quantizer
    switch (algorithm) {
      case 'median-cut':
      default:
        quantizer = new MedianCut(maxColors)
        break
    }

    this._readable = new ReadableStream({
      start: controler => this._rsControler = controler,
    })
      .pipeThrough(new ImageToPixels())
      .pipeThrough(new PixelsToColors(statsMode, premultipliedAlpha, tint))
      .pipeThrough(quantizer) as any

    this._finder = new Finder(premultipliedAlpha, tint)

    samples?.forEach(sample => this.addSample(sample))
  }

  addSample(sample: ImageSource): void {
    this._rsControler.enqueue(sample)
  }

  async generate(): Promise<this> {
    this._rsControler.close()
    const reader = this._readable.getReader()
    const result = await reader.read()
    if (result.value) {
      this.colors = result.value
      this._finder.update(this.colors)
    }
    return this
  }

  getColors(format: 'rgb'): { value: [number, number, number]; percentage: number }[]
  getColors(format?: 'hex'): { value: string; percentage: number }[]
  getColors(format: 'buffer'): Uint8ClampedArray
  getColors(format?: string): any {
    if (!format) return this.colors.map(val => {
      const { rgbUint24, percentage } = val
      return {
        value: rgbUint24,
        percentage,
      }
    })

    const colors = []
    for (let len = this.colors.length, i = 0; i < len; i++) {
      const { rgbUint24, percentage } = this.colors[i]
      colors.push({
        value: [
          (rgbUint24 >> 16) & 0xFF,
          (rgbUint24 >> 8) & 0xFF,
          rgbUint24 & 0xFF,
        ],
        percentage,
      })
    }

    let result: any

    if (format === 'buffer') {
      result = new Uint8ClampedArray(colors.length * 4)
      for (let len = colors.length, i = 0; i < len; i++) {
        const p = i * 4
        const rgb = colors[i].value
        result[p] = rgb[0]
        result[p + 1] = rgb[1]
        result[p + 2] = rgb[2]
        result[p + 3] = 255
      }
    } else if (format === 'hex') {
      result = []
      for (let len = colors.length, i = 0; i < len; i++) {
        const { value, percentage } = colors[i]
        const r = value[0].toString(16).padStart(2, '0')
        const g = value[1].toString(16).padStart(2, '0')
        const b = value[2].toString(16).padStart(2, '0')
        result.push({
          value: `#${ r }${ g }${ b }`,
          percentage,
        })
      }
    } else {
      result = colors
    }

    return result
  }

  findNearestColor(color: Array<number>): { value: Array<number>; index: number } | undefined
  findNearestColor(color: string): { value: string; index: number } | undefined
  findNearestColor(color: number): { value: number; index: number } | undefined
  findNearestColor(color: any): any {
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

    const index = this._finder.findNearestIndex(rgba[0], rgba[1], rgba[2], rgba[3])
    if (index === undefined) return undefined

    const targetColor = this.colors[index]
    if (!targetColor) return undefined

    const { rgbUint24 } = targetColor

    if (typeof color === 'string') {
      const r = (rgbUint24 >> 16 & 0xFF).toString(16).padStart(2, '0')
      const g = (rgbUint24 >> 8 & 0xFF).toString(16).padStart(2, '0')
      const b = (rgbUint24 & 0xFF).toString(16).padStart(2, '0')
      return {
        value: `#${ r }${ g }${ b }`,
        index,
      }
    } else if (typeof color === 'object' && Array.isArray(color)) {
      return {
        value: [
          rgbUint24 >> 16 & 0xFF,
          rgbUint24 >> 8 & 0xFF,
          rgbUint24 & 0xFF,
        ] as any,
        index,
      }
    }

    return {
      value: rgbUint24,
      index,
    }
  }

  clear(): void {
    this.colors.length = 0
    this._rsControler.close()
  }
}
