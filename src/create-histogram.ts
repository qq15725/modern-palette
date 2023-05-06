import { srgbU8ToOklabInt } from './utils'
import type { ColorCounter } from './types'
import type { Options } from './options'

export function createHistogram(statsMode: Options['statsMode']) {
  const size = 1 << 15
  const hashMap = new Map<number, Map<number, number>>()
  let data: ColorCounter[] = []

  let prevSample: Uint8ClampedArray | undefined

  return {
    addSample(sample: Uint8ClampedArray): void {
      for (let len = sample.length, i = 0; i < len; i += 4) {
        const r = sample[i]
        const g = sample[i + 1]
        const b = sample[i + 2]
        const a = sample[i + 3]

        if (a === 0) continue

        if (statsMode === 'diff') {
          if (
            prevSample
            && (
              r === prevSample[i]
              && g === prevSample[i + 1]
              && b === prevSample[i + 2]
            )
          ) continue
          prevSample = sample
        }

        const rgb = (r << 16) | (g << 8) | b
        const hash = rgb % size
        let rgbIndexMap = hashMap.get(hash)

        const index = rgbIndexMap?.get(rgb)
        if (index !== undefined) {
          data[index]!.count++
          continue
        }

        if (!rgbIndexMap) {
          rgbIndexMap = new Map()
          hashMap.set(hash, rgbIndexMap)
        }

        rgbIndexMap.set(
          rgb,
          data.push({
            lab: srgbU8ToOklabInt(rgb),
            count: 1,
          }) - 1,
        )
      }
    },
    flush() {
      const result = data
      data = []
      return result
    },
  }
}
