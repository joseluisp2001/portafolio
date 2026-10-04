import { Suspense } from 'react';
import { total } from '@/lib/catalogo';
import Explorador from '@/components/Explorador';

/*
  La portada ES el buscador.

  Sin hero fotografico, sin carrusel de destacados, sin "descubri nuestra pasion
  por las herramientas". Quien entra a una ferreteria en linea ya sabe que
  quiere y muchas veces esta apurado, con la tuberia goteando. Cada pixel de
  decoracion es un pixel que aleja el resultado.
*/

/* Esqueleto del tamano exacto de las filas: cuando llega el contenido, nada
   salta. En listas largas, el salto es el defecto que mas molesta. */
function Esqueleto() {
  return (
    <div className="mx-auto max-w-5xl px-3 py-4">
      <div className="esqueleto h-32 rounded-xs" />
      <ul className="mt-8 overflow-hidden rounded-xs border border-linea">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="fila flex items-center gap-3 border-b border-linea bg-fila px-3">
            <span className="esqueleto size-12 shrink-0 rounded-xs" />
            <span className="flex-1">
              <span className="esqueleto block h-3.5 w-2/3 rounded-xs" />
              <span className="esqueleto mt-2 block h-3 w-1/2 rounded-xs" />
            </span>
            <span className="esqueleto h-3.5 w-16 rounded-xs" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Inicio() {
  return (
    <>
      <div className="border-b border-linea bg-fila">
        <div className="mx-auto max-w-5xl px-3 pt-5 pb-2">
          <h1 className="text-h1 font-semibold">Que anda buscando</h1>
          <p className="mt-1 text-apagado">
            {/* El conteo real de articulos: es el dato que dice "aca si esta lo
                que busco". */}
            {total} articulos en la lista · si no aparece, preguntenos
          </p>
        </div>
      </div>

      {/* `useSearchParams` obliga a un limite de Suspense para que Next pueda
          prerenderizar el resto. */}
      <Suspense fallback={<Esqueleto />}>
        <Explorador />
      </Suspense>
    </>
  );
}
