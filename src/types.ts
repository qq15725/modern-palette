// [l, a, b]
export type Oklab = [number, number, number]

export type Sort = 'lab' | 'lba' | 'bla' | 'alb' | 'bal' | 'abl'

export interface ColorCounter {
  oklab: Oklab
  count: number
}

export interface ColorRange {
  start: number
  end: number
  length: number
  score: number
  weight: number
  sort: Sort
  sorted: Sort | null
  color: number
  oklab: Oklab
}

export interface ColorNode {
  colorRange: ColorRange
  colorRangeIndex: number
  longest: number
  left: number
  right: number
}
