import type { Color } from '@/types';

type SwatchSource = Pick<Color, 'hex' | 'swatch_url' | 'name'> & {
  hex?: string | null;
};

interface ColorSwatchProps {
  color: SwatchSource;
  className?: string;
  title?: string;
}

/** Círculo de color sólido o muestra de estampado. */
export function ColorSwatch({ color, className = '', title }: ColorSwatchProps) {
  const label = title ?? color.name;
  const hasPattern = Boolean(color.swatch_url);

  if (hasPattern) {
    return (
      <span
        className={`relative inline-block overflow-hidden border border-black/10 shadow-inner bg-(--bg-main) ${className}`}
        title={label}
        role="img"
        aria-label={label}
      >
        <img
          src={color.swatch_url!}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-block border border-black/10 shadow-inner ${className}`}
      style={{ backgroundColor: color.hex || '#C4B8A8' }}
      title={label}
      role="img"
      aria-label={label}
    />
  );
}
