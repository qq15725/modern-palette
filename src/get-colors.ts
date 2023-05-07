import type { Context } from './context'

export function getColors(context: Context, type?: 'hex' | 'rgb' | 'buffer') {
  const { colorRanges } = context
  const totalWeight = colorRanges.reduce((total, val) => total + val.weight, 0)

  if (!type) return context.colorRanges.map(val => {
    const { color, weight } = val
    return {
      color,
      percentage: weight / totalWeight,
    }
  })

  const colors = []
  for (let len = colorRanges.length, i = 0; i < len; i++) {
    const { color, weight } = colorRanges[i]
    colors.push({
      color: [
        color >> 16 & 0xFF,
        color >> 8 & 0xFF,
        color & 0xFF,
      ],
      percentage: weight / totalWeight,
    })
  }

  let result: any

  if (type === 'buffer') {
    result = new Uint8ClampedArray(colors.length * 4)
    for (let len = colors.length, i = 0; i < len; i++) {
      const p = i * 4
      const rgb = colors[i].color
      result[p] = rgb[0]
      result[p + 1] = rgb[1]
      result[p + 2] = rgb[2]
      result[p + 3] = 255
    }
  } else if (type === 'hex') {
    result = []
    for (let len = colors.length, i = 0; i < len; i++) {
      const { color, percentage } = colors[i]
      const r = color[0].toString(16).padStart(2, 'f')
      const g = color[1].toString(16).padStart(2, 'f')
      const b = color[2].toString(16).padStart(2, 'f')
      result.push({
        color: `#${ r }${ g }${ b }`,
        percentage,
      })
    }
  } else {
    result = colors
  }

  return result
}
