import React from 'react';
import { Link2 } from 'lucide-react';

type ReferrerBrand = {
  id: string;
  label: string;
  /** Dominios o fragmentos que identifican la marca (sin www). */
  hosts: string[];
  Icon: React.FC<{ className?: string }>;
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  const gradId = React.useId().replace(/:/g, '');
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <radialGradient id={gradId} cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <path
        fill={`url(#${gradId})`}
        d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.281.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"
      />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={`${className ?? ''} text-(--text-main)`} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.49V9.35a8.16 8.16 0 005.58 2.18V8.08a4.85 4.85 0 01-1.99-.39z"
      />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#FF0000"
        d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186 31.247 31.247 0 000 12.017a31.247 31.247 0 00.502 5.831 3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136A31.247 31.247 0 0024 12.017a31.247 31.247 0 00-.502-5.831z"
      />
      <path fill="#fff" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#E60023"
        d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.217-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.227-.174.275-.402.166-1.499-.698-2.436-2.888-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.001 24c6.627 0 12-5.373 12-12S18.627.001 12 0z"
      />
    </svg>
  );
}

function BingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#00809D" d="M5 3v16.146l4.157 2.354 8.343-4.792v-5.354L9.157 14.5V7.854L5 3z" />
      <path fill="#00809D" d="M9.157 14.5l3.686 1.854 4.657-2.25-8.343-2.604z" opacity=".75" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={`${className ?? ''} text-(--text-main)`} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"
      />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#25D366"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#0A66C2"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  );
}

const BRANDS: ReferrerBrand[] = [
  {
    id: 'google',
    label: 'Google',
    hosts: ['google', 'googleusercontent.com'],
    Icon: GoogleIcon,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    hosts: ['instagram.com', 'ig.me'],
    Icon: InstagramIcon,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    hosts: ['facebook.com', 'fb.com', 'fb.me'],
    Icon: FacebookIcon,
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    hosts: ['tiktok.com'],
    Icon: TikTokIcon,
  },
  {
    id: 'youtube',
    label: 'YouTube',
    hosts: ['youtube.com', 'youtu.be', 'youtube-nocookie.com'],
    Icon: YouTubeIcon,
  },
  {
    id: 'pinterest',
    label: 'Pinterest',
    hosts: ['pinterest.com', 'pin.it'],
    Icon: PinterestIcon,
  },
  {
    id: 'bing',
    label: 'Bing',
    hosts: ['bing.com'],
    Icon: BingIcon,
  },
  {
    id: 'x',
    label: 'X',
    hosts: ['twitter.com', 'x.com', 't.co'],
    Icon: XIcon,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    hosts: ['whatsapp.com', 'wa.me'],
    Icon: WhatsAppIcon,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    hosts: ['linkedin.com', 'lnkd.in'],
    Icon: LinkedInIcon,
  },
];

function normalizeHost(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^www\./, '');
}

function matchesHost(host: string, fragment: string): boolean {
  return (
    host === fragment ||
    host.endsWith(`.${fragment}`) ||
    host.startsWith(`${fragment}.`) ||
    host.includes(`.${fragment}.`)
  );
}

export function isDirectReferrer(hostname: string): boolean {
  const value = normalizeHost(hostname);
  return !value || value === '(directo)' || value === 'direct' || value === '(none)' || value === 'directo';
}

export function resolveReferrerBrand(hostname: string): ReferrerBrand | null {
  if (isDirectReferrer(hostname)) return null;
  const host = normalizeHost(hostname);
  return BRANDS.find((brand) => brand.hosts.some((fragment) => matchesHost(host, fragment))) || null;
}

export function ReferrerOriginMark({
  hostname,
  className = '',
}: {
  hostname: string;
  className?: string;
}) {
  if (isDirectReferrer(hostname)) {
    return (
      <span
        className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 ${className}`}
        title="Directo / sin referrer"
      >
        <span className="w-7 h-7 rounded-xl bg-(--bg-main) border border-(--border-main) flex items-center justify-center">
          <Link2 className="w-3.5 h-3.5" />
        </span>
        Directo
      </span>
    );
  }

  const brand = resolveReferrerBrand(hostname);
  if (brand) {
    const Icon = brand.Icon;
    return (
      <span
        className={`inline-flex items-center ${className}`}
        title={brand.label}
        aria-label={brand.label}
      >
        <Icon className="w-7 h-7 shrink-0" />
        <span className="sr-only">{brand.label}</span>
      </span>
    );
  }

  return (
    <span className={`text-xs font-bold text-(--text-main) truncate ${className}`} title={hostname}>
      {hostname}
    </span>
  );
}
