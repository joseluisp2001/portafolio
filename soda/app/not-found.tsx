import Link from 'next/link';
import { site } from '@/config/site';

/*
  Sin este archivo, cualquier URL que no exista devuelve la pagina por defecto de
  Next: fondo blanco, "404 | This page could not be found", en ingles, sin
  encabezado, sin pie y sin ningun camino de vuelta.

  Pasa mas de lo que parece en un negocio que vive en WhatsApp: enlaces
  reenviados cortados a la mitad, una seccion que se renombro, un link viejo
  guardado por alguien hace meses.
*/
export default function NoEncontrado() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-24 sm:px-8 sm:py-32">
      <p className="text-pie text-tinta-suave">Error 404</p>
      <h1 className="mt-3 font-display text-h1">Esta pagina no existe</h1>

      <p className="medida mt-5">
        Puede que el enlace este cortado o que hayamos cambiado algo de lugar. La
        carta sigue en su sitio.
      </p>

      <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-pie">
        <Link href="/carta" className="text-tomate-hondo underline underline-offset-4">
          Ver la carta
        </Link>
        <Link href="/" className="text-tomate-hondo underline underline-offset-4">
          Volver al inicio
        </Link>
      </p>

      <p className="mt-10 text-pie text-tinta-suave">{site.nombre}</p>
    </div>
  );
}
