import { getColors } from './get-colors'
import { orCreateContext } from './create-context'
import { addSample } from './add-sample'
import { generate } from './generate'
import { findNearestColor } from './find-nearest-color'
import { IN_BROWSER } from './utils'
import { reset } from './reset'
import { createColorFinder } from './create-color-finder'
import type { Context } from './context'
import type { Palette } from './palette'
import type { Options } from './options'

export function createPalette(options?: Options | Context): Palette {
  const context = orCreateContext(options)

  const {
    statsMode,
    samples,
  } = context

  const canvas = IN_BROWSER
    ? document.createElement('canvas')
    : null
  const context2d = canvas?.getContext('2d') ?? null
  let previousSample: Uint8ClampedArray | null = null
  let finder: ((srgb: number) => number | undefined) | null = null

  const palette = {
    context,
    setMaxColors(value: number) {
      context.maxColors = value
      return this
    },
    setStatsMode(value: 'diff' | 'full') {
      context.statsMode = value
      return this
    },
    addSample: sample => {
      if (context.colorSamples.length === 0) {
        previousSample = null
      }

      const result = addSample(context, sample, {
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
      generate(context, options)
      finder = createColorFinder(context)
      return this
    },
    getColors: type => getColors(context, type),
    findNearestColor: color => findNearestColor(context, finder, color),
    reset: () => reset(context),
  } as Palette

  if (samples) {
    samples.forEach((sample: any) => palette.addSample(sample))
    context.samples = []
    palette.generate()
  }

  return palette
}
