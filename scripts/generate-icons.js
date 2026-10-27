const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// Simple CRC32 implementation
function crc32(buf) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  table[i] = c >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const body = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(body);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, body, crcBuf]);
}

function generateIcon(size, filename) {
  // RGBA raw buffer: each scanline starts with filter byte 0x00
  const rowSize = 1 + size * 4;
  const rawData = Buffer.alloc(rowSize * size);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.44;

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < size; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded background (#0f172a to #1e293b gradient)
      if (dist <= radius) {
        // Deep modern indigo/blue gradient
        const t = (x + y) / (size * 2);
        const r = Math.round(15 + t * 25);
        const g = Math.round(23 + t * 65);
        const b = Math.round(42 + t * 140);
        
        // Inner compass / finance shield motif
        const isCenterIcon = Math.abs(dx) + Math.abs(dy) < radius * 0.55;
        if (isCenterIcon) {
          // Bright emerald/cyan highlight
          rawData[pxOffset] = 56;    // R
          rawData[pxOffset + 1] = 189; // G
          rawData[pxOffset + 2] = 248; // B
          rawData[pxOffset + 3] = 255; // A
        } else {
          rawData[pxOffset] = r;
          rawData[pxOffset + 1] = g;
          rawData[pxOffset + 2] = b;
          rawData[pxOffset + 3] = 255;
        }
      } else {
        // Transparent border
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  // PNG Header
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0); // width
  ihdrData.writeUInt32BE(size, 4); // height
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdr = createChunk("IHDR", ihdrData);

  // IDAT (Deflate rawData)
  const compressed = zlib.deflateSync(rawData);
  const idat = createChunk("IDAT", compressed);

  // IEND
  const iend = createChunk("IEND", Buffer.alloc(0));

  const png = Buffer.concat([header, ihdr, idat, iend]);
  const outDir = path.dirname(filename);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(filename, png);
  console.log(`Generated icon: ${filename} (${size}x${size})`);
}

generateIcon(192, path.join(__dirname, "../public/icons/icon-192x192.png"));
generateIcon(512, path.join(__dirname, "../public/icons/icon-512x512.png"));
generateIcon(64, path.join(__dirname, "../public/favicon.ico"));
