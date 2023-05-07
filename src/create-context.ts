import { IN_BROWSER } from './utils'
import type { Context } from './context'

export function createContext(): Context {
  const canvas = IN_BROWSER
    ? document.createElement('canvas')
    : null

  return {
    context2d: canvas?.getContext('2d') ?? null,
    colorCounters: [],
    colorCountersIndexMap: new Map(),
    colorRanges: [],
    previousSample: null,
  }
}
