import type { Context } from './context'

export function getColors(context: Context, type?: 'hex' | 'rgb' | 'buffer') {
  if (!type) return context.colorRanges.map(val => val.color)

  const { colorRanges } = context

  const colors: [number, number, number][] = []
  for (let len = colorRanges.length, i = 0; i < len; i++) {
    const color = colorRanges[i].color
    colors.push([
      color >> 16 & 0xFF,
      color >> 8 & 0xFF,
      color & 0xFF,
    ])
  }

  let result: any

  if (type === 'buffer') {
    result = new Uint8ClampedArray(colors.length * 4)
    for (let len = colors.length, i = 0; i < len; i++) {
      const p = i * 4
      const rgb = colors[i]
      result[p] = rgb[0]
      result[p + 1] = rgb[1]
      result[p + 2] = rgb[2]
      result[p + 3] = 255
    }
  } else if (type === 'hex') {
    result = []
    for (let len = colors.length, i = 0; i < len; i++) {
      const rgb = colors[i]
      const r = rgb[0].toString(16).padStart(2, 'f')
      const g = rgb[1].toString(16).padStart(2, 'f')
      const b = rgb[2].toString(16).padStart(2, 'f')
      result.push(`#${ r }${ g }${ b }`)
    }
  } else {
    result = colors
  }

  return result
}
