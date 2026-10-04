import { ImageResponse } from 'next/og';
import { site } from '@/config/site';

export const alt = site.nombre;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Imagen() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#fdfcfa',
          color: '#2e3a32',
          padding: '0 100px',
          position: 'relative',
        }}
      >
        {/* Los blobs: al fondo y lejos del texto, como en el sitio. */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -100,
            width: 520,
            height: 520,
            borderRadius: '50%',
            background: '#7fa383',
            opacity: 0.25,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -160,
            left: -120,
            width: 460,
            height: 460,
            borderRadius: '50%',
            background: '#8fb8c9',
            opacity: 0.22,
          }}
        />

        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.15 }}>{site.nombre}</div>
        <div style={{ marginTop: 24, fontSize: 34, color: '#4f6b54' }}>{site.frase}</div>
      </div>
    ),
    size,
  );
}
