import { loadImage, srgbToOklab } from './utils'
import type { Context } from './context'

interface AddSampleOptions {
  context2d?: CanvasRenderingContext2D | null
  previousSample?: Uint8ClampedArray | null
}

export function addSample(
  context: Context,
  source: string | HTMLImageElement | number[] | number[][] | BufferSource,
  options: AddSampleOptions,
): Uint8ClampedArray | undefined | Promise<Uint8ClampedArray | undefined> {
  const {
    context2d,
    previousSample,
  } = options

  const {
    statsMode: mode,
    colorSamples,
    colorSamplesIndexTree,
  } = context

  let sample: Uint8ClampedArray
  if (typeof source === 'string') {
    if (!context2d) return
    return loadImage(source).then(img => {
      context2d.canvas.width = img.width
      context2d.canvas.height = img.height
      context2d.drawImage(img, 0, 0)
      return addSample(
        context,
        context2d.getImageData(0, 0, img.width, img.height).data,
        options,
      )
    })
  } else if (source instanceof HTMLImageElement) {
    if (!context2d) return
    context2d.canvas.width = source.width
    context2d.canvas.height = source.height
    context2d.drawImage(source, 0, 0)
    return addSample(
      context,
      context2d.getImageData(0, 0, source.width, source.height).data,
      options,
    )
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
  } else if (ArrayBuffer.isView(source)) {
    sample = new Uint8ClampedArray(source.buffer)
  } else {
    sample = new Uint8ClampedArray(source)
  }

  for (let len = sample.length, i = 0; i < len; i += 4) {
    if (sample[i + 3] === 0) continue

    const r = sample[i]
    const g = sample[i + 1]
    const b = sample[i + 2]

    if (mode === 'diff') {
      if (
        previousSample
        && (
          r === previousSample[i]
          && g === previousSample[i + 1]
          && b === previousSample[i + 2]
        )
      ) continue
    }

    const srgb = (r << 16) | (g << 8) | b
    const hash = srgb % 32768

    let indexMap = colorSamplesIndexTree.get(hash)
    let index = indexMap?.get(srgb)

    if (index !== undefined) {
      colorSamples[index]!.count++
      continue
    }

    if (!indexMap) {
      indexMap = new Map()
      colorSamplesIndexTree.set(hash, indexMap)
    }

    index = colorSamples.push({ srgb, oklab: srgbToOklab(srgb), count: 1 }) - 1
    indexMap.set(srgb, index)
  }

  return sample
}
