import { loadImage, srgbToOklab } from './utils'
import type { Context } from './context'

interface AddSampleOptions {
  getContext2d?: () => CanvasRenderingContext2D | undefined | null
  previousSample?: Uint8ClampedArray | null
}

export function addSample(
  context: Context,
  source: string | number[] | number[][] | CanvasImageSource | BufferSource,
  options: AddSampleOptions,
): Uint8ClampedArray | undefined | Promise<Uint8ClampedArray | undefined> {
  const {
    getContext2d,
    previousSample,
  } = options

  const {
    statsMode: mode,
    colorSamples,
    colorSamplesCache,
  } = context

  let sample: Uint8ClampedArray
  if (ArrayBuffer.isView(source)) {
    sample = new Uint8ClampedArray(source.buffer)
  } else if (source instanceof ArrayBuffer) {
    sample = new Uint8ClampedArray(source)
  } else if (Array.isArray(source)) {
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
      sample = new Uint8ClampedArray(array)
    } else {
      sample = new Uint8ClampedArray(source as number[])
    }
  } else if (typeof source === 'string') {
    const context2d = getContext2d?.()
    if (!context2d) return
    const canvas = context2d.canvas
    return loadImage(source).then(img => {
      context2d.clearRect(0, 0, canvas.width, canvas.height)
      canvas.width = img.width
      canvas.height = img.height
      context2d.drawImage(img, 0, 0, canvas.width, canvas.height)
      return addSample(
        context,
        context2d.getImageData(0, 0, img.width, img.height).data,
        options,
      )
    })
  } else {
    const context2d = getContext2d?.()
    if (!context2d) return
    const canvas = context2d.canvas
    context2d.clearRect(0, 0, canvas.width, canvas.height)
    canvas.width = typeof source.width === 'number' ? source.width : source.width.baseVal.value
    canvas.height = typeof source.height === 'number' ? source.height : source.height.baseVal.value
    context2d.drawImage(source, 0, 0, canvas.width, canvas.height)
    return addSample(
      context,
      context2d.getImageData(0, 0, canvas.width, canvas.height).data,
      options,
    )
  }

  for (let len = sample.length, i = 0; i < len; i += 4) {
    const r = sample[i]
    const g = sample[i + 1]
    const b = sample[i + 2]
    const a = sample[i + 3]

    if (mode === 'diff') {
      if (
        previousSample
        && (
          r === previousSample[i]
          && g === previousSample[i + 1]
          && b === previousSample[i + 2]
          && a === previousSample[i + 3]
        )
      ) continue
    }

    const srgb = (r << 16) | (g << 8) | b
    const key = a * 100000000 + srgb

    let index = colorSamplesCache.get(key)
    if (index !== undefined) {
      colorSamples[index]!.count++
      continue
    }
    index = colorSamples.push({
      alpha: a,
      srgb,
      oklab: srgbToOklab(srgb),
      count: 1,
    }) - 1
    colorSamplesCache.set(key, index)
  }

  return sample
}
