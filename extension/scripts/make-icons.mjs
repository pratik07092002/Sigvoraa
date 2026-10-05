// Rasterizes the shield-check mark (same shape as frontend/public/favicon.svg) directly,
// pixel by pixel, instead of round-tripping an SVG->canvas->base64 PNG through a large
// string (which proved unreliable to transcribe faithfully for the 48/128px sizes).
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const VIEWBOX = 32;
const PURPLE = [124, 58, 237];
const STROKE = [196, 181, 253];
const WHITE = [255, 255, 255];
const SS = 4; // supersampling factor for cheap antialiasing

function cubicBezier(p0, p1, p2, p3, steps) {
  const pts = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const x = mt * mt * mt * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t * t * t * p3[0];
    const y = mt * mt * mt * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t * t * t * p3[1];
    pts.push([x, y]);
  }
  return pts;
}

// M16 2 L28 7 V15 C28 23 22 28 16 30 C10 28 4 23 4 15 V7 Z
const shieldPolygon = [
  [16, 2],
  [28, 7],
  [28, 15],
  ...cubicBezier([28, 15], [28, 23], [22, 28], [16, 30], 10),
  ...cubicBezier([16, 30], [10, 28], [4, 23], [4, 15], 10),
  [4, 7],
];

// M11 16 L14.5 19.5 L21.5 12
const checkSegments = [
  [[11, 16], [14.5, 19.5]],
  [[14.5, 19.5], [21.5, 12]],
];
const CHECK_STROKE_WIDTH = 2.4;

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function distToSegment(px, py, [x1, y1], [x2, y2]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function colorAt(vx, vy) {
  const onCheck = checkSegments.some(([a, b]) => distToSegment(vx, vy, a, b) <= CHECK_STROKE_WIDTH / 2);
  if (onCheck) return WHITE;
  if (pointInPolygon(vx, vy, shieldPolygon)) return PURPLE;

  // thin outer stroke: just outside the polygon but within ~0.6 viewBox units
  for (let i = 0, j = shieldPolygon.length - 1; i < shieldPolygon.length; j = i++) {
    if (distToSegment(vx, vy, shieldPolygon[i], shieldPolygon[j]) <= 0.6) return STROKE;
  }
  return null; // transparent
}

function crc32(buf) {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function makePng(size) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowLen = size * 4 + 1;
  const raw = Buffer.alloc(rowLen * size);
  const scale = VIEWBOX / size;

  for (let y = 0; y < size; y++) {
    const rowStart = y * rowLen;
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const vx = (x + (sx + 0.5) / SS) * scale;
          const vy = (y + (sy + 0.5) / SS) * scale;
          const c = colorAt(vx, vy);
          if (c) {
            r += c[0];
            g += c[1];
            b += c[2];
            a += 1;
          }
        }
      }
      const samples = SS * SS;
      const coverage = a / samples;
      const px = rowStart + 1 + x * 4;
      if (coverage > 0) {
        raw[px] = Math.round(r / a);
        raw[px + 1] = Math.round(g / a);
        raw[px + 2] = Math.round(b / a);
        raw[px + 3] = Math.round(coverage * 255);
      } else {
        raw[px] = raw[px + 1] = raw[px + 2] = raw[px + 3] = 0;
      }
    }
  }
  const idat = deflateSync(raw);

  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

for (const size of [16, 48, 128]) {
  writeFileSync(new URL(`../icons/icon${size}.png`, import.meta.url), makePng(size));
}
console.log("icons written");
