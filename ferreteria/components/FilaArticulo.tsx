'use client';

import Link from 'next/link';
import { colones } from '@/lib/whatsapp';
import { useCotizacion } from '@/components/Cotizacion';
import type { Articulo } from '@/lib/catalogo';

/*
  La fila de resultado.

  Sin tarjetas: una grilla de tarjetas de 300 px muestra 6 productos por
  pantalla; esta lista muestra 11 en un celular y 18 en escritorio. En un
  catalogo, cada pixel de decoracion es un pixel que aleja el resultado.

  El precio va alineado a la derecha y con numeros tabulares para que las cifras
  queden en columna: eso es lo que permite comparar de un vistazo.
*/
export default function FilaArticulo({ articulo }: { articulo: Articulo }) {
  const { agregar, cantidadDe } = useCotizacion();
  const cantidad = cantidadDe(articulo.codigo);

  return (
    <li className="fila flex items-center gap-3 border-b border-linea bg-fila px-3 hover:bg-hover">
      {/* La fila entera abre el articulo. El boton de agregar tiene su propia
          zona de toque al borde derecho. */}
      <Link href={`/a/${articulo.codigo}`} className="flex min-w-0 flex-1 items-center gap-3 py-2">
        <span
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center rounded-xs bg-fondo text-apagado"
        >
          {/* Sin foto todavia: la inicial del codigo hace de marcador y evita un
              hueco gris. El dia que haya fotos, esto es un <Image>. */}
          <span className="codigo text-xs">{articulo.codigo.slice(0, 2)}</span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="truncate font-medium">{articulo.nombre}</span>
            <span className="codigo shrink-0 text-xs text-apagado">{articulo.codigo}</span>
          </span>

          <span className="mt-0.5 flex items-center gap-2 text-xs text-apagado">
            <span className="truncate">
              {articulo.presentacion} · {articulo.detalle}
            </span>
            {!articulo.stock && (
              <>
                {/* La palabra NUNCA va en naranja: #FF6A00 sobre fondo claro da
                    2,6:1 y no se lee. El naranja es el punto; el texto es gris. */}
                <span aria-hidden className="size-2 shrink-0 rounded-full bg-naranja" />
                <span className="shrink-0">Sobre pedido</span>
              </>
            )}
          </span>
        </span>

        <span className="precio w-24 shrink-0 text-right font-medium">{colones(articulo.precio)}</span>
      </Link>

      {/* 44x44 reales. Un [+] de 24 px dentro de una fila de 56 es un blanco al
          que se le falla seguido, y fallarle abre el articulo sin querer. */}
      <button
        type="button"
        onClick={() => agregar(articulo.codigo)}
        aria-label={`Agregar ${articulo.nombre} a la cotizacion`}
        className="flex size-11 shrink-0 items-center justify-center rounded-xs border border-linea bg-fila text-azul hover:bg-elegido"
      >
        {cantidad > 0 ? <span className="text-xs font-semibold">{cantidad}</span> : '+'}
      </button>
    </li>
  );
}
