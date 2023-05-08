import type { Context } from './context'

export function reset(context: Context) {
  context.colorSamples = []
  context.colorSamplesIndexTree = new Map()
  context.colorBoxes = []
  context.colorBoxesIndexTree = []
  context.finder = undefined
}
