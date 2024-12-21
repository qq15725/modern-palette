import type { ImageSource, Pixels } from '../types'
import { IN_BROWSER, loadImage } from '../utils'

export class ImageToPixels implements ReadableWritablePair<Pixels, ImageSource> {
  protected static _ctx2d?: CanvasRenderingContext2D | null
  static get ctx2d(): CanvasRenderingContext2D {
    if (!this._ctx2d) {
      if (!IN_BROWSER) {
        throw new Error('Failed to get ImageToPixels.ctx2d, not in browser.')
      }
      const ctx = document.createElement('canvas')
        .getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        throw new Error('Failed to get ImageToPixels.ctx2d, getContext(\'2d\') return null.')
      }
      this._ctx2d = ctx
    }
    return this._ctx2d
  }

  protected _rsControler!: ReadableStreamDefaultController<Pixels>

  readable = new ReadableStream<Pixels>({
    start: controler => this._rsControler = controler,
  })

  writable = new WritableStream<ImageSource>({
    write: async (source) => {
      let pixels
      switch (typeof source) {
        case 'string': {
          const img = await loadImage(source)
          const ctx = ImageToPixels.ctx2d
          const canvas = ctx.canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
          break
        }
        default:
          if (ArrayBuffer.isView(source)) {
            pixels = new Uint8ClampedArray(source.buffer)
          }
          else if (source instanceof ArrayBuffer) {
            pixels = new Uint8ClampedArray(source)
          }
          else if (Array.isArray(source)) {
            if (Array.isArray(source[0])) {
              const array = []
              for (let len = source.length, i = 0; i < len; i++) {
                array.push(
                  (source as any)[i][0] ?? 0,
                  (source as any)[i][1] ?? 0,
                  (source as any)[i][2] ?? 0,
                  (source as any)[i][3] ?? 255,
                )
              }
              pixels = new Uint8ClampedArray(array)
            }
            else {
              pixels = new Uint8ClampedArray(source as number[])
            }
          }
          else {
            const ctx = ImageToPixels.ctx2d
            const canvas = ctx.canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            canvas.width = 'width' in source
              ? typeof source.width === 'number'
                ? source.width
                : source.width.baseVal.value
              : 0
            canvas.height = 'height' in source
              ? typeof source.height === 'number'
                ? source.height
                : source.height.baseVal.value
              : 0
            ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
            pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
          }
          break
      }

      this._rsControler.enqueue(pixels)
    },
    close: () => {
      this._rsControler.close()
    },
  })
}
