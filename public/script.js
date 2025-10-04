class BarcodeApp {
    constructor() {
        this.currentTab = 'generator';
        this.cameraStream = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupRangeInputs();
        this.setupDropZone();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Generator events
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateBarcode();
        });

        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadBarcode();
        });

        // Scanner events
        document.getElementById('cameraBtn').addEventListener('click', () => {
            this.toggleCamera();
        });

        document.getElementById('uploadBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this.scanImage(e.target.files[0]);
            }
        });

        // Barcode type change
        document.getElementById('barcodeType').addEventListener('change', () => {
            this.updateSampleData();
        });
    }

    setupRangeInputs() {
        const ranges = ['barcodeWidth', 'barcodeHeight'];
        ranges.forEach(id => {
            const input = document.getElementById(id);
            const valueSpan = input.nextElementSibling;
            
            input.addEventListener('input', () => {
                valueSpan.textContent = input.value;
            });
        });
    }

    setupDropZone() {
        const dropZone = document.getElementById('dropZone');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('dragover');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.scanImage(files[0]);
            }
        }, false);

        dropZone.addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // Stop camera if switching away from scanner
        if (tabName !== 'scanner' && this.cameraStream) {
            this.stopCamera();
        }
    }

    updateSampleData() {
        const type = document.getElementById('barcodeType').value;
        const dataInput = document.getElementById('barcodeData');
        
        const sampleData = {
            'CODE128': 'Hello World!',
            'CODE39': 'HELLO123',
            'EAN13': '1234567890123',
            'EAN8': '12345678',
            'UPC': '123456789012',
            'CODE93': 'HELLO123',
            'ITF14': '12345678901234',
            'MSI': '1234567890',
            'pharmacode': '123456',
            'codabar': 'A123456B',
            'qrcode': 'https://example.com',
            'datamatrix': 'Hello Data Matrix!',
            'pdf417': 'PDF417 Sample Data',
            'aztec': 'Aztec Code Sample'
        };

        if (sampleData[type] && dataInput.value === dataInput.defaultValue) {
            dataInput.value = sampleData[type];
        }
    }

    async generateBarcode() {
        const type = document.getElementById('barcodeType').value;
        const data = document.getElementById('barcodeData').value.trim();
        const format = document.getElementById('outputFormat').value;
        
        if (!data) {
            this.showError('Please enter data to encode');
            return;
        }

        const options = {
            width: parseFloat(document.getElementById('barcodeWidth').value),
            height: parseInt(document.getElementById('barcodeHeight').value),
            displayValue: document.getElementById('showText').checked
        };

        this.showLoading(true);

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type, data, format, options })
            });

            const result = await response.json();

            if (result.success) {
                this.displayGeneratedBarcode(result);
            } else {
                this.showError(result.error || 'Failed to generate barcode');
            }
        } catch (error) {
            this.showError('Network error: ' + error.message);
        } finally {
            this.showLoading(false);
        }

        
    }

    displayGeneratedBarcode(result) {
        const preview = document.getElementById('barcodePreview');
        const resultSection = document.getElementById('generatorResult');
        
        if (result.format === 'svg') {
            preview.innerHTML = result.data;
        } else {
            preview.innerHTML = `<img src="${result.data}" alt="Generated barcode">`;
        }

        // Store result for download
        this.lastGeneratedBarcode = result;
        
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });

        if (result.note) {
            this.showInfo(result.note);
        }

        
    }

    downloadBarcode() {
        if (!this.lastGeneratedBarcode) return;

        const { type, format, data } = this.lastGeneratedBarcode;
        const filename = `barcode_${type}_${Date.now()}`;
        const link = document.createElement('a');

        if (format === 'svg') {
            // Raw SVG → Blob
            const blob = new Blob([data], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);

            link.href = url;
            link.download = `${filename}.svg`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
        } else {
            // Expect a valid dataURL
            if (!data.startsWith('data:image/')) {
                this.showError(`Invalid ${format} data returned by server.`);
                return;
            }

            link.href = data;
            link.download = `${filename}.${format}`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    async toggleCamera() {
        const btn = document.getElementById('cameraBtn');
        const video = document.getElementById('cameraVideo');

        if (this.cameraStream) {
            this.stopCamera();
            btn.innerHTML = '<i class="fas fa-video"></i> Start Camera';
            video.style.display = 'none';
        } else {
            try {
                this.cameraStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' } 
                });
                video.srcObject = this.cameraStream;
                video.style.display = 'block';
                btn.innerHTML = '<i class="fas fa-stop"></i> Stop Camera';
                
                // Start scanning frames
                this.startCameraScanning();
            } catch (error) {
                this.showError('Camera access denied or not available');
            }
        }
    }

    stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        if (this.scanningInterval) {
            clearInterval(this.scanningInterval);
            this.scanningInterval = null;
        }
    }

    startCameraScanning() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('cameraCanvas');
        const ctx = canvas.getContext('2d');

        this.scanningInterval = setInterval(() => {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);
                
                // Convert canvas to blob and scan
                canvas.toBlob((blob) => {
                    if (blob) {
                        this.scanImageBlob(blob);
                    }
                });
            }
        }, 1000); // Scan every second
    }

    

    async scanImage(file) {
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file');
            return;
        }

        this.showLoading(true);

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/api/scan', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            this.displayScanResult(result);
        } catch (error) {
            this.showError('Network error: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async scanImageBlob(blob) {
        const formData = new FormData();
        formData.append('image', blob, 'camera-capture.png');

        try {
            const response = await fetch('/api/scan', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.success) {
                this.displayScanResult(result);
                this.stopCamera(); // Stop camera after successful scan
                document.getElementById('cameraBtn').innerHTML = '<i class="fas fa-video"></i> Start Camera';
                document.getElementById('cameraVideo').style.display = 'none';
            }
        } catch (error) {
            // Silently fail for camera scanning to avoid spam
            console.log('Camera scan error:', error);
        }
    }

    displayScanResult(result) {
        const resultSection = document.getElementById('scannerResult');
        const scanResult = document.getElementById('scanResult');
        
        if (result.success) {
            scanResult.innerHTML = `
                <div class="scan-result">
    <h4><i class="fas fa-check-circle"></i> Barcode Detected!</h4>
    <p><strong>Type:</strong> ${result.type}</p>
    <p>
        <strong>Data:</strong> 
       <span id="barcode-data-${result.id}">
            ${
                /^(https?:\/\/[^\s]+)$/.test(result.data)
                ? `<a href="${result.data}" target="_blank" style="color: black; text-decoration: underline;">${result.data}</a>`
                : `<span style="color: black;">${result.data}</span>`
            }
        </span>
        <i class="fas fa-copy" style="cursor:pointer; margin-left:5px;"
   onclick="navigator.clipboard.writeText('${result.data.replace(/'/g, "\\'")}')"></i>

    </p>
    ${result.location ? `<p><strong>Location:</strong> Found in image</p>` : ''}
    ${result.note ? `<p><em>${result.note}</em></p>` : ''}
</div>

            `;
        } else {
            scanResult.innerHTML = `
                <div class="scan-result error">
                    <h4><i class="fas fa-exclamation-circle"></i> No Barcode Found</h4>
                    <p>${result.error || 'No barcode could be detected in the image'}</p>
                    <p><em>Try using a clearer image with better lighting</em></p>
                </div>
            `;
        }

        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        alert('Error: ' + message);
    }

    showInfo(message) {
        alert('Info: ' + message);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BarcodeApp();
});
