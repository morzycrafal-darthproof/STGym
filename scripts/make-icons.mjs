// Renders the dumbbell app icon (same geometry as public/favicon.svg) to PNGs for the web app manifest.
// Usage: node scripts/make-icons.mjs
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const ORANGE = [0xf0, 0x5a, 0x2a]
const WHITE = [0xff, 0xff, 0xff]
// Dumbbell bars in the 64×64 SVG coordinate space: [x, y, w, h, radius]
const BARS = [
  [18, 29, 28, 6, 2],
  [12, 18, 7, 28, 2.5],
  [45, 18, 7, 28, 2.5],
  [6, 23, 6, 18, 2.5],
  [52, 23, 6, 18, 2.5],
]

function inRoundRect(px, py, [x, y, w, h, r]) {
  if (px < x || py < y || px > x + w || py > y + h) return false
  const cx = Math.min(Math.max(px, x + r), x + w - r)
  const cy = Math.min(Math.max(py, y + r), y + h - r)
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r
}

/** maskable: full-bleed background and the dumbbell shrunk into the safe zone. */
function render(size, { maskable }) {
  const SS = 4 // supersampling for anti-aliased edges
  // 0.75 keeps the dumbbell's corners inside the maskable safe circle (radius 40% of the icon).
  const scale = maskable ? 0.75 : 1
  const rgba = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bg = 0
      let fg = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = ((x + (sx + 0.5) / SS) / size) * 64
          const v = ((y + (sy + 0.5) / SS) / size) * 64
          if (maskable || inRoundRect(u, v, [0, 0, 64, 64, 14])) bg++
          const bu = (u - 32) / scale + 32
          const bv = (v - 32) / scale + 32
          if (BARS.some((b) => inRoundRect(bu, bv, b))) fg++
        }
      }
      const n = SS * SS
      const a = bg / n
      const f = fg / Math.max(bg, 1)
      const i = (y * size + x) * 4
      for (let c = 0; c < 3; c++) rgba[i + c] = Math.round(ORANGE[c] * (1 - f) + WHITE[c] * f)
      rgba[i + 3] = Math.round(a * 255)
    }
  }
  return encodePng(size, rgba)
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const out = {
  'icon-192.png': render(192, { maskable: false }),
  'icon-512.png': render(512, { maskable: false }),
  'icon-maskable-512.png': render(512, { maskable: true }),
  'apple-touch-icon.png': render(180, { maskable: true }),
}
for (const [name, png] of Object.entries(out)) {
  writeFileSync(new URL(`../public/${name}`, import.meta.url), png)
  console.log(name, png.length, 'B')
}
