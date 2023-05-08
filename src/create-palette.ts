import { getColors } from './get-colors'
import { createContext } from './create-context'
import { addSample } from './add-sample'
import { generate } from './generate'
import { findNearestColor } from './find-nearest-color'
import { IN_BROWSER } from './utils'
import type { Palette } from './palette'
import type { Options } from './options'

export function createPalette(options: Options = {}): Palette {
  const {
    maxColors = 256,
    statsMode = 'full',
    samples,
  } = options

  const context = createContext()

  const canvas = IN_BROWSER
    ? document.createElement('canvas')
    : null
  const context2d = canvas?.getContext('2d') ?? null
  let previousSample: Uint8ClampedArray | null = null

  const palette = {
    context,
    addSample: sample => {
      const result = addSample(context, sample, {
        mode: statsMode,
        context2d,
        previousSample,
      })

      ;(
        result instanceof Promise
          ? result
          : Promise.resolve().then(() => result)
      ).then(sample => {
        if (sample && statsMode === 'diff') {
          previousSample = sample
        }
      })

      return result
    },
    generate(options) {
      generate(context, { maxColors, ...options })
      return this
    },
    getColors: type => getColors(context, type),
    findNearestColor: color => findNearestColor(context, color),
  } as Palette

  if (samples) {
    samples.forEach((sample: any) => palette.addSample(sample))
    palette.generate()
  }

  return palette
}
