// [l, a, b]
export type Oklab = [number, number, number]

export type Sort = 'lab' | 'lba' | 'bla' | 'alb' | 'bal' | 'abl'

export interface ColorSample {
  srgb: number
  oklab: Oklab
  count: number
}

export interface ColorBox {
  start: number
  end: number
  length: number
  score: number
  weight: number
  sort: Sort
  sorted: Sort | null
  srgb: number
  oklab: Oklab
}

export interface FindedColorBox extends ColorBox {
  index: number
}

export interface ColorNode {
  oklab: Oklab
  colorBoxIndex: number
  longest: number
  left: number
  right: number
}
