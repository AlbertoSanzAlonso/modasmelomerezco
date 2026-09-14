import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Loader2 } from 'lucide-react';

export type ImageCropShape = 'rect' | 'circle';

interface ImageCropModalProps {
  imageSrc: string;
  onConfirm: (croppedBlob: Blob) => void | Promise<void>;
  onClose: () => void;
  /** `circle` = muestra de estampado (marco redondo + zoom) */
  cropShape?: ImageCropShape;
  title?: string;
  subtitle?: string;
  /** Deshabilita confirmar/cancelar mientras el padre sube la imagen */
  isBusy?: boolean;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageSrc,
  onConfirm,
  onClose,
  cropShape = 'rect',
  title,
  subtitle,
  isBusy = false,
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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

  const zoomMax = Math.max(5, zoom, imgRef.current ? coverZoomForImage(imgRef.current) * 2 : 5);

  useEffect(() => {
    let cancelled = false;
    setImgLoaded(false);
    setLoadError(null);
    imgRef.current = null;

    const img = new Image();
    // blob:/data: no necesitan CORS; forzarlo puede fallar en algunos navegadores
    if (/^https?:\/\//i.test(imageSrc)) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      if (cancelled) return;
      if (!img.width || !img.height) {
        setLoadError('La imagen no se pudo decodificar.');
        return;
      }
      imgRef.current = img;
      setZoom(coverZoomForImage(img));
      setOffset({ x: 0, y: 0 });
      setRotation(0);
      setImgLoaded(true);
    };
    img.onerror = () => {
      if (cancelled) return;
      setLoadError(
        'No se pudo cargar la imagen para recortar. Cierra e inténtalo de nuevo.'
      );
    };
    img.src = imageSrc;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
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
    if (isBusy || isExporting || !imgLoaded) return;
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
    if (isBusy || isExporting || !imgLoaded) return;
    e.preventDefault();
    setZoom((z) => Math.min(10, Math.max(0.01, z - e.deltaY * 0.001)));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (isBusy || isExporting || !imgLoaded) return;
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

  const exportBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
    new Promise((resolve, reject) => {
      if (isCircle) {
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = CROP_W;
        exportCanvas.height = CROP_H;
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo exportar el recorte'));
          return;
        }
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
            if (blob) resolve(blob);
            else reject(new Error('No se pudo exportar el recorte'));
          },
          'image/png',
          1
        );
        return;
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
            return;
          }
          canvas.toBlob(
            (pngBlob) => {
              if (pngBlob) resolve(pngBlob);
              else reject(new Error('No se pudo exportar el recorte'));
            },
            'image/png',
            1
          );
        },
        'image/webp',
        0.95
      );
    });

  const handleConfirm = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgLoaded || loadError || isBusy || isExporting) return;

    // Asegurar un frame pintado antes de exportar
    draw();
    setIsExporting(true);
    try {
      const blob = await exportBlob(canvas);
      await onConfirm(blob);
    } catch (err) {
      console.error('Crop export failed:', err);
      setLoadError(
        err instanceof Error
          ? err.message
          : 'No se pudo exportar el recorte. Inténtalo de nuevo.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const heading = title ?? (isCircle ? 'Recortar muestra' : 'Ajustar Imagen');
  const sub =
    subtitle ??
    (isCircle
      ? 'Arrastra y usa el zoom para encajar el estampado en el círculo'
      : 'Arrastra y usa la rueda para encuadrar');
  const controlsDisabled = isBusy || isExporting || !imgLoaded || !!loadError;

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
            disabled={isBusy || isExporting}
            className="p-2 rounded-full hover:bg-primary/10 text-(--text-main) transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="flex justify-center py-8 px-6 bg-black/40 relative">
            <div
              className={`relative overflow-hidden shadow-2xl border-2 border-primary/40 touch-none ${
                isCircle ? 'rounded-full' : 'rounded-xl'
              }`}
              style={{
                width: displayW,
                height: displayH,
                cursor: controlsDisabled
                  ? 'default'
                  : isDragging
                    ? 'grabbing'
                    : 'grab',
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
              {!imgLoaded && !loadError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
          </div>

          {loadError && (
            <p className="px-8 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-red-500">
              {loadError}
            </p>
          )}

          {!isCircle && (
            <div className="px-8 py-4 flex flex-wrap justify-center gap-2 border-b border-(--border-main)/5">
              <button
                type="button"
                disabled={controlsDisabled}
                onClick={() => {
                  setAspect('portrait');
                }}
                className={`py-2 px-3 flex-1 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all border disabled:opacity-40 ${
                  aspect === 'portrait'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white/5 text-(--text-main) border-transparent hover:border-primary/20'
                }`}
              >
                Vertical (3:4)
              </button>
              <button
                type="button"
                disabled={controlsDisabled}
                onClick={() => {
                  setAspect('landscape');
                }}
                className={`py-2 px-3 flex-1 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all border disabled:opacity-40 ${
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
              disabled={controlsDisabled}
              onClick={fitToFrame}
              className="flex-1 py-2 px-3 bg-white/5 hover:bg-primary/10 text-(--text-main) text-[8px] font-black uppercase tracking-widest rounded-lg transition-all border border-transparent hover:border-primary/20 disabled:opacity-40"
            >
              Ver todo
            </button>
            <button
              type="button"
              disabled={controlsDisabled}
              onClick={coverFrame}
              className="flex-1 py-2 px-3 bg-white/5 hover:bg-primary/10 text-(--text-main) text-[8px] font-black uppercase tracking-widest rounded-lg transition-all border border-transparent hover:border-primary/20 disabled:opacity-40"
            >
              Llenar {isCircle ? 'círculo' : 'marco'}
            </button>
            <button
              type="button"
              disabled={controlsDisabled}
              onClick={() => setRotation((r) => r + 90)}
              className="py-2 px-4 bg-white/5 hover:bg-primary/10 text-(--text-main) rounded-lg transition-all border border-transparent hover:border-primary/20 disabled:opacity-40"
              aria-label="Rotar"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-8 pt-6 pb-4 flex items-center gap-4 justify-center">
            <button
              type="button"
              disabled={controlsDisabled}
              onClick={() => setZoom((z) => Math.max(0.01, z - 0.15))}
              className="p-3 rounded-full bg-white/5 hover:bg-primary/20 text-(--text-main) transition-colors disabled:opacity-40"
              aria-label="Alejar"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="flex-1 relative">
              <input
                type="range"
                min={0.01}
                max={zoomMax}
                step={0.01}
                value={Math.min(zoomMax, Math.max(0.01, zoom))}
                disabled={controlsDisabled}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-primary disabled:opacity-40"
                aria-label="Zoom"
              />
            </div>
            <button
              type="button"
              disabled={controlsDisabled}
              onClick={() => setZoom((z) => Math.min(zoomMax, z + 0.15))}
              className="p-3 rounded-full bg-white/5 hover:bg-primary/20 text-(--text-main) transition-colors disabled:opacity-40"
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
            disabled={isBusy || isExporting}
            className="flex-1 py-4 border border-(--border-main) text-(--text-main) text-[10px] font-black uppercase tracking-widest rounded-2xl hover:border-primary/30 transition-all disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={controlsDisabled}
            className="flex-1 py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-secondary transition-all flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isBusy || isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {isBusy || isExporting ? 'Subiendo…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};
