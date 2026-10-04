import { ImageResponse } from 'next/og';
import { site } from '@/config/site';
import { total } from '@/lib/catalogo';

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
          background: '#f4f5f7',
          color: '#1c1e21',
          padding: '0 100px',
        }}
      >
        <div style={{ fontSize: 66, fontWeight: 600 }}>{site.nombre}</div>

        {/* Un buscador dibujado: la tarjeta dice de una que esto es una lista
            donde se busca, no una landing. */}
        <div
          style={{
            marginTop: 34,
            display: 'flex',
            alignItems: 'center',
            background: '#ffffff',
            border: '2px solid #e3e5e9',
            borderRadius: 8,
            padding: '26px 30px',
            fontSize: 30,
            color: '#5f6773',
          }}
        >
          Buscar por nombre, codigo o medida…
        </div>

        {/*
          Una sola cadena, no `{total} articulos …`.

          El motor de next/og trata cada expresion y cada texto suelto como un
          hijo distinto, y exige display:flex en cualquier div con mas de uno.
          Escrito asi, es un hijo y no hace falta.
        */}
        <div style={{ marginTop: 26, fontSize: 28, color: '#5f6773' }}>
          {`${total} articulos · cotice por WhatsApp`}
        </div>
      </div>
    ),
    size,
  );
}
