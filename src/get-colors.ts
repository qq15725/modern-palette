import type { Context } from './context'

export function getColors(context: Context, type?: 'hex' | 'rgb' | 'buffer') {
  const { colorBoxes } = context
  const totalWeight = colorBoxes.reduce((total, val) => total + val.weight, 0)

  if (!type) return context.colorBoxes.map(val => {
    const { srgb, weight } = val
    return {
      value: srgb,
      percentage: weight / totalWeight,
    }
  })

  const colors = []
  for (let len = colorBoxes.length, i = 0; i < len; i++) {
    const { srgb, weight } = colorBoxes[i]
    colors.push({
      value: [
        (srgb >> 16) & 0xFF,
        (srgb >> 8) & 0xFF,
        srgb & 0xFF,
      ],
      percentage: weight / totalWeight,
    })
  }

  let result: any

  if (type === 'buffer') {
    result = new Uint8ClampedArray(colors.length * 4)
    for (let len = colors.length, i = 0; i < len; i++) {
      const p = i * 4
      const rgb = colors[i].value
      result[p] = rgb[0]
      result[p + 1] = rgb[1]
      result[p + 2] = rgb[2]
      result[p + 3] = 255
    }
  } else if (type === 'hex') {
    result = []
    for (let len = colors.length, i = 0; i < len; i++) {
      const { value, percentage } = colors[i]
      const r = value[0].toString(16).padStart(2, '0')
      const g = value[1].toString(16).padStart(2, '0')
      const b = value[2].toString(16).padStart(2, '0')
      result.push({
        value: `#${ r }${ g }${ b }`,
        percentage,
      })
    }
  } else {
    result = colors
  }

  return result
}
