import Jimp from 'jimp';
import { readBarcodes } from 'zxing-wasm';

/**
 * Scan a barcode/QR from an image file.
 * Supports: Code128, Code39, EAN-13, EAN-8, UPC-A, Code93,
 * ITF-14, MSI, Pharmacode, Codabar, DataMatrix, PDF417,
 * Aztec, QR Code
 */
export async function scanBarcode(imagePath) {
  try {
    // Load image with Jimp
    const image = await Jimp.read(imagePath);
    const { data, width, height } = image.bitmap;

    // Convert to ImageData-like object
    const imageData = {
      data: new Uint8ClampedArray(data),
      width,
      height
    };

    // Ask ZXing to decode all supported formats
    const results = await readBarcodes(imageData, {
      tryHarder: true,
      formats: [
        'Code128',
        'Code39',
        'EAN_13',
        'EAN_8',
        'UPC_A',
        'Code93',
        'ITF',
        'MSI',
        'PharmaCode',
        'Codabar',
        'DataMatrix',
        'PDF417',
        'Aztec',
        'QRCode'
      ]
    });

    if (results && results.length > 0) {
      // Pick first valid result
      const r = results[0];
      return {
        success: true,
        type: r.format,
        data: r.text
      };
    }

    return {
      success: false,
      error: 'No barcode detected in the image'
    };
  } catch (error) {
    throw new Error(`Failed to scan barcode: ${error.message}`);
  }
}
