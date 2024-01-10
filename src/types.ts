export type ImageSource =
  | string
  | Array<number>
  | Array<Array<number>>
  | CanvasImageSource
  | BufferSource

export type Pixels = ArrayLike<number>

export interface Oklab {
  l: number
  a: number
  b: number
}

export interface Rgb {
  r: number
  g: number
  b: number
}

export type OklabSort = 'lab' | 'lba' | 'bla' | 'alb' | 'bal' | 'abl'

export interface Color {
  rgbInt: number
  lab: Oklab
  count: number
}

export interface QuantizedColor extends Color {
  rgb: Rgb
  hex: string
  percentage: number
}
