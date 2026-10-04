import type { Metadata, Viewport } from 'next';
import { Archivo_Black, IBM_Plex_Mono } from 'next/font/google';
import Link from 'next/link';
import { site } from '@/config/site';
import { urlSitio } from '@/lib/site-url';
import { estadoHorario } from '@/lib/horario';
import './globals.css';

/*
  Subconjunto `latin` y nada mas: ya trae las tildes, la ene y los signos de
  apertura. Archivo Black no tiene rango de pesos — es un peso solo, y por eso
  cualquier subtitulo va en la monoespaciada y no en una version mas liviana de
  la misma familia, que no existe.
*/
const archivo = Archivo_Black({
  subsets: ['latin'],
  display: 'swap',
  variable: '--fuente-titulo',
  weight: '400',
});

const plex = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--fuente-cuerpo',
  weight: ['400', '600'],
});

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

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const estado = estadoHorario();

  return (
    <html lang="es-CR" className={`${archivo.variable} ${plex.variable}`}>
      <body>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-ambar focus:px-4 focus:py-2 focus:text-negro"
        >
          Saltar al contenido
        </a>

        {/*
          La barra de arriba lleva el estado real: abierto en ambar, cerrado en
          gris. Es el dato que la gente busca primero y que casi ningun sitio de
          barberia pone.
        */}
        <header className="sticky top-0 z-40 border-b border-borde bg-negro">
          <nav
            aria-label="Principal"
            className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3"
          >
            <Link href="/" className="font-titulo text-sm uppercase tracking-tight sm:text-base">
              {site.nombre}
            </Link>

            <div className="flex items-center gap-4 text-xs uppercase sm:gap-6">
              <span className={estado.abierto ? 'text-ambar' : 'text-gris'}>
                {estado.abierto ? '● ' : '○ '}
                {estado.texto}
              </span>
              <Link href="/reservar" className="border border-hueso px-3 py-1.5 fila">
                Reservar
              </Link>
            </div>
          </nav>
        </header>

        <main id="contenido">{children}</main>

        <footer className="mt-24 border-t border-borde">
          <div className="mx-auto max-w-5xl px-4 py-10 text-xs uppercase text-gris">
            <p>{site.nombre}</p>
            {site.contacto.direccion && <p className="mt-1">{site.contacto.direccion}</p>}
            {site.contacto.mapa && (
              <p className="mt-1">
                <a href={site.contacto.mapa} target="_blank" rel="noopener noreferrer" className="text-ambar">
                  Abrir en el mapa
                </a>
              </p>
            )}
            {site.redes.instagram && (
              <p className="mt-1">
                <a href={site.redes.instagram} target="_blank" rel="noopener noreferrer" className="text-ambar">
                  Instagram
                </a>
              </p>
            )}
          </div>
        </footer>
      </body>
    </html>
  );
}
