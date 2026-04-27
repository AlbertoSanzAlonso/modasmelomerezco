import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react';

interface ImageCropModalProps {
  imageSrc: string;
  onConfirm: (croppedBlob: Blob) => void;
  onClose: () => void;
}

/**
 * Modal that lets the user pan/zoom an image within a fixed 3:4 crop frame.
 * On confirm, the visible area is rendered to a canvas and returned as WebP.
 */
export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageSrc,
  onConfirm,
  onClose,
}) => {
  const CROP_W = 300;
  const CROP_H = 400; // 3:4

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);

  // State: position of image center within the viewport (px)
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const lastOffset = useRef({ x: 0, y: 0 });

  // Load original image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      // Fit image to crop frame at start
      const scaleX = CROP_W / img.width;
      const scaleY = CROP_H / img.height;
      const fitScale = Math.max(scaleX, scaleY);
      setZoom(fitScale);
      setOffset({ x: 0, y: 0 });
      setImgLoaded(true);
    };
  }, [imageSrc]);

  // Draw preview on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CROP_W, CROP_H);
    ctx.save();

    // Translate to center
    ctx.translate(CROP_W / 2 + offset.x, CROP_H / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  }, [offset, zoom, rotation, imgLoaded]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  // Mouse drag
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    lastOffset.current = offset;
  };

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !dragStart.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setOffset({ x: lastOffset.current.x + dx, y: lastOffset.current.y + dy });
    },
    [isDragging]
  );

  const onMouseUp = () => setIsDragging(false);

  // Scroll to zoom
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(5, Math.max(0.3, z - e.deltaY * 0.001)));
  };

  // Touch drag (mobile)
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastOffset.current = offset;
    }
  };
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && touchStart.current) {
        const dx = e.touches[0].clientX - touchStart.current.x;
        const dy = e.touches[0].clientY - touchStart.current.y;
        setOffset({ x: lastOffset.current.x + dx, y: lastOffset.current.y + dy });
      }
    },
    []
  );

  // Confirm: export canvas as WebP
  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      'image/webp',
      0.88
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-(--bg-main) border border-(--border-main) rounded-4xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-(--border-main)">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-(--text-main)">
              Ajustar Imagen
            </h3>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">
              Arrastra y usa la rueda para encuadrar
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-primary/10 text-(--text-main) transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop frame */}
        <div className="flex justify-center py-8 px-6 bg-black/40">
          <div
            className="relative overflow-hidden rounded-xl shadow-2xl border-2 border-primary/40"
            style={{ width: CROP_W, height: CROP_H, cursor: isDragging ? 'grabbing' : 'grab' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={() => { touchStart.current = null; }}
          >
            <canvas
              ref={canvasRef}
              width={CROP_W}
              height={CROP_H}
              className="block"
            />
            {/* Grid overlay */}
            <div className="pointer-events-none absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(255,79,112,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,79,112,0.15) 1px, transparent 1px)',
              backgroundSize: `${CROP_W/3}px ${CROP_H/3}px`
            }} />
          </div>
        </div>

        {/* Controls */}
        <div className="px-8 pb-4 flex items-center gap-4 justify-center">
          <button
            onClick={() => setZoom((z) => Math.max(0.3, z - 0.15))}
            className="p-3 rounded-full bg-white/5 hover:bg-primary/20 text-(--text-main) transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="flex-1 relative">
            <input
              type="range"
              min={0.3}
              max={5}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <button
            onClick={() => setZoom((z) => Math.min(5, z + 0.15))}
            className="p-3 rounded-full bg-white/5 hover:bg-primary/20 text-(--text-main) transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRotation((r) => r + 90)}
            className="p-3 rounded-full bg-white/5 hover:bg-primary/20 text-(--text-main) transition-colors"
            title="Rotar 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="px-8 pb-8 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 border border-(--border-main) text-(--text-main) text-[10px] font-black uppercase tracking-widest rounded-2xl hover:border-primary/30 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-secondary transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};
