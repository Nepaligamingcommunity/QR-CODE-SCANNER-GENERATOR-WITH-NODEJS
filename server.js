import express from 'express';
import https from 'https';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import fs from 'fs';
import os from 'os';
import favicon from 'serve-favicon';
import { generateBarcode } from './src/services/barcodeGenerator.js';
import { scanBarcode } from './src/services/barcodeScanner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load HTTPS certs
const privateKey = fs.readFileSync('certs/key.pem', 'utf8');
const certificate = fs.readFileSync('certs/cert.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

// Get local IPv4 address
const getIPv4Address = () => {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }

 
  return '127.0.0.1';
};



const app = express();
const PORT = process.env.PORT || 8080;
const HOST = getIPv4Address();


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));



// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
     const allowedTypes = /jpeg|jpg|png|gif|bmp|webp|tiff|tif|raw|heif|heic|svg|ico|exif|pdf|indd|psd/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Generate barcode endpoint
// Generate barcode endpoint
app.post('/api/generate', async (req, res) => {
  try {
    let { type, data, format = 'png', options = {} } = req.body;

    // Validate required fields
    if (!type || !data) {
      return res.status(400).json({ error: 'Type and data are required' });
    }

    // Normalize format to lowercase
    format = format.toLowerCase();

    // Allowed formats
    const allowedFormats = ['png', 'svg', 'jpg', 'jpeg', 'gif', 'webp', 'pdf'];
    if (!allowedFormats.includes(format)) {
      return res.status(400).json({ error: `Invalid format. Allowed: ${allowedFormats.join(', ')}` });
    }

    const result = await generateBarcode(type, data, format, options);
    res.json(result);
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message });
  }
});


// Scan barcode endpoint
app.post('/api/scan', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const result = await scanBarcode(req.file.path);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json(result);
  } catch (error) {
    console.error('Scanning error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// Get supported barcode types
app.get('/api/types', (req, res) => {
  const types = {
    '1d': [
      { value: 'CODE128', label: 'Code 128', description: 'High-density linear barcode' },
      { value: 'CODE39', label: 'Code 39', description: 'Alphanumeric barcode' },
      { value: 'EAN13', label: 'EAN-13', description: 'European Article Number' },
      { value: 'EAN8', label: 'EAN-8', description: 'Short version of EAN-13' },
      { value: 'UPC', label: 'UPC-A', description: 'Universal Product Code' },
      { value: 'CODE93', label: 'Code 93', description: 'Compact alphanumeric barcode' },
      { value: 'ITF14', label: 'ITF-14', description: 'Interleaved 2 of 5' },
      { value: 'MSI', label: 'MSI', description: 'Modified Plessey' },
      { value: 'pharmacode', label: 'Pharmacode', description: 'Pharmaceutical barcode' },
      { value: 'codabar', label: 'Codabar', description: 'Variable-width barcode' }
    ],
    '2d': [
      { value: 'qrcode', label: 'QR Code', description: 'Quick Response code' },
      { value: 'datamatrix', label: 'Data Matrix', description: '2D matrix barcode' },
      { value: 'pdf417', label: 'PDF417', description: 'Portable Data File' },
      { value: 'aztec', label: 'Aztec Code', description: '2D matrix barcode' }
    ]
  };
  res.json(types);
});

// Start HTTPS server
https.createServer(credentials, app).listen(PORT, HOST, () => {
  console.log(`🚀 HTTPS Server running at https://${HOST}:${PORT}`);
});
