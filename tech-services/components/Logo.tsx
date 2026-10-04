import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import {
  LOGO_CARCASA,
  LOGO_COLORES,
  LOGO_PINES,
  LOGO_PIN_ACTIVO,
  LOGO_RADIO_PIN,
  LOGO_TRAZO,
  LOGO_VIEWBOX,
  LOGO_ONDAS_RADIOS,
  ondaPath,
} from '@/lib/logo';
import { site } from '@/config/site';

interface LogoProps {
  /** `claro` para fondos oscuros (encabezado, pie); `oscuro` para fondos claros. */
  tono?: 'claro' | 'oscuro';
  /** Solo el símbolo, sin el nombre. */
  soloSimbolo?: boolean;
  /** Ondas de señal WiFi desde el pin activo (solo el encabezado). La animación vive en globals.css. */
  conSenal?: boolean;
  className?: string;
}

/**
 * Símbolo + nombre. El nombre va en HTML con la fuente del sitio, no dentro del
 * SVG, para que se vea igual que el resto de los títulos.
 */
export function Logo({ tono = 'claro', soloSimbolo = false, conSenal = false, className }: LogoProps) {
  const trazo = tono === 'claro' ? LOGO_COLORES.claro : LOGO_COLORES.oscuro;
  const activo = tono === 'claro' ? LOGO_COLORES.cian : LOGO_COLORES.cianTinta;

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg
        viewBox={LOGO_VIEWBOX}
        className={cn('h-9 w-9 shrink-0 overflow-visible', conSenal && 'logo-senal')}
        aria-hidden="true"
        focusable="false"
      >
        <path d={LOGO_CARCASA} fill="none" stroke={trazo} strokeWidth={LOGO_TRAZO} strokeLinejoin="round" />
        {LOGO_PINES.map((p) => (
          <circle key={`${p.x}-${p.y}`} cx={p.x} cy={p.y} r={LOGO_RADIO_PIN} fill={trazo} />
        ))}
        {conSenal &&
          LOGO_ONDAS_RADIOS.map((r, i) => (
            <path
              key={r}
              d={ondaPath(r)}
              className="logo-onda"
              style={{ '--i': i } as CSSProperties}
              fill="none"
              stroke={activo}
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          ))}
        <circle cx={LOGO_PIN_ACTIVO.x} cy={LOGO_PIN_ACTIVO.y} r={LOGO_RADIO_PIN} fill={activo} />
      </svg>

      {soloSimbolo ? (
        <span className="sr-only">{site.brand.name}</span>
      ) : (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'font-display text-[1.2rem] font-bold tracking-tight',
              tono === 'claro' ? 'text-white' : 'text-text-primary'
            )}
          >
            Desamparados
          </span>
          <span
            className={cn(
              'mt-1 flex items-center gap-1.5 font-display text-[0.68rem] font-semibold uppercase tracking-[0.16em]',
              tono === 'claro' ? 'text-cyan-400' : 'text-accent-ink'
            )}
          >
            Tech
            <span aria-hidden="true" className={cn('h-px w-8', tono === 'claro' ? 'bg-slate-600' : 'bg-border')} />
          </span>
        </span>
      )}
    </span>
  );
}
