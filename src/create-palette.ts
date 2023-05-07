import { getColors } from './get-colors'
import { createContext } from './create-context'
import { addSample } from './add-sample'
import { generate } from './generate'
import { findNearestColor } from './find-nearest-color'
import type { Palette } from './palette'
import type { Options } from './options'

export function createPalette(options: Options = {}): Palette {
  const {
    maxColors = 256,
    statsMode = 'full',
  } = options

  const context = createContext()

  return {
    context,
    addSample: sample => addSample(context, sample, statsMode),
    generate: () => generate(context, maxColors),
    getColors: type => getColors(context, type),
    findNearestColor: color => findNearestColor(context, color),
  } as Palette
}
