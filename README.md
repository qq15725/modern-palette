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
import { Palette } from 'modern-palette'

const palette = new Palette({
  maxColors: 256,
  // (string | number[] | number[][] | CanvasImageSource | BufferSource)[]
  samples: [document.querySelector('img'), [[255, 0, 0], [255, 0, 0]]],
})

palette.addSample('/example.png')

// Generate palette colors data
palette.generate().then(colors => {
  console.log(colors)

  // Find the nearest color on the palette
  const nearestColor = palette.match('#ffffff')
  // palette.match([255, 255, 255])

  console.log(nearestColor)
})
```

## Options

See the [options.ts](src/options.ts)

## Palette

See the [Palette.ts](src/Palette.ts)
