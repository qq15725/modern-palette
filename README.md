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
  maxColors: 400,
})

// Add sample color data
await palette.addSample('/example.jpg')
// palette.addSample(document.querySelector('img'))
// palette.addSample([255, 255, 255, 255, 0, 0, 0, 255])
// palette.addSample([[255, 255, 255, 255], [255, 0, 0, 255])

// Generate palette colors from samples
palette.generate()

// Find the nearest color on the palette
// palette.findNearestColor('#000000')
// palette.findNearestColor([255, 255, 255])

// Get colors on the palette
const colors = palette.getColors('hex')
// palette.getColors('rgb')
// palette.getColors('buffer')

console.log(colors)
```

## Options

See the [options.ts](src/options.ts)

## Palette

See the [palette.ts](src/palette.ts)
