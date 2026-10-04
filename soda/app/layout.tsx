import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import { site } from '@/config/site';
import { urlSitio } from '@/lib/site-url';
import { ProveedorCanasta } from '@/components/Canasta';
import Encabezado from '@/components/Encabezado';
import Pie from '@/components/Pie';
import BotonCanasta from '@/components/BotonCanasta';
import './globals.css';

/*
  Subconjunto `latin` y nada mas: ya incluye a e i o u con tilde, la ene y los
  signos de apertura. `latin-ext` son kilobytes que este sitio no usa, y Fraunces
  es una fuente pesada.

  `display: swap` mas una tipografia de respaldo con metricas parecidas, o el
  titulo salta cuando carga la buena — y en titulos de 4,5rem ese salto se ve
  desde la calle.
*/
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--fuente-display',
  weight: ['600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--fuente-cuerpo',
});

/*
  El negocio ocurre en WhatsApp: el link se pega en un grupo y lo que se ve es la
  tarjeta, no el sitio. shein-los-guido no tiene nada de esto y sale un renglon
  pelado. Es la primera impresion real, mas que la portada.
*/
export const metadata: Metadata = {
  metadataBase: new URL(urlSitio),
  title: {
    default: `${site.nombre} — ${site.descripcionCorta}`,
    template: `%s · ${site.nombre}`,
  },
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
  themeColor: '#faf6ef',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CR" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <ProveedorCanasta>
          <a
            href="#contenido"
            className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-papel focus:px-4 focus:py-2"
          >
            Saltar al contenido
          </a>
          <Encabezado />
          {/* El espacio de abajo es para que el boton flotante del pedido no
              tape la ultima linea de la carta de forma permanente. */}
          <main id="contenido" className="pb-24">
            {children}
          </main>
          <Pie />
          <BotonCanasta />
        </ProveedorCanasta>
      </body>
    </html>
  );
}
