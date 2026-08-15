const fs = require('fs');
const zlib = require('zlib');

function createPng32(red, green, blue, alpha = 255) {
  const width = 32;
  const height = 32;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  
  const ihdr = createChunk('IHDR', ihdrData);
  const rawRowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rawRowSize);
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rawRowSize;
    rawData[rowOffset] = 0;
    
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const isCorner = 
        (x < 5 && y < 5 && (x-5)*(x-5) + (y-5)*(y-5) > 25) ||
        (x >= 27 && y < 5 && (x-26)*(x-26) + (y-5)*(y-5) > 25) ||
        (x < 5 && y >= 27 && (x-5)*(x-5) + (y-26)*(y-26) > 25) ||
        (x >= 27 && y >= 27 && (x-26)*(x-26) + (y-26)*(y-26) > 25);
      
      if (isCorner) {
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      } else {
        let isK = false;
        // Letter K (centered in 32x32 grid)
        if (x >= 10 && x <= 13 && y >= 7 && y <= 24) isK = true;
        if ((x == 14 && y >= 14 && y <= 16) || (x == 15 && y >= 13 && y <= 15) || (x == 16 && y >= 12 && y <= 14) || (x == 17 && y >= 11 && y <= 13) || (x == 18 && y >= 10 && y <= 12) || (x == 19 && y >= 9 && y <= 11) || (x == 20 && y >= 8 && y <= 10) || (x == 21 && y >= 7 && y <= 9)) isK = true;
        if ((x == 14 && y >= 15 && y <= 17) || (x == 15 && y >= 16 && y <= 18) || (x == 16 && y >= 17 && y <= 19) || (x == 17 && y >= 18 && y <= 20) || (x == 18 && y >= 19 && y <= 21) || (x == 19 && y >= 20 && y <= 22) || (x == 20 && y >= 21 && y <= 23) || (x == 21 && y >= 22 && y <= 24)) isK = true;
        
        if (isK) {
          rawData[pxOffset] = 255;
          rawData[pxOffset + 1] = 255;
          rawData[pxOffset + 2] = 255;
          rawData[pxOffset + 3] = 255;
        } else {
          rawData[pxOffset] = red;
          rawData[pxOffset + 1] = green;
          rawData[pxOffset + 2] = blue;
          rawData[pxOffset + 3] = alpha;
        }
      }
    }
  }
  
  const idatData = zlib.deflateSync(rawData);
  const idat = createChunk('IDAT', idatData);
  const iend = createChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  const body = Buffer.concat([typeBuf, data]);
  const crc = crc32(body);
  crcBuf.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([len, body, crcBuf]);
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ -1) >>> 0;
}

const pngBuffer = createPng32(124, 58, 237); // #7C3AED
fs.mkdirSync('scratch', { recursive: true });
fs.writeFileSync('public/favicon.ico', pngBuffer);
fs.writeFileSync('public/favicon.png', pngBuffer);
fs.writeFileSync('public/icon.png', pngBuffer);
fs.writeFileSync('app/favicon.ico', pngBuffer);
fs.writeFileSync('app/icon.png', pngBuffer);

console.log('Successfully generated K favicon files!');
