import React, { useEffect, useState } from 'react';
import { toDisplayImageUrl, toProxyImageUrl } from '@/lib/mediaUrl';

type ResilientImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'onError'
> & {
  src?: string | null;
  /** Si la URL primaria falla, prueba la alternativa CDN ↔ proxy. */
  enableFallback?: boolean;
  /**
   * Admin: prioriza `/api/chat?k=` (mismo origen que el crop).
   * Tienda: prioriza la CDN `media.` (más rápida).
   */
  preferProxy?: boolean;
};

/**
 * `<img>` con fallback CDN ↔ proxy same-origin.
 * El recorte del admin ya usa el proxy; las miniaturas deben poder hacer lo mismo
 * si Cloudflare bloquea `media.modasmelomerezco.es`.
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
    ? cdnSrc && cdnSrc !== primary
      ? cdnSrc
      : ''
    : proxySrc && proxySrc !== primary
      ? proxySrc
      : '';

  const [currentSrc, setCurrentSrc] = useState(primary);
  const [triedFallback, setTriedFallback] = useState(false);

  useEffect(() => {
    setCurrentSrc(primary);
    setTriedFallback(false);
  }, [primary]);

  if (!currentSrc) return null;

  return (
    <img
      {...rest}
      alt={alt}
      src={currentSrc}
      onError={() => {
        if (!enableFallback || triedFallback || !secondary) return;
        setTriedFallback(true);
        setCurrentSrc(secondary);
      }}
    />
  );
};
