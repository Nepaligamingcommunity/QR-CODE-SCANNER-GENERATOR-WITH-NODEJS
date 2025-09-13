#Barcode Generator & Scanner
A comprehensive web application for generating and scanning various 1D and 2D barcode formats with a clean, responsive interface.

#Features
🖨️ Barcode Generation1D Barcodes: Code 128, Code 39, EAN-13, EAN-8, UPC-A, Code 93, ITF-14, MSI, Pharmacode, Codabar

2D Barcodes: QR Code, Data Matrix, PDF417, Aztec Code

Multiple Output Formats: PNG, SVG, JPEG, WebP

Customizable Options: Adjustable width, height, text display

Download Capability: Save generated barcodes in preferred format

📷 Barcode Scanning
Multiple Input Methods: Camera capture, file upload, drag & drop

Cross-Device Support: Works on desktop and mobile devices

Real-time Processing: Instant scanning results

Wide Format Support: Reads all major barcode types

🛠️ Technical Features
HTTPS Secure Server: Self-signed certificates for local development

RESTful API: Clean API endpoints for generation and scanning

Responsive Design: Works seamlessly on desktop and mobile devices

Modern Web Technologies: Built with Express.js, vanilla JavaScript, and modern CSS

Installation
Clone the repository

bash
git clone https://github.com/Nepaligamingcommunity/QR-CODE-SCANNER-GENERATOR-WITH-NODEJS.git
cd barcode-generator-scanner
Install dependencies

bash
npm install
Set up HTTPS certificates (for development)

bash
mkdir certs
# Generate self-signed certificates
openssl req -nodes -new -x509 -keyout certs/key.pem -out certs/cert.pem -subj "/C=US/ST=State/L=City/O=Organization/OU=Organization Unit/CN=localhost"
Start the server

bash
npm start
Access the application

Open your browser to https://localhost:8080

For mobile devices: Use your computer's IP address (e.g., https://192.168.1.100:8080)

API Reference
Generate Barcode
http
POST /api/generate
Content-Type: application/json

{
  "type": "qrcode",
  "data": "Hello World!",
  "format": "png",
  "options": {
    "width": 2,
    "height": 100,
    "displayValue": true
  }
}
Scan Barcode
http
POST /api/scan
Content-Type: multipart/form-data

# Include image file in the request
Get Supported Types
http
GET /api/types
Usage Examples
Generating a QR Code
Select "QR Code" from the barcode type dropdown

Enter the text or URL you want to encode

Adjust settings as needed (size, format)

Click "Generate Barcode"

Download the generated barcode

Scanning a Barcode
Go to the Scanner tab

Choose your input method:

Use your device's camera

Upload an image file

Drag and drop an image

View the decoded results instantly

Browser Support
Chrome 60+

Firefox 55+

Safari 12+

Edge 79+

Mobile browsers (iOS Safari, Chrome Mobile)

Project Structure
text
barcode-generator-scanner/
├── public/                 # Frontend assets
│   ├── index.html         # Main application page
│   ├── styles.css         # Application styles
│   └── favicon.ico        # App favicon
├── src/
│   └── services/
│       ├── barcodeGenerator.js  # Barcode generation logic
│       └── barcodeScanner.js    # Barcode scanning logic
├── certs/                 # HTTPS certificates
├── uploads/               # Temporary file storage
├── server.js              # Express server
└── package.json           # Dependencies and scripts
Technologies Used
Backend: Node.js, Express.js

Frontend: Vanilla JavaScript, HTML5, CSS3

Barcode Generation: JsBarcode, QRCode, bwip-js

Barcode Scanning: Dynamsoft Barcode Reader

Image Processing: Canvas API, Multer

Security: HTTPS, CORS

Contributing
Fork the repository

Create a feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request

License
This project is licensed under the MIT License - see the LICENSE file for details.

Troubleshooting
Common Issues
HTSSL Certificate Warnings

This is expected with self-signed certificates

Click "Advanced" and "Proceed anyway" in your browser

Cannot Access from Other Devices

Check firewall settings to allow port 8080

Ensure you're using the correct IP address

Visit /network for diagnostic tools

Camera Not Working

Ensure you're using HTTPS

Grant camera permissions in your browser

Support
If you encounter any problems or have questions:

Check the troubleshooting section above

Search existing GitHub issues

Create a new issue with details about your problem

Acknowledgments
Icons by Font Awesome

Barcode generation libraries: JsBarcode, QRCode, bwip-js

Barcode scanning: Dynamsoft Barcode Reader
