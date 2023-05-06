export function convertColors(rawColors: number[], type: 'hex'): string[]
export function convertColors(rawColors: number[], type: 'rgb'): [number, number, number][]
export function convertColors(rawColors: number[], type: 'buffer'): Uint8ClampedArray
export function convertColors(rawColors: number[]): number[]
export function convertColors(rawColors: number[], type?: string) {
  if (!type) return rawColors

  const colors: [number, number, number][] = []
  for (let len = rawColors.length, i = 0; i < len; i++) {
    const color = rawColors[i]
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
