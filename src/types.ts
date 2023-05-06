export interface Lab {
  l: number
  a: number
  b: number
}

export type SortBy = 'lab' | 'lba' | 'bla' | 'alb' | 'bal' | 'abl'

export interface ColorCounter {
  lab: Lab
  count: number
}

export interface ColorInfo {
  rgb: number
  lab: [number, number, number]
}

export interface ColorNode {
  c: ColorInfo
  paletteId: number
  split: number
  leftId: number
  rightId: number
}
