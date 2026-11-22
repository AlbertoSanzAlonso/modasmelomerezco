import React, { useEffect, useState } from 'react';
import { toDisplayImageUrl, toProxyImageUrl } from '@/lib/mediaUrl';
import { resolveImageForCrop } from '@/utils/resolveImageForCrop';

type ResilientImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'onError'
> & {
  src?: string | null;
  /** Si la URL primaria falla, prueba la alternativa CDN ↔ proxy. */
  enableFallback?: boolean;
  /**
   * Admin: carga vía POST `/api/chat` (igual que el recorte) → blob.
   * Evita depender de `media.` (CDN caída) y de GET `/api/chat?k=`.
   */
  preferProxy?: boolean;
};

/**
 * `<img>` con fallback. En admin (`preferProxy`) usa el mismo proxy POST
 * que el modal de recorte, porque ahí sí se ven las fotos.
 */
export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  enableFallback = true,
  preferProxy = false,
  alt = '',
  ...rest
}) => {
  const cdnSrc = toDisplayImageUrl(src) || (src?.trim() ?? '');
  const proxySrc = toProxyImageUrl(src);
  const primary = preferProxy ? proxySrc || cdnSrc : cdnSrc || proxySrc;
  const secondary = preferProxy
    ? ''
    : proxySrc && proxySrc !== primary
      ? proxySrc
      : '';

  const [currentSrc, setCurrentSrc] = useState(preferProxy ? '' : primary);
  const [triedFallback, setTriedFallback] = useState(false);

  useEffect(() => {
    if (!preferProxy) {
      setCurrentSrc(primary);
      setTriedFallback(false);
      return;
    }

    const raw = src?.trim() || '';
    if (!raw) {
      setCurrentSrc('');
      return;
    }
    if (raw.startsWith('blob:') || raw.startsWith('data:')) {
      setCurrentSrc(raw);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    setCurrentSrc('');

    // Misma ruta que el crop: POST fetch-image → blob (no depende de media. ni de GET ?k=)
    resolveImageForCrop(raw)
      .then((url) => {
        if (cancelled) {
          if (url.startsWith('blob:')) URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url.startsWith('blob:') ? url : null;
        setCurrentSrc(url);
      })
      .catch(() => {
        if (!cancelled) {
          // Último recurso: GET proxy o CDN
          setCurrentSrc(proxySrc || cdnSrc || raw);
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, preferProxy, primary, proxySrc, cdnSrc]);

  if (!currentSrc) {
    return <div className={rest.className} aria-hidden="true" />;
  }

  return (
    <img
      {...rest}
      alt={alt}
      src={currentSrc}
      onError={() => {
        if (preferProxy || !enableFallback || triedFallback || !secondary) return;
        setTriedFallback(true);
        setCurrentSrc(secondary);
      }}
    />
  );
};
