/**
 * Generates the PWA raster icons (no native dependencies required).
 *
 * Produces a violet→cyan gradient tile with a white "forward" arrow, using a
 * tiny hand-rolled PNG encoder built on node:zlib.
 *
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

/* ---------------------------- PNG encoder ---------------------------- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter type: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ------------------------------ drawing ------------------------------ */

const FROM = [124, 92, 255]; // violet
const TO = [34, 211, 238]; // cyan

const mix = (t) => FROM.map((c, i) => Math.round(c + (TO[i] - c) * t));

/** Inside a rounded rect spanning [0,1]² with corner radius `r`. */
function inRoundedRect(u, v, r) {
  if (r <= 0) return true;
  if (u >= r && u <= 1 - r) return true;
  if (v >= r && v <= 1 - r) return true;
  const cx = u < r ? r : 1 - r;
  const cy = v < r ? r : 1 - r;
  const dx = u - cx;
  const dy = v - cy;
  return dx * dx + dy * dy <= r * r;
}

function inTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

/** A right-pointing arrow in unit space [0,1]². */
function inArrow(u, v) {
  if (u >= 0.20 && u <= 0.58 && v >= 0.44 && v <= 0.56) return true;
  return inTriangle(u, v, 0.52, 0.27, 0.52, 0.73, 0.83, 0.5);
}

const SS = 4; // supersampling factor for smooth edges

function render(size, { rounded }) {
  const rgba = Buffer.alloc(size * size * 4);
  const radius = rounded ? 0.22 : 0;
  const pad = rounded ? 0 : 0.16; // keep art inside the maskable safe zone

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let bg = 0;
      let arrow = 0;

      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          const u = (x + (sx + 0.5) / SS) / size;
          const v = (y + (sy + 0.5) / SS) / size;
          if (!inRoundedRect(u, v, radius)) continue;
          bg += 1;
          const au = (u - pad) / (1 - 2 * pad);
          const av = (v - pad) / (1 - 2 * pad);
          if (au >= 0 && au <= 1 && av >= 0 && av <= 1 && inArrow(au, av)) arrow += 1;
        }
      }

      const total = SS * SS;
      const coverage = bg / total;
      const ink = arrow / total;
      const [r, g, b] = mix((x + y) / (2 * (size - 1)));

      const i = (y * size + x) * 4;
      rgba[i] = Math.round(r * (1 - ink) + 255 * ink);
      rgba[i + 1] = Math.round(g * (1 - ink) + 255 * ink);
      rgba[i + 2] = Math.round(b * (1 - ink) + 255 * ink);
      rgba[i + 3] = Math.round(255 * coverage);
    }
  }

  return encodePng(size, size, rgba);
}

const targets = [
  { file: 'icon-192.png', size: 192, rounded: true },
  { file: 'icon-512.png', size: 512, rounded: true },
  { file: 'maskable-512.png', size: 512, rounded: false },
  { file: 'apple-touch-icon.png', size: 180, rounded: false },
];

for (const target of targets) {
  const png = render(target.size, { rounded: target.rounded });
  writeFileSync(join(outDir, target.file), png);
  console.log(`wrote public/icons/${target.file} (${target.size}×${target.size})`);
}
