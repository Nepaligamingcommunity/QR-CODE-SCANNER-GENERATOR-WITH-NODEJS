import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import bwipjs from 'bwip-js';
import { DOMImplementation, XMLSerializer } from 'xmldom';

export async function generateBarcode(type, data, format = 'png', options = {}) {
  try {
    const defaultOptions = {
      width: 2,
      height: 100,
      displayValue: true,
      fontSize: 20,
      margin: 2,
      dotStyle: 'square', // Default value
      ...options // This will override defaults with user options
    };

    if (type === 'qrcode') {
      return await generateAdvancedQRCode(data, format, defaultOptions);
    } else if (['datamatrix', 'pdf417', 'aztec'].includes(type)) {
      return await generate2DBarcode(type, data, format, defaultOptions);
    } else {
      return await generate1DBarcode(type, data, format, defaultOptions);
    }
  } catch (error) {
    throw new Error(`Failed to generate barcode: ${error.message}`);
  }
}

async function generateAdvancedQRCode(data, format, options) {
  const {
    size = 512,
    foreground = '#000000',
    background = '#FFFFFF',
    eyeColor = null,
    logoPath = null,
    dotStyle = 'square', // Use the value from options
    margin = 2
  } = options;

  // 1. Create the QR Matrix
  const qr = QRCode.create(data, { errorCorrectionLevel: 'H' });
  const modules = qr.modules;
  const count = modules.size;
  const cellSize = size / (count + margin * 2);
  const offset = margin * cellSize;

  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 2. Draw Background
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, size, size);

  // Helper to identify Finder Patterns (The 3 large corner squares)
  const isEye = (row, col) => {
    if (row < 7 && col < 7) return true; // Top-left
    if (row < 7 && col >= count - 7) return true; // Top-right
    if (row >= count - 7 && col < 7) return true; // Bottom-left
    return false;
  };

  // 3. Draw Modules
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (modules.get(row, col)) {
        const x = col * cellSize + offset;
        const y = row * cellSize + offset;

        if (isEye(row, col) && eyeColor) {
          ctx.fillStyle = eyeColor;
        } else {
          ctx.fillStyle = foreground;
        }

        if (dotStyle === 'rounded' && !isEye(row, col)) {
          // Draw circular dots for data
          ctx.beginPath();
          ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 2.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Draw squares for eyes or if square style is selected
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
    }
  }

  // 4. Add Logo Overlay
  if (logoPath) {
    try {
      const logo = await loadImage(logoPath);
      const logoSize = size * 0.2; // 20% of QR size
      const center = (size - logoSize) / 2;

      // Clean area behind logo
      ctx.fillStyle = background;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, (logoSize / 2) + 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.drawImage(logo, center, center, logoSize, logoSize);
    } catch (e) {
      console.warn("Logo overlay failed:", e.message);
    }
  }

  const mimeType = mapFormatToMime(format);
  const buffer = canvas.toBuffer(mimeType);

  return {
    success: true,
    data: `data:${mimeType};base64,${buffer.toString('base64')}`,
    format,
    type: 'qrcode'
  };
}

async function generate1DBarcode(type, data, format, options) {
  try {
    if (format === 'svg') {
      const xmlSerializer = new XMLSerializer();
      const doc = new DOMImplementation().createDocument('http://www.w3.org/2000/svg', 'svg', null);
      const svgNode = doc.documentElement;

      JsBarcode(svgNode, data, { format: type.toUpperCase(), ...options });
      const svgString = xmlSerializer.serializeToString(svgNode);

      return { success: true, data: svgString, format: 'svg', type };
    }

    const canvas = createCanvas(400, 200);
    JsBarcode(canvas, data, { format: type.toUpperCase(), ...options });

    const mimeType = mapFormatToMime(format);
    const buffer = canvas.toBuffer(mimeType);
    const base64 = buffer.toString('base64');

    return {
      success: true,
      data: `data:${mimeType};base64,${base64}`,
      format,
      type
    };
  } catch (error) {
    throw new Error(`Invalid data for ${type}: ${error.message}`);
  }
}

async function generate2DBarcode(type, data, format, options) {
  try {
    // Map our type names to bwip-js type names
    const typeMap = {
      'datamatrix': 'datamatrix',
      'pdf417': 'pdf417',
      'aztec': 'azteccode'
    };
    
    const bwipType = typeMap[type];
    if (!bwipType) {
      throw new Error(`Unsupported 2D barcode type: ${type}`);
    }

    // Configure bwip-js options
    const bwipOptions = {
      bcid: bwipType,
      text: data,
      width: options.width * 10 || 20,
      height: options.height || 100,
      includetext: options.displayValue || false,
      textsize: options.fontSize || 10,
      scale: options.scale || 3,
      paddingwidth: options.margin || 10,
      paddingheight: options.margin || 10
    };

    // Generate the barcode
    const buffer = await bwipjs.toBuffer(bwipOptions);
    const mimeType = mapFormatToMime(format);
    const base64 = buffer.toString('base64');

    return {
      success: true,
      data: `data:${mimeType};base64,${base64}`,
      format,
      type
    };
  } catch (error) {
    console.warn(`Failed to generate ${type} with bwip-js: ${error.message}. Using fallback.`);
    return generate2DBarcodeFallback(type, data, format, options);
  }
}

function generate2DBarcodeFallback(type, data, format, options) {
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 200, 200);
  
  ctx.fillStyle = '#000000';
  ctx.fillRect(20, 20, 160, 160);
  
  ctx.fillStyle = '#FF0000';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${type.toUpperCase()} PLACEHOLDER`, 100, 30);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(data.substring(0, 20), 100, 100);

  const mimeType = mapFormatToMime(format);
  const buffer = canvas.toBuffer(mimeType);
  const base64 = buffer.toString('base64');

  return {
    success: true,
    data: `data:${mimeType};base64,${base64}`,
    format,
    type,
    note: `${type} generation is simulated. Install proper libraries for production.`
  };
}

function mapFormatToMime(format) {
  switch (format.toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'png':
      return 'image/png';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'image/png';
  }
}
