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
    skipTransparent,
  } = context

  const getContext2d = (function () {
    let context2d: CanvasRenderingContext2D | null | undefined
    return () => {
      if (!context2d && IN_BROWSER) {
        context2d = document.createElement('canvas')
          .getContext('2d', {
            willReadFrequently: true,
          })
      }
      return context2d
    }
  }())

  let previousSample: Uint8ClampedArray | null = null
  let finder: ((srgb: number) => number | undefined) | null = null

  const palette = {
    context,
    addSample: sample => {
      if (context.colorSamples.length === 0) {
        previousSample = null
      }

      const result = addSample(context, sample, {
        getContext2d,
        previousSample,
        skipTransparent,
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
    generate(options = {}) {
      const { clearSamples = true } = options
      if (clearSamples) previousSample = null
      generate(context, options)
      return this
    },
    getColors: type => getColors(context, type),
    findNearestColor: color => {
      if (!finder) finder = createColorFinder(context)
      return findNearestColor(context, finder, color)
    },
    reset: () => reset(context),
  } as Palette

  if (samples.length) {
    samples.forEach((sample: any) => palette.addSample(sample))
    context.samples = []
  }

  return palette
}
