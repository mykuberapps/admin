"use client";

import React, { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { 
  X, ZoomIn, ZoomOut, RotateCw, RotateCcw, 
  FlipHorizontal, FlipVertical, RefreshCw, 
  Check, Crop, Image as ImageIcon, Settings, SlidersHorizontal
} from 'lucide-react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

interface ImageAdjusterProps {
  type: 'poster' | 'backdrop';
  imageUrl: string;
  onCancel: () => void;
  onApply: (dataUrl: string) => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageAdjuster({ type, imageUrl, onCancel, onApply }: ImageAdjusterProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const aspectRatio = type === 'poster' ? 3 / 4 : 1 / 1.43;
  const targetWidth = type === 'poster' ? 900 : 1080;
  const targetHeight = type === 'poster' ? 1200 : 1540;

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleZoomIn = () => setZoom((prev: number) => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom((prev: number) => Math.max(prev - 0.1, 0.5));
  const handleRotateLeft = () => setRotation((prev: number) => prev - 90);
  const handleRotateRight = () => setRotation((prev: number) => prev + 90);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlipX(false);
    setFlipY(false);
  };

  const createImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });
  };

  const getRadianAngle = (degreeValue: number) => {
    return (degreeValue * Math.PI) / 180;
  };

  const applyTransformations = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);

    try {
      const image = await createImage(imageUrl);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const { x, y, width: cropW, height: cropH } = croppedAreaPixels;

      ctx.save();
      ctx.translate(targetWidth / 2, targetHeight / 2);
      ctx.rotate(getRadianAngle(rotation));
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      ctx.translate(-targetWidth / 2, -targetHeight / 2);

      ctx.drawImage(
        image,
        x, y, cropW, cropH,
        0, 0, targetWidth, targetHeight
      );

      ctx.restore();

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      onApply(dataUrl);
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-6xl h-[85vh] bg-white border border-gray-200 shadow-2xl flex flex-col font-sans rounded text-sm overflow-hidden">
        
        {/* Header */}
        <header className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Crop className="text-gray-500" size={16} />
            <div>
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Asset Transformation Pipeline</h3>
              <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                TARGET_ASPECT: {type === 'poster' ? '3:4' : '1:1.43'} | OUTPUT_RES: {targetWidth}x{targetHeight}px
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
            title="Abort Transformation"
          >
            <X size={16} />
          </button>
        </header>

        {/* Workspace Container */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-gray-100">
          
          {/* Interactive Cropper Stage */}
          <div className="flex-1 relative bg-[#111827] border-r border-gray-200 min-h-[400px]">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              cropShape="rect"
              showGrid={true}
              zoomWithScroll={true}
              style={{
                containerStyle: { background: '#111827' },
                mediaStyle: { transform: `scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})` },
                cropAreaStyle: { border: '1px solid rgba(255, 255, 255, 0.4)', boxShadow: '0 0 0 9999em rgba(0, 0, 0, 0.6)' }
              }}
            />
          </div>

          {/* Configuration Panel */}
          <div className="w-full lg:w-80 bg-white flex flex-col shrink-0">
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-gray-500" />
              <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider font-mono">Parameters</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              
              {/* Zoom Control */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">Scale Factor</label>
                  <span className="text-xs font-mono text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                    {(zoom * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleZoomOut} className="p-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-600 transition-colors">
                    <ZoomOut size={14} />
                  </button>
                  <div className="flex-1 px-1">
                    <Slider
                      value={zoom}
                      min={0.5} max={3} step={0.01}
                      onChange={(val) => setZoom(Array.isArray(val) ? val[0] : val)}
                      trackStyle={{ backgroundColor: '#2563eb', height: 2 }}
                      railStyle={{ backgroundColor: '#e5e7eb', height: 2 }}
                      handleStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#9ca3af',
                        width: 12, height: 12,
                        marginTop: -5,
                        borderRadius: 2,
                        boxShadow: 'none'
                      }}
                    />
                  </div>
                  <button onClick={handleZoomIn} className="p-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-600 transition-colors">
                    <ZoomIn size={14} />
                  </button>
                </div>
              </div>

              {/* Rotation Control */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">Rotation</label>
                  <span className="text-xs font-mono text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                    {rotation}°
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleRotateLeft} className="flex-1 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors">
                    <RotateCcw size={12} /> -90°
                  </button>
                  <button onClick={handleRotateRight} className="flex-1 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors">
                    <RotateCw size={12} /> +90°
                  </button>
                </div>
              </div>

              {/* Flip Controls */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">Mirroring</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setFlipX(!flipX)} className={`flex-1 py-1.5 border rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${flipX ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                    <FlipHorizontal size={12} /> X-Axis
                  </button>
                  <button onClick={() => setFlipY(!flipY)} className={`flex-1 py-1.5 border rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${flipY ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                    <FlipVertical size={12} /> Y-Axis
                  </button>
                </div>
              </div>

              {/* Technical Spec Box */}
              <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <Settings size={14} className="text-gray-500" />
                  <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider font-mono">Output Specs</span>
                </div>
                <div className="space-y-1 text-xs text-gray-600 font-mono">
                  <div className="flex justify-between"><span>Format:</span> <span>JPEG (95%)</span></div>
                  <div className="flex justify-between"><span>Width:</span> <span>{targetWidth}px</span></div>
                  <div className="flex justify-between"><span>Height:</span> <span>{targetHeight}px</span></div>
                </div>
              </div>
            </div>

            {/* Execution Actions */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3 shrink-0">
              <button
                onClick={handleReset}
                className="flex-1 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw size={14} /> Reset State
              </button>
              <button
                onClick={applyTransformations}
                disabled={isProcessing}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check size={14} /> Commit Output
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Invisible Canvas for Processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}