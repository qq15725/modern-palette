import type { Context } from './context'

export function findNearestColor(
  context: Context,
  color: string | number | [number, number, number],
) {
  const { colorRanges, finder } = context

  if (!finder) return undefined

  let target: number
  if (typeof color === 'string') {
    const str = color.replace(/^#/, '')
    const arr = [
      `${ str[0] }${ str[1] }`,
      `${ str[2] }${ str[3] }`,
      `${ str[4] }${ str[5] }`,
    ].map(val => parseInt(val, 16))
    target = (arr[0] << 16) | (arr[1] << 8) | arr[2]
  } else if (typeof color === 'object' && Array.isArray(color)) {
    target = (color[0] << 16) | (color[1] << 8) | color[2]
  } else {
    target = color
  }

  const result = colorRanges[finder(target)].color

  if (typeof color === 'string') {
    const r = (result >> 16 & 0xFF).toString(16).padStart(2, 'f')
    const g = (result >> 8 & 0xFF).toString(16).padStart(2, 'f')
    const b = (result & 0xFF).toString(16).padStart(2, 'f')
    return `#${ r }${ g }${ b }`
  } else if (typeof color === 'object' && Array.isArray(color)) {
    return [
      result >> 16 & 0xFF,
      result >> 8 & 0xFF,
      result & 0xFF,
    ] as any
  }

  return result
}
