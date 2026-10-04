import type { Metadata, Viewport } from 'next';
import { Newsreader, Inter } from 'next/font/google';
import { cv } from '@/config/cv';
import { urlSitio } from '@/lib/site-url';
import './globals.css';

/*
  El eje `opsz` (tamano optico) es lo que hace que el nombre a 2,5rem y un
  subtitulo a 1rem no se vean dibujados con el mismo grosor de trazo. Newsreader
  es variable y lo trae; sin declararlo, next/font sirve un solo corte y se
  pierde justamente el ajuste que uno queria.
*/
const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--fuente-titulo',
  // Sin `weight`: con `axes` declarado, next/font exige la fuente variable
  // entera. Poner pesos fijos ademas de un eje es justamente lo que rechaza.
  axes: ['opsz'],
});

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--fuente-cuerpo' });

export const metadata: Metadata = {
  metadataBase: new URL(urlSitio),
  title: `${cv.nombre} — ${cv.titulo}`,
  description: cv.resumen.slice(0, 155),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'profile',
    locale: 'es_CR',
    title: cv.nombre,
    description: cv.titulo,
    url: urlSitio,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: '#ededea' };

/*
  Marca <html data-mov> ANTES de pintar, y solo si la persona no pidio "reducir
  movimiento". Todo lo que el CSS esconde para despues revelarlo cuelga de esa
  marca: sin ella, la pagina se ve entera y quieta.

  Tiene que ir en linea en <head>. Si esperara al JS de React, el primer cuadro
  saldria con todo visible y un instante despues se esconderia: un parpadeo.

  Salida de emergencia: si a los 3 s el JS de la pagina no arranco (red lenta,
  un error), quita la marca y todo aparece. Un curriculum a medio mostrar es
  peor que uno sin animacion.
*/
const marcarMovimiento = `(function(){try{var d=document.documentElement;if(!window.matchMedia||matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.setAttribute('data-mov','');setTimeout(function(){if(!window.__revelar)d.removeAttribute('data-mov')},3000)}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: el script de arriba agrega data-mov a <html>
    // antes de que React hidrate, y React avisaria de un atributo que el
    // servidor no mando. Aplica solo a los atributos de <html>, no a los hijos.
    <html lang="es-CR" className={`${newsreader.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: marcarMovimiento }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
