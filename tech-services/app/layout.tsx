import type { Metadata, Viewport } from 'next';
import { siteUrlObjeto } from '@/lib/site-url';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Intro, INTRO_SCRIPT } from '@/components/Intro';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { template: '%s | Desamparados Tech', default: 'Desamparados Tech — Servicios técnicos y automatización' },
  description: 'Reparación de equipos, automatización de procesos, redes e infraestructura, y desarrollo de software a medida. En Desamparados, San José.',
  metadataBase: siteUrlObjeto,
};

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
};

// Sin JavaScript (bloqueado, o el paquete no llegó en una red mala): Motion deja
// las entradas en opacidad 0 desde el servidor y el hero, las tarjetas y la tienda
// salían en blanco. Solo los elementos de Motion llevan data-revelar: un
// transform:none en sus hijos rompería los transform de los SVG de las escenas.
// El carrusel queda como una fila que se desliza, sin controles que no harían nada.
const SIN_JS = [
  '[data-revelar]{opacity:1!important;transform:none!important}',
  '[data-encabezado]{background:rgb(15 23 42/.95)!important}',
  '.carrusel-controles{display:none!important}',
  '.carrusel-pista{scrollbar-width:thin!important}',
  '.carrusel-diapo{transform:none!important;opacity:1!important}',
  '.carrusel-diapo .tarjeta-servicio::after{opacity:0!important}',
].join('');

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: INTRO_SCRIPT agrega `data-intro` al <html>
    // antes de que React hidrate, a propósito.
    <html lang="es" dir="ltr" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
        <noscript dangerouslySetInnerHTML={{ __html: `<style>${SIN_JS}</style>` }} />
      </head>
      <body className="min-h-dvh antialiased">
        <Intro />
        {children}
      </body>
    </html>
  );
}
