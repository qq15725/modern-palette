import { loadImage, srgbToOklab } from './utils'
import type { Context } from './context'

export async function addSample(
  context: Context,
  source: string | Uint8ClampedArray,
  mode: 'diff' | 'full',
) {
  const {
    context2d,
    colorCounters,
    colorCountersIndexMap,
    previousSample,
  } = context

  let sample: Uint8ClampedArray
  if (typeof source === 'string') {
    if (!context2d) return
    const img = await loadImage(source)
    context2d.canvas.width = img.width
    context2d.canvas.height = img.height
    context2d.drawImage(img, 0, 0)
    sample = context2d.getImageData(0, 0, img.width, img.height).data
  } else {
    sample = source
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

      context.previousSample = sample
    }

    const srgb = (r << 16) | (g << 8) | b
    const hash = srgb % 32768

    let indexMap = colorCountersIndexMap.get(hash)
    let index = indexMap?.get(srgb)

    if (index !== undefined) {
      colorCounters[index]!.count++
      continue
    }

    if (!indexMap) {
      indexMap = new Map()
      colorCountersIndexMap.set(hash, indexMap)
    }

    index = colorCounters.push({ oklab: srgbToOklab(srgb), count: 1 }) - 1
    indexMap.set(srgb, index)
  }
}
