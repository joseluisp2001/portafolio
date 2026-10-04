import type { Metadata, Viewport } from 'next';
import { Nunito } from 'next/font/google';
import Link from 'next/link';
import { site } from '@/config/site';
import { urlSitio } from '@/lib/site-url';
import BotonWhatsApp from '@/components/BotonWhatsApp';
import './globals.css';

/*
  Una sola familia para todo. La sencillez es parte de la identidad, y ademas es
  lo contrario de la soda, que mezcla serif y sans.
*/
const nunito = Nunito({
  subsets: ['latin'],
  display: 'swap',
  variable: '--fuente-cuerpo',
  weight: ['400', '600', '800'],
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
  themeColor: '#fdfcfa',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CR" className={nunito.variable}>
      <body>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-arena focus:px-5 focus:py-2"
        >
          Saltar al contenido
        </a>

        <header className="sticky top-0 z-40 bg-nube/90 backdrop-blur">
          <nav
            aria-label="Principal"
            className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4"
          >
            <Link href="/" className="text-lg font-extrabold">
              {site.nombre}
            </Link>

            <ul className="flex items-center gap-4 text-sm sm:gap-6">
              <li>
                <Link href="/servicios" className="hover:text-salvia-texto">
                  Servicios
                </Link>
              </li>
              <li>
                {/* Emergencias en pastilla, siempre visible: es la razon por la
                    que alguien abre este sitio a las 11 de la noche. */}
                <Link
                  href="/emergencias"
                  className="rounded-full bg-arena px-4 py-2 font-semibold hover:bg-salvia-texto hover:text-nube"
                >
                  Emergencias
                </Link>
              </li>
            </ul>
          </nav>
        </header>

        <main id="contenido" className="pb-28">
          {children}
        </main>

        <footer className="border-t border-tinta/10 bg-arena/40">
          <div className="mx-auto max-w-5xl px-5 py-12 text-sm">
            <p className="font-extrabold">{site.nombre}</p>
            {site.contacto.direccion && <p className="mt-2">{site.contacto.direccion}</p>}
            {site.contacto.mapa && (
              <p className="mt-1">
                <a
                  href={site.contacto.mapa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cielo-texto underline underline-offset-4"
                >
                  Abrir en el mapa
                </a>
              </p>
            )}
            {site.contacto.correo && (
              <p className="mt-1">
                <a
                  href={`mailto:${site.contacto.correo}`}
                  className="text-cielo-texto underline underline-offset-4"
                >
                  {site.contacto.correo}
                </a>
              </p>
            )}
          </div>
        </footer>

        <BotonWhatsApp />
      </body>
    </html>
  );
}
