import type { Context } from './context'

export function reset(context: Context) {
  context.colorSamples = []
  context.colorSamplesCache.clear()
  context.colorBoxes = []
  context.colorBoxesIndexTree = []
  context.finderCache.clear()
}
