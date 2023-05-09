import type { Options } from './options'
import type { Context } from './context'

export function isContext(value: any): boolean {
  return value && '__CONTEXT__' in value
}

export function orCreateContext(context: Context): Context
export function orCreateContext(options?: Options): Context
export function orCreateContext(value?: any): Context {
  return isContext(value) ? value : createContext(value)
}

export function createContext(options: Options = {}): Context {
  const {
    maxColors = 256,
    statsMode = 'full',
    samples = [],
  } = options

  return {
    __CONTEXT__: true,
    samples,
    maxColors,
    statsMode,
    colorSamples: [],
    colorSamplesIndexTree: new Map(),
    colorBoxes: [],
    colorBoxesIndexTree: [],
  }
}
