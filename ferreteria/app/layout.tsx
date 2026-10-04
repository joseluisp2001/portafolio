import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { site } from '@/config/site';
import { urlSitio } from '@/lib/site-url';
import { estadoHorario } from '@/lib/horario';
import { ProveedorCotizacion } from '@/components/Cotizacion';
import BarraCotizacion from '@/components/BarraCotizacion';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--fuente-cuerpo' });

export const metadata: Metadata = {
  metadataBase: new URL(urlSitio),
  title: { default: `${site.nombre} — ${site.descripcionCorta}`, template: `%s · ${site.nombre}` },
  description: site.descripcionLarga,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'es_CR',
    siteName: site.nombre,
    title: site.nombre,
    description: site.descripcionCorta,
    url: urlSitio,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: '#f4f5f7' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const estado = estadoHorario();

  return (
    <html lang="es-CR" className={inter.variable}>
      <body>
        <ProveedorCotizacion>
          <a
            href="#contenido"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-xs focus:bg-fila focus:px-3 focus:py-2"
          >
            Saltar al contenido
          </a>

          {/* Barra fina y funcional. Nada de logo grande: el espacio de arriba es
              del buscador. */}
          <header className="sticky top-0 z-30 border-b border-linea bg-fila">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-2.5">
              <Link href="/" className="font-semibold">
                {site.nombre}
              </Link>

              <div className="flex items-center gap-3 text-xs">
                {site.contacto.telefono && (
                  <a href={`tel:+${site.contacto.telefono}`} className="text-azul">
                    {site.contacto.telefono}
                  </a>
                )}
                <span className={estado.abierto ? 'text-texto' : 'text-apagado'}>
                  {estado.abierto ? '● ' : '○ '}
                  {estado.abierto ? 'Abierto' : 'Cerrado'}
                </span>
              </div>
            </div>
          </header>

          <main id="contenido">{children}</main>

          <footer className="border-t border-linea bg-fila">
            <div className="mx-auto max-w-5xl px-3 py-6 text-xs text-apagado">
              <p className="font-medium text-texto">{site.nombre}</p>
              {site.contacto.direccion && <p className="mt-1">{site.contacto.direccion}</p>}
              {site.contacto.mapa && (
                <p className="mt-1">
                  <a href={site.contacto.mapa} target="_blank" rel="noopener noreferrer" className="text-azul">
                    Como llegar
                  </a>
                </p>
              )}
            </div>
          </footer>

          <BarraCotizacion />
        </ProveedorCotizacion>
      </body>
    </html>
  );
}
