import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react';

export type ImageCropShape = 'rect' | 'circle';

interface ImageCropModalProps {
  imageSrc: string;
  onConfirm: (croppedBlob: Blob) => void;
  onClose: () => void;
  /** `circle` = muestra de estampado (marco redondo + zoom) */
  cropShape?: ImageCropShape;
  title?: string;
  subtitle?: string;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageSrc,
  onConfirm,
  onClose,
  cropShape = 'rect',
  title,
  subtitle,
}) => {
  const isCircle = cropShape === 'circle';
  const [aspect, setAspect] = useState<'portrait' | 'landscape'>('portrait');

  const CROP_W = isCircle ? 800 : aspect === 'portrait' ? 1200 : 1600;
  const CROP_H = isCircle ? 800 : aspect === 'portrait' ? 1600 : 1200;
  const displayW = CROP_W / 4;
  const displayH = CROP_H / 4;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const lastOffset = useRef({ x: 0, y: 0 });

  const coverZoomForImage = useCallback(
    (img: HTMLImageElement) => {
      const scaleX = CROP_W / img.width;
      const scaleY = CROP_H / img.height;
      return Math.max(scaleX, scaleY);
    },
    [CROP_W, CROP_H]
  );

  useEffect(() => {
    setImgLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      setZoom(coverZoomForImage(img));
      setOffset({ x: 0, y: 0 });
      setRotation(0);
      setImgLoaded(true);
    };
  }, [imageSrc, coverZoomForImage]);

  useEffect(() => {
    if (!imgRef.current || !imgLoaded) return;
    setZoom(coverZoomForImage(imgRef.current));
    setOffset({ x: 0, y: 0 });
  }, [aspect, isCircle, coverZoomForImage, imgLoaded]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CROP_W, CROP_H);

    if (isCircle) {
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, CROP_W, CROP_H);
      ctx.save();
      ctx.beginPath();
      ctx.arc(CROP_W / 2, CROP_H / 2, CROP_W / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CROP_W, CROP_H);
      ctx.save();
    }

    const displayToCanvasScale = 4;
    ctx.translate(
      CROP_W / 2 + offset.x * displayToCanvasScale,
      CROP_H / 2 + offset.y * displayToCanvasScale
    );
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  }, [offset, zoom, rotation, imgLoaded, CROP_W, CROP_H, isCircle]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

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
      setOffset({
        x: lastOffset.current.x + dx,
        y: lastOffset.current.y + dy,
      });
    },
    [isDragging]
  );

  const onMouseUp = () => setIsDragging(false);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(10, Math.max(0.01, z - e.deltaY * 0.001)));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX, y: touch.clientY };
    lastOffset.current = offset;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !dragStart.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.current.x;
    const dy = touch.clientY - dragStart.current.y;
    setOffset({
      x: lastOffset.current.x + dx,
      y: lastOffset.current.y + dy,
    });
  };

  const fitToFrame = () => {
    if (!imgRef.current) return;
    const scaleX = CROP_W / imgRef.current.width;
    const scaleY = CROP_H / imgRef.current.height;
    setZoom(Math.min(scaleX, scaleY));
    setOffset({ x: 0, y: 0 });
  };

  const coverFrame = () => {
    if (!imgRef.current) return;
    setZoom(coverZoomForImage(imgRef.current));
    setOffset({ x: 0, y: 0 });
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isCircle) {
      // Exportar PNG con transparencia fuera del círculo
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = CROP_W;
      exportCanvas.height = CROP_H;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, CROP_W, CROP_H);
      ctx.save();
      ctx.beginPath();
      ctx.arc(CROP_W / 2, CROP_H / 2, CROP_W / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();
      exportCanvas.toBlob(
        (blob) => {
          if (blob) onConfirm(blob);
        },
        'image/png',
        1
      );
      return;
    }

    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      'image/webp',
      0.95
    );
  };

  const heading = title ?? (isCircle ? 'Recortar muestra' : 'Ajustar Imagen');
  const sub =
    subtitle ??
    (isCircle
      ? 'Arrastra y usa el zoom para encajar el estampado en el círculo'
      : 'Arrastra y usa la rueda para encuadrar');

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-(--bg-main) border border-(--border-main) rounded-4xl shadow-2xl w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-8 py-6 border-b border-(--border-main) shrink-0">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-(--text-main)">
              {heading}
            </h3>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">
              {sub}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-primary/10 text-(--text-main) transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="flex justify-center py-8 px-6 bg-black/40">
            <div
              className={`relative overflow-hidden shadow-2xl border-2 border-primary/40 touch-none ${
                isCircle ? 'rounded-full' : 'rounded-xl'
              }`}
              style={{
                width: displayW,
                height: displayH,
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onWheel={onWheel}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onMouseUp}
            >
              <canvas
                ref={canvasRef}
                width={CROP_W}
                height={CROP_H}
                className="block w-full h-full"
              />
              {!isCircle && (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,79,112,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,79,112,0.15) 1px, transparent 1px)',
                    backgroundSize: `${CROP_W / 12}px ${CROP_H / 12}px`,
                  }}
                />
              )}
              {isCircle && (
                <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/70 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)]" />
              )}
            </div>
          </div>

          {!isCircle && (
            <div className="px-8 py-4 flex flex-wrap justify-center gap-2 border-b border-(--border-main)/5">
              <button
                type="button"
                onClick={() => {
                  setAspect('portrait');
                }}
                className={`py-2 px-3 flex-1 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all border ${
                  aspect === 'portrait'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white/5 text-(--text-main) border-transparent hover:border-primary/20'
                }`}
              >
                Vertical (3:4)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAspect('landscape');
                }}
                className={`py-2 px-3 flex-1 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all border ${
                  aspect === 'landscape'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white/5 text-(--text-main) border-transparent hover:border-primary/20'
                }`}
              >
                Horizontal (4:3)
              </button>
            </div>
          )}

          <div className="px-8 py-4 flex flex-wrap justify-center gap-2 border-b border-(--border-main)/5">
            <button
              type="button"
              onClick={fitToFrame}
              className="flex-1 py-2 px-3 bg-white/5 hover:bg-primary/10 text-(--text-main) text-[8px] font-black uppercase tracking-widest rounded-lg transition-all border border-transparent hover:border-primary/20"
            >
              Ver todo
            </button>
            <button
              type="button"
              onClick={coverFrame}
              className="flex-1 py-2 px-3 bg-white/5 hover:bg-primary/10 text-(--text-main) text-[8px] font-black uppercase tracking-widest rounded-lg transition-all border border-transparent hover:border-primary/20"
            >
              Llenar {isCircle ? 'círculo' : 'marco'}
            </button>
            <button
              type="button"
              onClick={() => setRotation((r) => r + 90)}
              className="py-2 px-4 bg-white/5 hover:bg-primary/10 text-(--text-main) rounded-lg transition-all border border-transparent hover:border-primary/20"
              aria-label="Rotar"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-8 pt-6 pb-4 flex items-center gap-4 justify-center">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.01, z - 0.15))}
              className="p-3 rounded-full bg-white/5 hover:bg-primary/20 text-(--text-main) transition-colors"
              aria-label="Alejar"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="flex-1 relative">
              <input
                type="range"
                min={0.01}
                max={5}
                step={0.01}
                value={Math.min(5, zoom)}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-primary"
                aria-label="Zoom"
              />
            </div>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(5, z + 0.15))}
              className="p-3 rounded-full bg-white/5 hover:bg-primary/20 text-(--text-main) transition-colors"
              aria-label="Acercar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-8 pt-4 pb-8 flex gap-4 border-t border-(--border-main)/5 shrink-0 bg-(--bg-main)">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 border border-(--border-main) text-(--text-main) text-[10px] font-black uppercase tracking-widest rounded-2xl hover:border-primary/30 transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
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
