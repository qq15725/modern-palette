import type { Context } from './context'

export function createContext(): Context {
  return {
    colorSamples: [],
    colorSamplesIndexTree: new Map(),
    colorBoxes: [],
    colorBoxesIndexTree: [],
  }
}
