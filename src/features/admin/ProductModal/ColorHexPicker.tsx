import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Pipette, X, Check } from 'lucide-react';

/** Cursor SVG de gotero (hotspot en la punta). */
const EYEDROPPER_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none'>
    <g stroke-linecap='round' stroke-linejoin='round'>
      <path d='M2 22l1-1h3l9.5-9.5' stroke='white' stroke-width='3.5'/>
      <path d='M14.5 5.5l4 4' stroke='white' stroke-width='3.5'/>
      <path d='M16 3.5l4.5 4.5a1.5 1.5 0 0 1 0 2.1L18 12.6' stroke='white' stroke-width='3.5'/>
      <path d='M2 22l1-1h3l9.5-9.5' stroke='%23111' stroke-width='1.8'/>
      <path d='M14.5 5.5l4 4' stroke='%23111' stroke-width='1.8'/>
      <path d='M11.5 8.5l4 4' stroke='%23111' stroke-width='1.8'/>
      <path d='M16 3.5l4.5 4.5a1.5 1.5 0 0 1 0 2.1L18 12.6' stroke='%23111' stroke-width='1.8'/>
      <circle cx='18.8' cy='5.2' r='1.35' fill='%23111' stroke='white' stroke-width='0.8'/>
    </g>
  </svg>`
)}") 2 30, crosshair`;

function normalizeHex(value: string): string {
  const raw = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) return raw.toUpperCase();
  if (/^[0-9A-Fa-f]{6}$/.test(raw)) return `#${raw.toUpperCase()}`;
  return value;
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

/** Media un área pequeña (más estable al tocar con el dedo). */
function sampleAverageHex(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 4
): string {
  const x0 = Math.max(0, x - radius);
  const y0 = Math.max(0, y - radius);
  const x1 = Math.min(width - 1, x + radius);
  const y1 = Math.min(height - 1, y + radius);
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const data = ctx.getImageData(x0, y0, w, h).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n += 1;
  }
  return rgbToHex(Math.round(r / n), Math.round(g / n), Math.round(b / n));
}

declare global {
  interface EyeDropper {
    open: (options?: { signal?: AbortSignal }) => Promise<{ sRGBHex: string }>;
  }
  interface Window {
    EyeDropper?: new () => EyeDropper;
  }
}

interface ColorHexPickerProps {
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
  productImages?: string[];
}

export const ColorHexPicker: React.FC<ColorHexPickerProps> = ({
  value,
  onChange,
  disabled = false,
  productImages = [],
}) => {
  const inputId = useId();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isTouchPrimary = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(pointer: coarse)').matches ||
      navigator.maxTouchPoints > 0
    );
  }, []);

  const supportsEyeDropper = useMemo(
    () =>
      typeof window !== 'undefined' &&
      typeof window.EyeDropper === 'function' &&
      !isTouchPrimary,
    [isTouchPrimary]
  );

  const [isPicking, setIsPicking] = useState(false);
  const [showImagePick, setShowImagePick] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [previewHex, setPreviewHex] = useState<string | null>(null);
  const [loupe, setLoupe] = useState<{ x: number; y: number } | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const draggingRef = useRef(false);

  const pickingActive = isPicking || showImagePick;

  useEffect(() => {
    if (!pickingActive) return;
    const prevBody = document.body.style.cursor;
    const prevHtml = document.documentElement.style.cursor;
    document.body.style.cursor = EYEDROPPER_CURSOR;
    document.documentElement.style.cursor = EYEDROPPER_CURSOR;
    return () => {
      document.body.style.cursor = prevBody;
      document.documentElement.style.cursor = prevHtml;
    };
  }, [pickingActive]);

  const applyHex = useCallback(
    (hex: string) => {
      onChange(normalizeHex(hex).toUpperCase());
      setPickError(null);
      setShowImagePick(false);
      setPreviewHex(null);
      setLoupe(null);
      setCanvasReady(false);
      canvasRef.current = null;
    },
    [onChange]
  );

  const openNativeEyeDropper = async () => {
    if (disabled || !window.EyeDropper) return;
    setIsPicking(true);
    setPickError(null);
    try {
      const result = await new window.EyeDropper().open();
      applyHex(result.sRGBHex);
    } catch {
      // cancelado
    } finally {
      setIsPicking(false);
    }
  };

  const openImagePicker = () => {
    if (productImages.length === 0) {
      setPickError('Sube primero una foto del producto para extraer el color.');
      return;
    }
    setActiveImage(0);
    setPreviewHex(null);
    setLoupe(null);
    setCanvasReady(false);
    canvasRef.current = null;
    setShowImagePick(true);
  };

  const startPickFromPhoto = () => {
    if (disabled) return;
    setPickError(null);

    // Con fotos: muestreo sobre la imagen con cursor gotero
    if (productImages.length > 0) {
      openImagePicker();
      return;
    }

    if (supportsEyeDropper) {
      void openNativeEyeDropper();
      return;
    }

    setPickError('Sube primero una foto del producto para extraer el color.');
  };

  const ensureCanvas = async (src: string): Promise<HTMLCanvasElement | null> => {
    if (canvasRef.current) return canvasRef.current;

    return new Promise((resolve) => {
      const probe = new Image();
      probe.crossOrigin = 'anonymous';
      probe.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = probe.naturalWidth;
          canvas.height = probe.naturalHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(probe, 0, 0);
          canvasRef.current = canvas;
          setCanvasReady(true);
          resolve(canvas);
        } catch {
          resolve(null);
        }
      };
      probe.onerror = () => resolve(null);
      const sep = src.includes('?') ? '&' : '?';
      probe.src = `${src}${sep}eyedrop=${Date.now()}`;
    });
  };

  const sampleAtClientPoint = async (
    clientX: number,
    clientY: number,
    src: string
  ) => {
    const imgEl = imgRef.current;
    if (!imgEl) return;

    const rect = imgEl.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return;
    }

    const scaleX = imgEl.naturalWidth / rect.width;
    const scaleY = imgEl.naturalHeight / rect.height;
    const x = Math.floor((clientX - rect.left) * scaleX);
    const y = Math.floor((clientY - rect.top) * scaleY);

    const canvas = await ensureCanvas(src);
    if (!canvas) {
      setPickError(
        'No se pudo leer esta foto. Prueba a recargar o usa el selector de color.'
      );
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const hex = sampleAverageHex(
        ctx,
        x,
        y,
        canvas.width,
        canvas.height,
        isTouchPrimary ? 6 : 2
      );
      setPreviewHex(hex);
      setLoupe({
        x: clientX - rect.left,
        y: clientY - rect.top,
      });
      setPickError(null);
    } catch {
      setPickError(
        'No se pudo leer esta foto. Prueba a recargar o usa el selector de color.'
      );
    }
  };

  const onPointerSample = (
    e: React.PointerEvent<HTMLDivElement>,
    src: string
  ) => {
    e.preventDefault();
    void sampleAtClientPoint(e.clientX, e.clientY, src);
  };

  const confirmPreview = () => {
    if (previewHex) applyHex(previewHex);
  };

  const hexValid = /^#[0-9A-Fa-f]{6}$/i.test(value);

  return (
    <div className="space-y-2 w-full">
      <label
        htmlFor={inputId}
        className="text-[8px] font-black uppercase tracking-widest text-gray-500 block"
      >
        Color (hex)
      </label>

      <div className="flex items-center gap-2">
        <input
          id={inputId}
          type="color"
          className="w-11 h-11 border-0 p-0 cursor-pointer rounded-lg bg-transparent outline-none disabled:opacity-50 shrink-0"
          value={hexValid ? value : '#8B4513'}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          disabled={disabled}
          title="Selector de color"
        />
        <input
          type="text"
          autoComplete="off"
          spellCheck={false}
          className="flex-1 min-w-0 bg-(--bg-main) border border-(--border-main) px-3 py-2.5 text-[11px] font-mono font-bold uppercase focus:border-primary outline-none rounded-xl text-(--text-main) disabled:opacity-50"
          value={value}
          onChange={(e) => {
            const next = e.target.value.startsWith('#')
              ? e.target.value
              : `#${e.target.value}`;
            onChange(next.slice(0, 7));
          }}
          onBlur={() => {
            const normalized = normalizeHex(value);
            if (/^#[0-9A-Fa-f]{6}$/.test(normalized)) {
              onChange(normalized.toUpperCase());
            }
          }}
          disabled={disabled}
          placeholder="#8B4513"
          maxLength={7}
          aria-label="Código hexadecimal"
        />
        <button
          type="button"
          onClick={startPickFromPhoto}
          disabled={disabled || isPicking}
          title="Extraer color de la foto"
          className={`shrink-0 flex items-center justify-center w-11 h-11 rounded-xl border transition-all disabled:opacity-50
            ${
              pickingActive
                ? 'border-primary bg-primary text-white'
                : 'border-primary/40 text-primary hover:bg-primary hover:text-white'
            }`}
          style={pickingActive ? { cursor: EYEDROPPER_CURSOR } : undefined}
        >
          <Pipette className={`w-4 h-4 ${isPicking ? 'animate-pulse' : ''}`} />
          <span className="sr-only">Extraer color de la foto</span>
        </button>
      </div>

      <p className="text-[9px] text-gray-400 uppercase tracking-wider leading-relaxed">
        {pickingActive
          ? 'Puntero gotero activo: elige un tono de la foto…'
          : isTouchPrimary
            ? 'Pipeta: toca la foto y confirma el color'
            : 'Cuentagotas: toma el color de la foto'}
      </p>

      {pickError && !showImagePick && (
        <p className="text-[10px] text-red-500 font-medium">{pickError}</p>
      )}

      {showImagePick && productImages.length > 0 && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Extraer color de la foto"
          style={{ cursor: EYEDROPPER_CURSOR }}
          onClick={() => {
            setShowImagePick(false);
            setPreviewHex(null);
            setLoupe(null);
          }}
        >
          <div
            className="bg-(--bg-card) border border-(--border-main) rounded-t-3xl sm:rounded-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
            style={{ cursor: 'default' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  Extraer color
                </p>
                <p className="text-[12px] text-gray-500 mt-1">
                  {isTouchPrimary
                    ? 'Arrastra el dedo sobre la prenda y pulsa confirmar'
                    : 'El cursor es un gotero: haz clic en el tono de la prenda'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowImagePick(false);
                  setPreviewHex(null);
                  setLoupe(null);
                }}
                className="p-2.5 rounded-full hover:bg-black/5 text-gray-500"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {productImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {productImages.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => {
                      setActiveImage(i);
                      setPreviewHex(null);
                      setLoupe(null);
                      setCanvasReady(false);
                      canvasRef.current = null;
                    }}
                    className={`shrink-0 w-14 h-16 rounded-lg overflow-hidden border-2 ${
                      activeImage === i
                        ? 'border-primary'
                        : 'border-transparent opacity-70'
                    }`}
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <div
              className="relative rounded-xl overflow-hidden border border-(--border-main) bg-(--bg-main) touch-none select-none"
              style={{ cursor: EYEDROPPER_CURSOR }}
              onPointerDown={(e) => {
                draggingRef.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                onPointerSample(e, productImages[activeImage]);
              }}
              onPointerMove={(e) => {
                if (!draggingRef.current) return;
                onPointerSample(e, productImages[activeImage]);
              }}
              onPointerUp={() => {
                draggingRef.current = false;
              }}
              onPointerCancel={() => {
                draggingRef.current = false;
              }}
            >
              <img
                ref={imgRef}
                src={productImages[activeImage]}
                alt="Toca para elegir color"
                className="w-full max-h-[55vh] object-contain pointer-events-none"
                draggable={false}
                onLoad={() => {
                  setCanvasReady(false);
                  canvasRef.current = null;
                  void ensureCanvas(productImages[activeImage]);
                }}
              />
              {loupe && previewHex && (
                <div
                  className="pointer-events-none absolute w-14 h-14 -ml-7 -mt-16 rounded-full border-4 border-white shadow-lg ring-1 ring-black/20"
                  style={{
                    left: loupe.x,
                    top: loupe.y,
                    backgroundColor: previewHex,
                  }}
                />
              )}
            </div>

            {pickError && (
              <p className="text-[10px] text-red-500 font-medium">{pickError}</p>
            )}

            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl border border-black/10 shadow-inner shrink-0"
                style={{ backgroundColor: previewHex ?? value }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                  Vista previa
                </p>
                <p className="text-sm font-mono font-bold text-(--text-main)">
                  {previewHex ?? '—'}
                </p>
                {!canvasReady && showImagePick && (
                  <p className="text-[10px] text-gray-400">Preparando foto…</p>
                )}
              </div>
              <button
                type="button"
                disabled={!previewHex}
                onClick={confirmPreview}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                Usar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
