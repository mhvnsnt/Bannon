import React, { useRef, useEffect } from 'react';

interface PhotonicProps {
  flickerRateHz: number;
  colorTemperatureK: number;
  intensity: number;
}

export const PhotonicMatrix: React.FC<PhotonicProps> = ({ flickerRateHz, colorTemperatureK, intensity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastFrameTime = 0;
    let drawState = true;

    const rgb = convertKelvinToRGB(colorTemperatureK);
    const frameIntervalMs = 1000 / flickerRateHz;

    const renderLoop = (timestamp: number) => {
      if (!lastFrameTime) lastFrameTime = timestamp;
      const elapsed = timestamp - lastFrameTime;

      if (elapsed >= frameIntervalMs) {
        drawState = !drawState;
        lastFrameTime = timestamp - (elapsed % frameIntervalMs);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (drawState) {
        // Apply intensity modifiers directly to the color calculation matrix
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${intensity / 100})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        // Represent high-contrast black fields during a custom refresh gap
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationId = requestAnimationFrame(renderLoop);
    };

    animationId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationId);
  }, [flickerRateHz, colorTemperatureK, intensity]);

  return (
    <div className="w-full flex-1 min-h-0 overflow-hidden relative border border-emerald-900 shadow-2xl shadow-emerald-900/20">
      <div className="absolute inset-x-0 top-0 text-emerald-500 font-mono text-xs uppercase p-2 border-b border-emerald-900 bg-black/80 z-10 flex justify-between">
        <span>Photonic Matrix [WebGL Canvas]</span>
        <span>{flickerRateHz}Hz / {colorTemperatureK}K</span>
      </div>
      <canvas ref={canvasRef} width={800} height={400} className="w-full h-full object-cover" />
    </div>
  );
};

// Simplified standard black-body radiation color converter logic
function convertKelvinToRGB(kelvin: number) {
  let temp = kelvin / 100;
  let r, g, b;

  if (temp <= 66) {
    r = 255;
    g = temp;
    g = 99.4708025861 * Math.log(g) - 161.1195681661;
    if (temp <= 19) {
      b = 0;
    } else {
      b = temp - 10;
      b = 138.5177312231 * Math.log(b) - 305.0447927307;
    }
  } else {
    r = temp - 60;
    r = 329.698727446 * Math.pow(r, -0.1332047592);
    g = temp - 60;
    g = 288.1221695283 * Math.pow(g, -0.0755148492);
    b = 255;
  }

  return {
    r: Math.min(255, Math.max(0, r)),
    g: Math.min(255, Math.max(0, g)),
    b: Math.min(255, Math.max(0, b))
  };
}
