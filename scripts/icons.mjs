import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
function crc32(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type);
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([size, t, data, crc]);
}
function curve(start, a, b, end) {
  return Array.from({ length: 21 }, (_, i) => {
    const t = i / 20,
      u = 1 - t;
    return [
      u ** 3 * start[0] +
        3 * u * u * t * a[0] +
        3 * u * t * t * b[0] +
        t ** 3 * end[0],
      u ** 3 * start[1] +
        3 * u * u * t * a[1] +
        3 * u * t * t * b[1] +
        t ** 3 * end[1],
    ];
  });
}
const left = [
  ...curve([32, 43], [13, 43], [12, 25], [14, 18]),
  ...curve([14, 18], [32, 18], [34, 30], [32, 43]),
];
const right = [
  ...curve([32, 35], [32, 16], [46, 13], [51, 13]),
  ...curve([51, 13], [52, 31], [42, 37], [32, 35]),
];
function inside(x, y, points) {
  let result = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [a, b] = points[i],
      [c, d] = points[j];
    if (b > y !== d > y && x < ((c - a) * (y - b)) / (d - b) + a)
      result = !result;
  }
  return result;
}
function distance(x, y, a, b) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const t = Math.max(
    0,
    Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)),
  );
  return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy);
}
const stems = [
  [
    [32, 49],
    [32, 32],
  ],
  [
    [32, 42],
    [22, 29],
  ],
  [
    [32, 34],
    [43, 23],
  ],
];
function color(x, y) {
  const cx = Math.max(17, Math.min(47, x)),
    cy = Math.max(17, Math.min(47, y));
  if (Math.hypot(x - cx, y - cy) > 17) return [0, 0, 0, 0];
  if (stems.some(([a, b]) => distance(x, y, a, b) <= 1.25))
    return [244, 246, 237, 255];
  if (inside(x, y, right)) return [224, 217, 180, 255];
  if (inside(x, y, left)) return [187, 207, 171, 255];
  return [40, 78, 69, 255];
}
for (const size of [192, 512]) {
  const pixels = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = y * (size * 4 + 1) + 1 + x * 4;
      const samples = [
        color(((x + 0.25) / size) * 64, ((y + 0.25) / size) * 64),
        color(((x + 0.75) / size) * 64, ((y + 0.25) / size) * 64),
        color(((x + 0.25) / size) * 64, ((y + 0.75) / size) * 64),
        color(((x + 0.75) / size) * 64, ((y + 0.75) / size) * 64),
      ];
      const opaque = samples.filter((s) => s[3]);
      for (let c = 0; c < 3; c++)
        pixels[i + c] = opaque.length
          ? Math.round(opaque.reduce((sum, s) => sum + s[c], 0) / opaque.length)
          : 0;
      pixels[i + 3] = Math.round((opaque.length / 4) * 255);
    }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  writeFileSync(
    `public/icon-${size}.png`,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", header),
      chunk("IDAT", deflateSync(pixels)),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
}
