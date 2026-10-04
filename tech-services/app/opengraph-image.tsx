import { ImageResponse } from 'next/og';
import {
  LOGO_CARCASA,
  LOGO_COLORES,
  LOGO_ONDAS_RADIOS,
  LOGO_PINES,
  LOGO_PIN_ACTIVO,
  LOGO_RADIO_PIN,
  LOGO_TRAZO,
  LOGO_VIEWBOX,
  ondaPath,
} from '@/lib/logo';
import { site } from '@/config/site';

/**
 * La vista previa al compartir el enlace (WhatsApp, Facebook, etc.). Antes no
 * había ninguna y el enlace salía pelado. Usa la fuente que trae `next/og`,
 * así no depende de descargar Space Grotesk al compilar.
 */
export const alt = 'Desamparados Tech — soporte técnico y automatización en Desamparados';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 64,
          padding: '0 96px',
          // next/og no acepta color y degradado en la misma propiedad.
          backgroundColor: LOGO_COLORES.oscuro,
          backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(6,182,212,0.22), transparent 45%)',
          color: LOGO_COLORES.claro,
        }}
      >
        <svg width={300} height={300} viewBox={LOGO_VIEWBOX} style={{ overflow: 'visible' }}>
          <path d={LOGO_CARCASA} fill="none" stroke={LOGO_COLORES.claro} strokeWidth={LOGO_TRAZO} strokeLinejoin="round" />
          {LOGO_PINES.map((p) => (
            <circle key={`${p.x}-${p.y}`} cx={p.x} cy={p.y} r={LOGO_RADIO_PIN} fill={LOGO_COLORES.claro} />
          ))}
          <circle cx={LOGO_PIN_ACTIVO.x} cy={LOGO_PIN_ACTIVO.y} r={LOGO_RADIO_PIN} fill={LOGO_COLORES.cian} />
          {LOGO_ONDAS_RADIOS.map((r) => (
            <path key={r} d={ondaPath(r)} fill="none" stroke={LOGO_COLORES.cian} strokeWidth={1.8} strokeLinecap="round" />
          ))}
        </svg>

        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 40 }}>
          <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -2, lineHeight: 1 }}>Desamparados</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 14 }}>
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 8, color: '#22D3EE' }}>TECH</div>
            <div style={{ width: 120, height: 2, background: '#475569' }} />
          </div>
          <div style={{ fontSize: 32, marginTop: 40, color: '#CBD5E1', maxWidth: 720, lineHeight: 1.3 }}>
            {site.brand.tagline}
          </div>
          <div style={{ fontSize: 24, marginTop: 18, color: '#94A3B8' }}>Desamparados, San José · Costa Rica</div>
        </div>
      </div>
    ),
    size
  );
}
