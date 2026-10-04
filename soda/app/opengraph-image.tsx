import { ImageResponse } from 'next/og';
import { site } from '@/config/site';

/*
  La tarjeta que sale cuando alguien pega el enlace en un grupo de WhatsApp.
  Es la primera impresion real del sitio, mas que la portada.

  Se genera con next/og: no hay ningun archivo de imagen que mantener, y cambia
  solo cuando cambia el nombre en config/site.ts.

  Ojo con el recorte: el formato es 1200x630, pero varias vistas previas lo
  recortan a algo cercano al cuadrado. Todo lo que importa va al centro, nunca en
  las esquinas.
*/

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
          alignItems: 'center',
          justifyContent: 'center',
          background: '#faf6ef',
          color: '#1f1b16',
          padding: '80px 120px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 84, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{site.nombre}</div>

        <div style={{ width: 120, height: 2, background: '#c1402b', margin: '36px 0' }} />

        <div style={{ fontSize: 34, color: '#5c554b', lineHeight: 1.35 }}>{site.descripcionCorta}</div>
      </div>
    ),
    size,
  );
}
