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

export type OklabSort = 'lab' | 'lba' | 'bla' | 'alb' | 'bal' | 'abl'

export interface Color {
  rgbUint24: number
  oklab: Oklab
  refCount: number
}

export type Colors = Array<Color>

export interface QuantizedColor extends Color {
  percentage: number
}

export type QuantizedColors = Array<QuantizedColor>
