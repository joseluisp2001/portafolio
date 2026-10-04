import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible } from 'next/font/google';
import Link from 'next/link';
import { site } from '@/config/site';
import { urlSitio } from '@/lib/site-url';
import './globals.css';

/*
  Atkinson Hyperlegible, del Braille Institute, dibujada para baja vision. Las
  letras que se confunden —I l 1, O 0, b d— estan diferenciadas a proposito.

  No se eligio porque quede bien: se eligio porque es la que mas gente puede
  leer. Es la unica de los ocho proyectos elegida por esa razon.

  (12-9-2026) La version de Gravity la habia cambiado por Inter. Se devolvio:
  el resto de su diseno —encabezado fijo, portada en dos columnas, pie en dos
  columnas— se conserva.
*/
const atkinson = Atkinson_Hyperlegible({
  subsets: ['latin'],
  display: 'swap',
  variable: '--fuente-cuerpo',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(urlSitio),
  title: {
    default: site.descripcionCorta ? `${site.nombre} — ${site.descripcionCorta}` : site.nombre,
    template: `%s · ${site.nombre}`,
  },
  description: site.descripcionLarga,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'es_CR',
    siteName: site.nombre,
    title: site.nombre,
    description: site.descripcionLarga,
    url: urlSitio,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: '#0f5d52' };

/* La cruz del logo. Decorativa: el nombre va escrito al lado. */
function Cruz({ tam = 20 }: { tam?: number }) {
  return (
    <svg aria-hidden="true" width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 3v18M3 12h18" />
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CR" className={atkinson.variable}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-verde focus:px-5 focus:py-3 focus:text-blanco"
        >
          Saltar al contenido
        </a>

        {/*
          Si es la demo del portafolio, se dice ARRIBA DE TODO y no en letra chica
          en el pie. Ver `demo` en config/site.ts.
        */}
        {site.demo && (
          <p className="bg-tinta px-5 py-2 text-center text-chico text-blanco">
            Sitio de demostración: el nombre, el número de incorporación y los barrios son de
            ejemplo.
          </p>
        )}

        <header className="sticky top-0 z-50 border-b-2 border-borde bg-blanco/95 backdrop-blur">
          <nav
            aria-label="Principal"
            className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3"
          >
            <Link href="/" className="toque gap-3 text-h3 font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-verde text-blanco">
                <Cruz />
              </span>
              {site.nombre}
            </Link>

            <Link href="/hoy" className="boton toque rounded-full bg-verde text-blanco hover:bg-tinta">
              ¿Lo necesita hoy?
            </Link>
          </nav>
        </header>

        <main id="contenido" className="w-full flex-1">
          {children}
        </main>

        <footer className="mt-16 border-t-2 border-borde bg-nieve">
          <div className="mx-auto grid max-w-6xl items-start gap-8 px-5 py-12 md:grid-cols-2">
            {/*
              Quien atiende y su numero de incorporacion.

              Es lo que le permite a alguien verificar que la persona que va a
              entrar a su casa a poner una inyeccion esta habilitada. Si falta,
              se dice que falta — no se esconde.

              Dice "incorporacion" y no "licencia" (como puso Gravity): es el
              termino del Colegio de Enfermeras de Costa Rica, y es el que la
              gente busca para verificarlo.
            */}
            <div>
              <p className="flex items-center gap-2 text-h3 font-bold">
                <span className="text-verde">
                  <Cruz tam={18} />
                </span>
                {site.nombre}
              </p>

              {site.profesional.nombre ? (
                <p className="mt-3">
                  <span className="font-bold">{site.profesional.nombre}</span>
                  {site.profesional.titulo && <span className="text-gris"> · {site.profesional.titulo}</span>}
                  {site.profesional.incorporacion && (
                    <span className="numero block text-gris">
                      Incorporación N.º {site.profesional.incorporacion}
                    </span>
                  )}
                </p>
              ) : (
                <p className="mt-3 text-urgente">
                  Faltan el nombre y el número de incorporación en config/site.ts. El build de
                  producción no deja publicar sin ellos.
                </p>
              )}
            </div>

            <p className="medida text-chico text-gris md:justify-self-end md:text-right">
              Este sitio no da consejo médico. Los servicios que requieren indicación médica
              se aplican con la receta correspondiente.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
