import { ImageResponse } from 'next/og';
import { site } from '@/config/site';

/*
  La tarjeta que sale al pegar el enlace en un chat.

  Cuidado especial en esta estetica: una tarjeta NEGRA en una lista de chats se
  lee como una imagen rota o como que no cargo. Por eso el bloque ambar ocupa
  una franja entera — hace que a tamano de miniatura se vea que ahi hay algo.

  Y el recorte: el formato es 1200x630 pero varias vistas previas lo recortan a
  algo cercano al cuadrado. Todo lo que importa va al centro.
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
          background: '#0a0a0a',
          color: '#f2f0eb',
        }}
      >
        <div style={{ height: 24, background: '#ffb300' }} />

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 90px',
          }}
        >
          <div
            style={{
              fontSize: 92,
              textTransform: 'uppercase',
              letterSpacing: '-0.03em',
              lineHeight: 1.02,
            }}
          >
            {site.nombre}
          </div>

          <div style={{ marginTop: 28, fontSize: 30, color: '#ffb300', textTransform: 'uppercase' }}>
            {site.descripcionCorta}
          </div>
        </div>

        <div style={{ height: 24, background: '#ffb300' }} />
      </div>
    ),
    size,
  );
}
