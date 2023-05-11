<h1 align="center">modern-palette</h1>

<p align="center">
  <a href="https://unpkg.com/modern-palette">
    <img src="https://img.shields.io/bundlephobia/minzip/modern-palette" alt="Minzip">
  </a>
  <a href="https://www.npmjs.com/package/modern-palette">
    <img src="https://img.shields.io/npm/v/modern-palette.svg" alt="Version">
  </a>
  <a href="https://www.npmjs.com/package/modern-palette">
    <img src="https://img.shields.io/npm/dm/modern-palette" alt="Downloads">
  </a>
  <a href="https://github.com/qq15725/modern-palette/issues">
    <img src="https://img.shields.io/github/issues/qq15725/modern-palette" alt="Issues">
  </a>
  <a href="https://github.com/qq15725/modern-palette/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/modern-palette.svg" alt="License">
  </a>
</p>

## 📦 Install

```sh
npm i modern-palette
```

## 🦄 Usage

```ts
import { createPalette } from 'modern-palette'

const palette = createPalette({
  maxColors: 256,
  // (number[] | number[][] | CanvasImageSource | BufferSource)[]
  samples: [
    document.querySelector('img'),
    [[255, 0, 0], [255, 0, 0]],
  ],
})

// Get colors on the palette
const colors = palette.getColors('hex')
// palette.getColors('rgb')
// palette.getColors('buffer')

console.log(colors)
// [ { color: '#f1f110', percentage: 0.002063296404512621 }, ... ]

// Find the nearest color on the palette
const nearestColor = palette.findNearestColor('#ffffff')
// palette.findNearestColor([255, 255, 255])

console.log(nearestColor)
// { color: '#fbfbf6', index: 241 }
```

## Options

See the [options.ts](src/options.ts)

## Palette

See the [palette.ts](src/palette.ts)
