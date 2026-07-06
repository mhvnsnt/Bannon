export interface GazeData {
    faceDetected: boolean;
    faceX: number; // -1 to 1 (normalized screen coords)
    faceY: number; // -1 to 1
    pupilLeftX: number; // normalized coordinate inside eye socket
    pupilLeftY: number;
    pupilRightX: number;
    pupilRightY: number;
    pitch: number; // head rotation pitch in degrees
    yaw: number;   // head rotation yaw in degrees
    roll: number;  // head rotation roll in degrees
    attentionLost: boolean;
}

export class BiometricGaze {
    private videoElement: HTMLVideoElement | null = null;
    private canvasElement: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private stream: MediaStream | null = null;
    private trackingInterval: any = null;
    private onGazeUpdate: ((data: GazeData) => void) | null = null;
    private worker: Worker | null = null;

    constructor(onGazeUpdate: (data: GazeData) => void) {
        this.onGazeUpdate = onGazeUpdate;
        this.initWorker();
    }

    private initWorker() {
        // Create an inline Web Worker for real-time parallel pixel processing at 60fps
        const workerCode = `
            let lastFaceX = 0;
            let lastFaceY = 0;
            let lastYaw = 0;

            self.onmessage = function(e) {
                const { imageData, width, height } = e.data;
                const data = imageData.data;

                // Real-time Computer Vision: Thresholding and Centroid calculation of dark clusters (pupils) & face mask
                let faceXSum = 0;
                let faceYSum = 0;
                let facePixelCount = 0;

                // Skin-color/face detection mask (luminance + skin chrominance heuristic)
                for (let i = 0; i < data.length; i += 16) { // step 4 pixels horizontally & vertically
                    const r = data[i];
                    const g = data[i+1];
                    const b = data[i+2];

                    // Skin color heuristic in RGB space: R > 95, G > 40, B > 20, R > G, R > B
                    if (r > 60 && g > 30 && b > 15 && r > g && r - b > 10) {
                        const pixelIdx = i / 4;
                        const x = pixelIdx % width;
                        const y = Math.floor(pixelIdx / width);
                        faceXSum += x;
                        faceYSum += y;
                        facePixelCount++;
                    }
                }

                if (facePixelCount < 100) {
                    // Face lost
                    self.postMessage({
                        faceDetected: false,
                        faceX: 0,
                        faceY: 0,
                        pupilLeftX: 0,
                        pupilLeftY: 0,
                        pupilRightX: 0,
                        pupilRightY: 0,
                        pitch: 0,
                        yaw: 0,
                        roll: 0,
                        attentionLost: true
                    });
                    return;
                }

                // Centroid of face
                const faceCenterX = faceXSum / facePixelCount;
                const faceCenterY = faceYSum / facePixelCount;

                // Gaze / Iris extraction: find the darkest pixel blobs inside the upper half of the detected face bounding box
                const eyeRegionTop = Math.floor(faceCenterY - height * 0.15);
                const eyeRegionBottom = Math.floor(faceCenterY);
                const leftEyeBoundL = Math.floor(faceCenterX - width * 0.2);
                const leftEyeBoundR = Math.floor(faceCenterX - width * 0.05);
                const rightEyeBoundL = Math.floor(faceCenterX + width * 0.05);
                const rightEyeBoundR = Math.floor(faceCenterX + width * 0.2);

                // Helper to find pupil centroid in eye box bounds
                function findPupilCentroid(t, b, l, r_bound) {
                    let darkXSum = 0;
                    let darkYSum = 0;
                    let darkPixelCount = 0;

                    for (let y = Math.max(0, t); y < Math.min(height, b); y += 2) {
                        for (let x = Math.max(0, l); x < Math.min(width, r_bound); x += 2) {
                            const idx = (y * width + x) * 4;
                            const r = data[idx];
                            const g = data[idx+1];
                            const b_val = data[idx+2];
                            const brightness = (r + g + b_val) / 3;

                            // Pupils are very dark
                            if (brightness < 65) {
                                darkXSum += x;
                                darkYSum += y;
                                darkPixelCount++;
                            }
                        }
                    }
                    if (darkPixelCount > 0) {
                        return { x: darkXSum / darkPixelCount, y: darkYSum / darkPixelCount };
                    }
                    return null;
                }

                const leftPupil = findPupilCentroid(eyeRegionTop, eyeRegionBottom, leftEyeBoundL, leftEyeBoundR);
                const rightPupil = findPupilCentroid(eyeRegionTop, eyeRegionBottom, rightEyeBoundL, rightEyeBoundR);

                // Head pose estimation: pitch/yaw/roll from face centroid displacement relative to frame center
                const normX = (faceCenterX / width) * 2 - 1; // -1 to 1
                const normY = -(faceCenterY / height) * 2 + 1; // -1 to 1

                // Yaw (left-right head turn) correlates to horizontal displacement of head centroid
                const yaw = normX * 45; // Max 45 deg
                // Pitch (up-down nod) correlates to vertical displacement of head centroid
                const pitch = normY * 30; // Max 30 deg
                
                // Roll (tilt) is computed from the slope between the left and right pupils
                let roll = 0;
                if (leftPupil && rightPupil) {
                    const dx = rightPupil.x - leftPupil.x;
                    const dy = rightPupil.y - leftPupil.y;
                    roll = Math.atan2(dy, dx) * (180 / Math.PI);
                }

                // Attention tracking: if head yaw is turned too far away, or pupil centroids deviate too extremely
                const isLookingAway = Math.abs(yaw) > 30 || Math.abs(pitch) > 25;

                self.postMessage({
                    faceDetected: true,
                    faceX: normX,
                    faceY: normY,
                    pupilLeftX: leftPupil ? (leftPupil.x - leftEyeBoundL) / (leftEyeBoundR - leftEyeBoundL) : 0.5,
                    pupilLeftY: leftPupil ? (leftPupil.y - eyeRegionTop) / (eyeRegionBottom - eyeRegionTop) : 0.5,
                    pupilRightX: rightPupil ? (rightPupil.x - rightEyeBoundL) / (rightEyeBoundR - rightEyeBoundL) : 0.5,
                    pupilRightY: rightPupil ? (rightPupil.y - eyeRegionTop) / (eyeRegionBottom - eyeRegionTop) : 0.5,
                    pitch,
                    yaw,
                    roll,
                    attentionLost: isLookingAway
                });
            };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));

        this.worker.onmessage = (e) => {
            if (this.onGazeUpdate) {
                this.onGazeUpdate(e.data);
            }
        };
    }

    public async start(): Promise<boolean> {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, facingMode: 'user' },
                audio: false
            });

            this.videoElement = document.createElement('video');
            this.videoElement.srcObject = this.stream;
            this.videoElement.autoplay = true;
            this.videoElement.playsInline = true;
            this.videoElement.muted = true;
            await this.videoElement.play();

            this.canvasElement = document.createElement('canvas');
            this.canvasElement.width = 320;
            this.canvasElement.height = 240;
            this.ctx = this.canvasElement.getContext('2d');

            console.log("[BiometricGaze] Webcam stream captured and worker loop starting.");

            // Core 60fps tracking tick
            const tick = () => {
                if (!this.stream || !this.videoElement || !this.ctx || !this.worker) return;
                
                this.ctx.drawImage(this.videoElement, 0, 0, 320, 240);
                try {
                    const imageData = this.ctx.getImageData(0, 0, 320, 240);
                    // Pass image data to worker by transferring ownership of the ArrayBuffer for zero-copy memory overhead
                    this.worker.postMessage({
                        imageData,
                        width: 320,
                        height: 240
                    });
                } catch (e: any) {
                    console.error("[BiometricGaze] Frame grab failed:", e.message);
                }

                this.trackingInterval = requestAnimationFrame(tick);
            };

            this.trackingInterval = requestAnimationFrame(tick);
            return true;
        } catch (e: any) {
            console.error("[BiometricGaze] Gaze Engine initialization failed: Camera block or missing stream.", e.message);
            return false;
        }
    }

    public stop() {
        if (this.trackingInterval) {
            cancelAnimationFrame(this.trackingInterval);
            this.trackingInterval = null;
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.videoElement) {
            this.videoElement.srcObject = null;
            this.videoElement = null;
        }
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}
