import type { ColorSample, Oklab, Sort } from './types'

export const IN_BROWSER = typeof window !== 'undefined'
export const isImageElement = (node: any): node is HTMLImageElement => node && typeof node === 'object' && node.nodeType === 1 && node.tagName === 'IMG'

const K = (1 << 16) - 1
const K2 = K * K
const P = (1 << 9) - 1

/**
 * Table mapping formula:
 *   f(x) = x < 0.04045 ? x/12.92 : ((x+0.055)/1.055)^2.4  (sRGB EOTF)
 * Where x is the normalized index in the table and f(x) the value in the table.
 * f(x) is remapped to [0;K] and rounded.
 */
const srgb2linear: number[] = [
  0x0000, 0x0014, 0x0028, 0x003C, 0x0050, 0x0063, 0x0077, 0x008B,
  0x009F, 0x00B3, 0x00C7, 0x00DB, 0x00F1, 0x0108, 0x0120, 0x0139,
  0x0154, 0x016F, 0x018C, 0x01AB, 0x01CA, 0x01EB, 0x020E, 0x0232,
  0x0257, 0x027D, 0x02A5, 0x02CE, 0x02F9, 0x0325, 0x0353, 0x0382,
  0x03B3, 0x03E5, 0x0418, 0x044D, 0x0484, 0x04BC, 0x04F6, 0x0532,
  0x056F, 0x05AD, 0x05ED, 0x062F, 0x0673, 0x06B8, 0x06FE, 0x0747,
  0x0791, 0x07DD, 0x082A, 0x087A, 0x08CA, 0x091D, 0x0972, 0x09C8,
  0x0A20, 0x0A79, 0x0AD5, 0x0B32, 0x0B91, 0x0BF2, 0x0C55, 0x0CBA,
  0x0D20, 0x0D88, 0x0DF2, 0x0E5E, 0x0ECC, 0x0F3C, 0x0FAE, 0x1021,
  0x1097, 0x110E, 0x1188, 0x1203, 0x1280, 0x1300, 0x1381, 0x1404,
  0x1489, 0x1510, 0x159A, 0x1625, 0x16B2, 0x1741, 0x17D3, 0x1866,
  0x18FB, 0x1993, 0x1A2C, 0x1AC8, 0x1B66, 0x1C06, 0x1CA7, 0x1D4C,
  0x1DF2, 0x1E9A, 0x1F44, 0x1FF1, 0x20A0, 0x2150, 0x2204, 0x22B9,
  0x2370, 0x242A, 0x24E5, 0x25A3, 0x2664, 0x2726, 0x27EB, 0x28B1,
  0x297B, 0x2A46, 0x2B14, 0x2BE3, 0x2CB6, 0x2D8A, 0x2E61, 0x2F3A,
  0x3015, 0x30F2, 0x31D2, 0x32B4, 0x3399, 0x3480, 0x3569, 0x3655,
  0x3742, 0x3833, 0x3925, 0x3A1A, 0x3B12, 0x3C0B, 0x3D07, 0x3E06,
  0x3F07, 0x400A, 0x4110, 0x4218, 0x4323, 0x4430, 0x453F, 0x4651,
  0x4765, 0x487C, 0x4995, 0x4AB1, 0x4BCF, 0x4CF0, 0x4E13, 0x4F39,
  0x5061, 0x518C, 0x52B9, 0x53E9, 0x551B, 0x5650, 0x5787, 0x58C1,
  0x59FE, 0x5B3D, 0x5C7E, 0x5DC2, 0x5F09, 0x6052, 0x619E, 0x62ED,
  0x643E, 0x6591, 0x66E8, 0x6840, 0x699C, 0x6AFA, 0x6C5B, 0x6DBE,
  0x6F24, 0x708D, 0x71F8, 0x7366, 0x74D7, 0x764A, 0x77C0, 0x7939,
  0x7AB4, 0x7C32, 0x7DB3, 0x7F37, 0x80BD, 0x8246, 0x83D1, 0x855F,
  0x86F0, 0x8884, 0x8A1B, 0x8BB4, 0x8D50, 0x8EEF, 0x9090, 0x9235,
  0x93DC, 0x9586, 0x9732, 0x98E2, 0x9A94, 0x9C49, 0x9E01, 0x9FBB,
  0xA179, 0xA339, 0xA4FC, 0xA6C2, 0xA88B, 0xAA56, 0xAC25, 0xADF6,
  0xAFCA, 0xB1A1, 0xB37B, 0xB557, 0xB737, 0xB919, 0xBAFF, 0xBCE7,
  0xBED2, 0xC0C0, 0xC2B1, 0xC4A5, 0xC69C, 0xC895, 0xCA92, 0xCC91,
  0xCE94, 0xD099, 0xD2A1, 0xD4AD, 0xD6BB, 0xD8CC, 0xDAE0, 0xDCF7,
  0xDF11, 0xE12E, 0xE34E, 0xE571, 0xE797, 0xE9C0, 0xEBEC, 0xEE1B,
  0xF04D, 0xF282, 0xF4BA, 0xF6F5, 0xF933, 0xFB74, 0xFDB8, 0xFFFF,
]

/**
 * Table mapping formula:
 *   f(x) = x < 0.0031308 ? x*12.92 : 1.055*x^(1/2.4)-0.055  (sRGB OETF)
 * Where x is the normalized index in the table and f(x) the value in the table.
 * f(x) is remapped to [0;0xff] and rounded.
 *
 * Since a 16-bit table is too large, we reduce its precision to 9-bit.
 */
const linear2srgb: number[] = [
  0x00, 0x06, 0x0D, 0x12, 0x16, 0x19, 0x1C, 0x1F, 0x22, 0x24, 0x26, 0x28, 0x2A, 0x2C, 0x2E, 0x30,
  0x32, 0x33, 0x35, 0x36, 0x38, 0x39, 0x3B, 0x3C, 0x3D, 0x3E, 0x40, 0x41, 0x42, 0x43, 0x45, 0x46,
  0x47, 0x48, 0x49, 0x4A, 0x4B, 0x4C, 0x4D, 0x4E, 0x4F, 0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56,
  0x56, 0x57, 0x58, 0x59, 0x5A, 0x5B, 0x5B, 0x5C, 0x5D, 0x5E, 0x5F, 0x5F, 0x60, 0x61, 0x62, 0x62,
  0x63, 0x64, 0x65, 0x65, 0x66, 0x67, 0x67, 0x68, 0x69, 0x6A, 0x6A, 0x6B, 0x6C, 0x6C, 0x6D, 0x6E,
  0x6E, 0x6F, 0x6F, 0x70, 0x71, 0x71, 0x72, 0x73, 0x73, 0x74, 0x74, 0x75, 0x76, 0x76, 0x77, 0x77,
  0x78, 0x79, 0x79, 0x7A, 0x7A, 0x7B, 0x7B, 0x7C, 0x7D, 0x7D, 0x7E, 0x7E, 0x7F, 0x7F, 0x80, 0x80,
  0x81, 0x81, 0x82, 0x82, 0x83, 0x84, 0x84, 0x85, 0x85, 0x86, 0x86, 0x87, 0x87, 0x88, 0x88, 0x89,
  0x89, 0x8A, 0x8A, 0x8B, 0x8B, 0x8C, 0x8C, 0x8C, 0x8D, 0x8D, 0x8E, 0x8E, 0x8F, 0x8F, 0x90, 0x90,
  0x91, 0x91, 0x92, 0x92, 0x93, 0x93, 0x93, 0x94, 0x94, 0x95, 0x95, 0x96, 0x96, 0x97, 0x97, 0x97,
  0x98, 0x98, 0x99, 0x99, 0x9A, 0x9A, 0x9A, 0x9B, 0x9B, 0x9C, 0x9C, 0x9C, 0x9D, 0x9D, 0x9E, 0x9E,
  0x9F, 0x9F, 0x9F, 0xA0, 0xA0, 0xA1, 0xA1, 0xA1, 0xA2, 0xA2, 0xA3, 0xA3, 0xA3, 0xA4, 0xA4, 0xA5,
  0xA5, 0xA5, 0xA6, 0xA6, 0xA6, 0xA7, 0xA7, 0xA8, 0xA8, 0xA8, 0xA9, 0xA9, 0xA9, 0xAA, 0xAA, 0xAB,
  0xAB, 0xAB, 0xAC, 0xAC, 0xAC, 0xAD, 0xAD, 0xAE, 0xAE, 0xAE, 0xAF, 0xAF, 0xAF, 0xB0, 0xB0, 0xB0,
  0xB1, 0xB1, 0xB1, 0xB2, 0xB2, 0xB3, 0xB3, 0xB3, 0xB4, 0xB4, 0xB4, 0xB5, 0xB5, 0xB5, 0xB6, 0xB6,
  0xB6, 0xB7, 0xB7, 0xB7, 0xB8, 0xB8, 0xB8, 0xB9, 0xB9, 0xB9, 0xBA, 0xBA, 0xBA, 0xBB, 0xBB, 0xBB,
  0xBC, 0xBC, 0xBC, 0xBD, 0xBD, 0xBD, 0xBE, 0xBE, 0xBE, 0xBF, 0xBF, 0xBF, 0xC0, 0xC0, 0xC0, 0xC1,
  0xC1, 0xC1, 0xC1, 0xC2, 0xC2, 0xC2, 0xC3, 0xC3, 0xC3, 0xC4, 0xC4, 0xC4, 0xC5, 0xC5, 0xC5, 0xC6,
  0xC6, 0xC6, 0xC6, 0xC7, 0xC7, 0xC7, 0xC8, 0xC8, 0xC8, 0xC9, 0xC9, 0xC9, 0xC9, 0xCA, 0xCA, 0xCA,
  0xCB, 0xCB, 0xCB, 0xCC, 0xCC, 0xCC, 0xCC, 0xCD, 0xCD, 0xCD, 0xCE, 0xCE, 0xCE, 0xCE, 0xCF, 0xCF,
  0xCF, 0xD0, 0xD0, 0xD0, 0xD0, 0xD1, 0xD1, 0xD1, 0xD2, 0xD2, 0xD2, 0xD2, 0xD3, 0xD3, 0xD3, 0xD4,
  0xD4, 0xD4, 0xD4, 0xD5, 0xD5, 0xD5, 0xD6, 0xD6, 0xD6, 0xD6, 0xD7, 0xD7, 0xD7, 0xD7, 0xD8, 0xD8,
  0xD8, 0xD9, 0xD9, 0xD9, 0xD9, 0xDA, 0xDA, 0xDA, 0xDA, 0xDB, 0xDB, 0xDB, 0xDC, 0xDC, 0xDC, 0xDC,
  0xDD, 0xDD, 0xDD, 0xDD, 0xDE, 0xDE, 0xDE, 0xDE, 0xDF, 0xDF, 0xDF, 0xE0, 0xE0, 0xE0, 0xE0, 0xE1,
  0xE1, 0xE1, 0xE1, 0xE2, 0xE2, 0xE2, 0xE2, 0xE3, 0xE3, 0xE3, 0xE3, 0xE4, 0xE4, 0xE4, 0xE4, 0xE5,
  0xE5, 0xE5, 0xE5, 0xE6, 0xE6, 0xE6, 0xE6, 0xE7, 0xE7, 0xE7, 0xE7, 0xE8, 0xE8, 0xE8, 0xE8, 0xE9,
  0xE9, 0xE9, 0xE9, 0xEA, 0xEA, 0xEA, 0xEA, 0xEB, 0xEB, 0xEB, 0xEB, 0xEC, 0xEC, 0xEC, 0xEC, 0xED,
  0xED, 0xED, 0xED, 0xEE, 0xEE, 0xEE, 0xEE, 0xEF, 0xEF, 0xEF, 0xEF, 0xEF, 0xF0, 0xF0, 0xF0, 0xF0,
  0xF1, 0xF1, 0xF1, 0xF1, 0xF2, 0xF2, 0xF2, 0xF2, 0xF3, 0xF3, 0xF3, 0xF3, 0xF3, 0xF4, 0xF4, 0xF4,
  0xF4, 0xF5, 0xF5, 0xF5, 0xF5, 0xF6, 0xF6, 0xF6, 0xF6, 0xF6, 0xF7, 0xF7, 0xF7, 0xF7, 0xF8, 0xF8,
  0xF8, 0xF8, 0xF9, 0xF9, 0xF9, 0xF9, 0xF9, 0xFA, 0xFA, 0xFA, 0xFA, 0xFB, 0xFB, 0xFB, 0xFB, 0xFB,
  0xFC, 0xFC, 0xFC, 0xFC, 0xFD, 0xFD, 0xFD, 0xFD, 0xFD, 0xFE, 0xFE, 0xFE, 0xFE, 0xFF, 0xFF, 0xFF,
]

/* Integer cube root, working only within [0;1] */
function cbrt01Int(x: number): number {
  let u: number

  /* Approximation curve is for the [0;1] range */
  if (x <= 0) return 0
  if (x >= K) return K

  /*
   * Initial approximation: x³ - 2.19893x² + 2.01593x + 0.219407
   *
   * We are not using any rounding here since the precision is not important
   * at this stage and it would require the more expensive rounding function
   * that deals with negative numbers.
   */
  u = x * (x * (x + -144107) / K + 132114) / K + 14379

  /*
   * Refine with 2 Halley iterations:
   *   uₙ₊₁ = uₙ-2f(uₙ)f'(uₙ)/(2f'(uₙ)²-f(uₙ)f"(uₙ))
   *        = uₙ(2x+uₙ³)/(x+2uₙ³)
   *
   * Note: u is not expected to be < 0, so we can use the (a+b/2)/b rounding.
   */
  for (let i = 0; i < 2; i++) {
    const u3 = u * u * u
    const den = x + (2 * u3 + K2 / 2) / K2
    u = (u * (2 * x + (u3 + K2 / 2) / K2) + den / 2) / den
  }

  return u
}

function divRound64(a: number, b: number): number {
  return (a ^ b) < 0 ? (a - b / 2) / b : (a + b / 2) / b
}

export function srgbToOklab(rgb: number): Oklab {
  const r = srgb2linear[rgb >> 16 & 0xFF]
  const g = srgb2linear[rgb >> 8 & 0xFF]
  const b = srgb2linear[rgb & 0xFF]

  // Note: lms can actually be slightly over K due to rounded coefficients
  const l = (27015 * r + 35149 * g + 3372 * b + K / 2) / K
  const m = (13887 * r + 44610 * g + 7038 * b + K / 2) / K
  const s = (5787 * r + 18462 * g + 41286 * b + K / 2) / K

  const l_ = cbrt01Int(l)
  const m_ = cbrt01Int(m)
  const s_ = cbrt01Int(s)

  return [
    divRound64(13792 * l_ + 52010 * m_ - 267 * s_, K),
    divRound64(129628 * l_ - 159158 * m_ + 29530 * s_, K),
    divRound64(1698 * l_ + 51299 * m_ - 52997 * s_, K),
  ]
}

function linearIntToSrgbU8(x: number): number {
  if (x <= 0) {
    return 0
  } else if (x >= K) {
    return 0xFF
  } else {
    const xP = x * P
    const i = ~~(xP / K)
    const m = xP % K
    const y0 = linear2srgb[i]
    const y1 = linear2srgb[i + 1]
    return (m * (y1 - y0) + K / 2) / K + y0
  }
}

export function oklabToSrgb(oklab: Oklab): number {
  const l_ = oklab[0] + divRound64(25974 * oklab[1], K) + divRound64(14143 * oklab[2], K)
  const m_ = oklab[0] + divRound64(-6918 * oklab[1], K) + divRound64(-4185 * oklab[2], K)
  const s_ = oklab[0] + divRound64(-5864 * oklab[1], K) + divRound64(-84638 * oklab[2], K)

  const l = l_ * l_ * l_ / K2
  const m = m_ * m_ * m_ / K2
  const s = s_ * s_ * s_ / K2

  const r = linearIntToSrgbU8((267169 * l + -216771 * m + 15137 * s + K / 2) / K)
  const g = linearIntToSrgbU8((-83127 * l + 171030 * m + -22368 * s + K / 2) / K)
  const b = linearIntToSrgbU8((-275 * l + -46099 * m + 111909 * s + K / 2) / K)

  return r << 16 | g << 8 | b
}

export function diffSign(a: number, b: number) {
  return a > b ? 1 : a < b ? -1 : 0
}

export function createSorter(sort: Sort) {
  const map = { l: 0, a: 1, b: 2 }
  const k0 = sort[0] as 'l' | 'a' | 'b'
  const k1 = sort[1] as 'l' | 'a' | 'b'
  const k2 = sort[2] as 'l' | 'a' | 'b'
  const k00 = map[k0]
  const k01 = map[k1]
  const k02 = map[k2]

  return (a: ColorSample, b: ColorSample) => {
    return diffSign(a.oklab[k00], b.oklab[k00])
      || (
        diffSign(a.oklab[k01], b.oklab[k01])
        || diffSign(a.oklab[k02], b.oklab[k02])
      )
  }
}

export function sort3id(x: number, y: number, z: number): Sort {
  if (x >= y) {
    if (y >= z) return 'lab'
    if (x >= z) return 'lba'
    return 'bla'
  }
  if (x >= z) return 'alb'
  if (y >= z) return 'abl'
  return 'bal'
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    const img = new Image()
    img.decoding = 'sync'
    img.loading = 'eager'
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(img)
    img.src = url
  })
}
