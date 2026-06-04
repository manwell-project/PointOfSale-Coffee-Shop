let html5QrcodeScanner = null;

document.addEventListener('DOMContentLoaded', () => {
    initScanner();
    setupImageUpload();
});

function initScanner() {
    html5QrcodeScanner = new Html5Qrcode("reader");

    const config = { 
        fps: 30,
        disableFlip: false,
        experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
        }
    };

    const statusEl = document.getElementById('scannerStatus');
    statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Meminta izin kamera...';

    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            let cameraId = devices[0].id;
            // Prefer back camera
            for (const device of devices) {
                if (device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('environment')) {
                    cameraId = device.id;
                    break;
                }
            }
            html5QrcodeScanner.start(cameraId, config, onScanSuccess, onScanFailure)
                .then(() => {
                    statusEl.innerHTML = '<i class="fas fa-camera"></i> Arahkan kamera ke barcode produk';
                })
                .catch(err => {
                    console.error("Error starting scanner", err);
                    statusEl.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i> Gagal mengakses kamera.';
                });
        } else {
            statusEl.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i> Kamera tidak ditemukan.';
        }
    }).catch(err => {
        console.error("Error getting cameras", err);
        // Fallback attempts
        html5QrcodeScanner.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
            .catch(e => {
                html5QrcodeScanner.start({ facingMode: "user" }, config, onScanSuccess, onScanFailure)
                    .catch(e2 => {
                        statusEl.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i> Akses kamera ditolak atau tidak tersedia.';
                    });
            });
    });
}

function setupImageUpload() {
    const scanImageInput = document.getElementById('scanImageInput');
    const statusEl = document.getElementById('scannerStatus');

    if (scanImageInput) {
        scanImageInput.addEventListener('change', e => {
            if (e.target.files.length === 0) return;
            const file = e.target.files[0];
            
            if (!html5QrcodeScanner) {
                html5QrcodeScanner = new Html5Qrcode("reader");
            }
            
            statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memindai gambar...';
            
            html5QrcodeScanner.scanFile(file, true)
                .then(decodedText => {
                    onScanSuccess(decodedText, null);
                    scanImageInput.value = '';
                })
                .catch(err => {
                    statusEl.innerHTML = '<i class="fas fa-times-circle" style="color: #ef4444;"></i> Gambar tidak mengandung barcode yang jelas.';
                    scanImageInput.value = '';
                    
                    // Reset status after 3 seconds
                    setTimeout(() => {
                        if (html5QrcodeScanner.isScanning) {
                            statusEl.innerHTML = '<i class="fas fa-camera"></i> Arahkan kamera ke barcode produk';
                        }
                    }, 3000);
                });
        });
    }
}

function onScanSuccess(decodedText, decodedResult) {
    const statusEl = document.getElementById('scannerStatus');
    statusEl.innerHTML = `<i class="fas fa-check-circle" style="color: #10b981;"></i> Barcode terdeteksi: <strong>${decodedText}</strong>. Mengalihkan...`;
    
    if (html5QrcodeScanner && html5QrcodeScanner.isScanning) {
        html5QrcodeScanner.stop().catch(console.error);
    }
    
    // Redirect back to index with sku parameter
    setTimeout(() => {
        window.location.href = `index.html?sku=${encodeURIComponent(decodedText)}`;
    }, 800);
}

function onScanFailure(error) {
    // ignore
}
