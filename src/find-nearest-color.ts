import type { Context } from './context'

export function findNearestColor(
  context: Context,
  finder: ((srgb: number) => number | undefined) | null,
  color: string | number | [number, number, number],
) {
  const { colorBoxes } = context

  if (!finder) return undefined

  let target: number
  if (typeof color === 'number') {
    target = color
  } else if (typeof color === 'string') {
    const str = color.replace(/^#/, '')
    const arr = [
      `${ str[0] }${ str[1] }`,
      `${ str[2] }${ str[3] }`,
      `${ str[4] }${ str[5] }`,
    ].map(val => parseInt(val, 16))
    target = (arr[0] << 16) | (arr[1] << 8) | arr[2]
  } else if (Array.isArray(color)) {
    target = (color[0] << 16) | (color[1] << 8) | color[2]
  } else {
    throw new TypeError('Unsupported color format')
  }

  const index = finder(target)
  if (index === undefined) return undefined

  const colorBox = colorBoxes[index]
  if (!colorBox) return undefined

  const { srgb } = colorBox

  if (typeof color === 'string') {
    const r = (srgb >> 16 & 0xFF).toString(16).padStart(2, 'f')
    const g = (srgb >> 8 & 0xFF).toString(16).padStart(2, 'f')
    const b = (srgb & 0xFF).toString(16).padStart(2, 'f')
    return {
      color: `#${ r }${ g }${ b }`,
      index,
    }
  } else if (typeof color === 'object' && Array.isArray(color)) {
    return {
      color: [
        srgb >> 16 & 0xFF,
        srgb >> 8 & 0xFF,
        srgb & 0xFF,
      ] as any,
      index,
    }
  }

  return {
    color: srgb,
    index,
  }
}
