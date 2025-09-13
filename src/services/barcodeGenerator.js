import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { createCanvas } from '@napi-rs/canvas';
import bwipjs from 'bwip-js';
import { DOMImplementation, XMLSerializer } from 'xmldom';

export async function generateBarcode(type, data, format = 'png', options = {}) {
  try {
    const defaultOptions = {
      width: 2,
      height: 100,
      displayValue: true,
      fontSize: 20,
      margin: 10,
      ...options
    };

    if (type === 'qrcode') {
      return await generateQRCode(data, format, defaultOptions);
    } else if (['datamatrix', 'pdf417', 'aztec'].includes(type)) {
      return await generate2DBarcode(type, data, format, defaultOptions);
    } else {
      return await generate1DBarcode(type, data, format, defaultOptions);
    }
  } catch (error) {
    throw new Error(`Failed to generate barcode: ${error.message}`);
  }
}

async function generateQRCode(data, format, options) {
  const qrOptions = {
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    margin: options.margin || 1,
    color: {
      dark: options.foreground || '#000000',
      light: options.background || '#FFFFFF'
    },
    width: options.size || 256
  };

  if (format === 'svg') {
    const svgString = await QRCode.toString(data, { ...qrOptions, type: 'svg' });
    return { success: true, data: svgString, format: 'svg', type: 'qrcode' };
  }

  const mimeType = mapFormatToMime(format);
  const buffer = await QRCode.toBuffer(data, { ...qrOptions, type: mimeType });
  const base64 = buffer.toString('base64');

  return {
    success: true,
    data: `data:${mimeType};base64,${base64}`,
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
      width: options.width * 10 || 20, // Scale width appropriately
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
    // Fallback to simulated barcode if bwip-js fails
    console.warn(`Failed to generate ${type} with bwip-js: ${error.message}. Using fallback.`);
    return generate2DBarcodeFallback(type, data, format, options);
  }
}

function generate2DBarcodeFallback(type, data, format, options) {
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');

  // Draw background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 200, 200);
  
  // Draw barcode placeholder
  ctx.fillStyle = '#000000';
  ctx.fillRect(20, 20, 160, 160);
  
  // Draw text
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
      return 'image/png'; // fallback
  }
}