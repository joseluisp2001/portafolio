import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import { site } from '@/config/site';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], display: 'swap', variable: '--fuente-cuerpo' });

/*
  `noindex, nofollow` y nada de openGraph.

  Este panel no se comparte y no deberia aparecer en ningun lado. Los otros
  cuatro proyectos llevan tarjeta de WhatsApp y sitemap justamente porque viven
  de que los compartan; este es exactamente lo contrario.
*/
export const metadata: Metadata = {
  title: site.nombre,
  description: site.descripcionCorta,
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = { themeColor: '#fafaf8' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CR" className={dmSans.variable}>
      <body>{children}</body>
    </html>
  );
}
