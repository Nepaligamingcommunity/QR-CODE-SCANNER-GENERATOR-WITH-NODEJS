document.addEventListener('DOMContentLoaded', function() {
            const helpTabButtons = document.querySelectorAll('.help-tab-button');
            
            helpTabButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const tabId = this.getAttribute('data-helptab');
                    
                    // Remove active class from all buttons and content
                    document.querySelectorAll('.help-tab-button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    document.querySelectorAll('.help-tab-content').forEach(content => {
                        content.classList.remove('active');
                    });
                    
                    // Add active class to current button and content
                    this.classList.add('active');
                    document.getElementById(tabId).classList.add('active');
                });
            });
            
            // Camera selection functionality
            const cameraSelect = document.getElementById('cameraSelect');
            const switchCameraBtn = document.getElementById('switchCameraBtn');
            const cameraControls = document.getElementById('cameraControls');
            const cameraBtn = document.getElementById('cameraBtn');
            const cameraVideo = document.getElementById('cameraVideo');
            
            let currentStream = null;
            let cameras = [];
            
            // Function to stop the current video stream
            function stopVideoStream() {
                if (currentStream) {
                    currentStream.getTracks().forEach(track => track.stop());
                    currentStream = null;
                }
            }
            
            // Function to get available cameras
            async function getCameras() {
                try {
                    // First get permission by accessing a camera
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    stopVideoStream(); // Stop immediately after getting permission
                    
                    // Now enumerate devices
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    cameras = devices.filter(device => device.kind === 'videoinput');
                    
                    // Populate the camera select dropdown
                    cameraSelect.innerHTML = '<option value="">Select Camera...</option>';
                    cameras.forEach((camera, index) => {
                        cameraSelect.innerHTML += `<option value="${camera.deviceId}">${camera.label || `Camera ${index + 1}`}</option>`;
                    });
                    
                    return cameras;
                } catch (error) {
                    console.error('Error accessing cameras:', error);
                    alert('Could not access cameras. Please check permissions.');
                    return [];
                }
            }
            
            // Function to start camera with specific device
            async function startCamera(deviceId) {
                // Stop any existing stream
                stopVideoStream();
                
                try {
                    const constraints = {
                        video: deviceId ? { deviceId: { exact: deviceId } } : true
                    };
                    
                    currentStream = await navigator.mediaDevices.getUserMedia(constraints);
                    cameraVideo.srcObject = currentStream;
                    cameraVideo.style.display = 'block';
                    
                    // Update UI
                    cameraBtn.textContent = 'Stop Camera';
                    cameraBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Camera';
                    cameraControls.style.display = 'flex';
                    
                    return true;
                } catch (error) {
                    console.error('Error starting camera:', error);
                    alert('Could not start camera. Please try another one.');
                    return false;
                }
            }
            
            // Event listener for camera button
            cameraBtn.addEventListener('click', async function() {
                if (currentStream) {
                    // Stop the camera
                    stopVideoStream();
                    cameraVideo.style.display = 'none';
                    this.textContent = 'Start Camera';
                    this.innerHTML = '<i class="fas fa-video"></i> Start Camera';
                    cameraControls.style.display = 'none';
                } else {
                    // Start the camera
                    if (cameras.length === 0) {
                        await getCameras();
                    }
                    
                    if (cameras.length > 0) {
                        const success = await startCamera(cameras[0].deviceId);
                        if (success && cameras.length > 1) {
                            cameraControls.style.display = 'flex';
                        }
                    } else {
                        alert('No cameras found.');
                    }
                }
            });
            
            // Event listener for camera selection change
            cameraSelect.addEventListener('change', async function() {
                if (this.value) {
                    await startCamera(this.value);
                }
            });
            
            // Event listener for switch camera button
            switchCameraBtn.addEventListener('click', async function() {
                if (cameras.length < 2) {
                    alert('Only one camera available.');
                    return;
                }
                
                // Get current selected camera index
                const currentIndex = cameras.findIndex(camera => 
                    camera.deviceId === cameraSelect.value
                );
                
                // Calculate next camera index
                const nextIndex = (currentIndex + 1) % cameras.length;
                
                // Switch to next camera
                cameraSelect.value = cameras[nextIndex].deviceId;
                await startCamera(cameras[nextIndex].deviceId);
            });
        });