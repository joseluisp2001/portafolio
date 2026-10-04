'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { site } from '@/config/site';

/*
  Fila de texto, sin caja y sin fondo. Al bajar se pega y aparecen el papel y la
  linea de 1 px. Nada de logo dentro de una caja con sombra: esto es una revista.
*/
export default function Encabezado() {
  /*
    El encabezado transparente solo tiene sentido montado sobre una foto a
    sangre. Sin foto, "sin fondo" significa que el nombre del negocio se dibuja
    encima del nombre de un plato: lo vi pasar en el telefono, con "Soda La
    Esquina" montado sobre "Gallo pinto".

    Asi que la transparencia esta atada a que exista la foto. Mientras
    site.hero.foto este vacio, el encabezado lleva papel desde el primer pixel.
  */
  const hayFoto = site.hero.foto !== '';
  const [pegado, setPegado] = useState(false);

  useEffect(() => {
    if (!hayFoto) return;
    const alScrollear = () => setPegado(window.scrollY > 8);
    alScrollear();
    window.addEventListener('scroll', alScrollear, { passive: true });
    return () => window.removeEventListener('scroll', alScrollear);
  }, [hayFoto]);

  const conFondo = !hayFoto || pegado;

  return (
    <header
      className={[
        'no-imprimir sticky top-0 z-40 transition-colors duration-300',
        conFondo ? 'bg-papel border-b border-linea' : 'border-b border-transparent',
      ].join(' ')}
    >
      <nav
        aria-label="Principal"
        className="mx-auto flex max-w-5xl items-baseline justify-between gap-6 px-5 py-4 sm:px-8"
      >
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          {site.nombre}
        </Link>

        <ul className="flex items-baseline gap-5 text-pie sm:gap-7">
          <li>
            <Link href="/carta" className="hover:text-tomate hover:underline underline-offset-4">
              Carta
            </Link>
          </li>
          <li>
            <Link href="/#donde" className="hover:text-tomate hover:underline underline-offset-4">
              Donde estamos
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
