'use client';

import { colones } from '@/lib/whatsapp';
import { useCanasta } from '@/components/Canasta';
import type { Plato } from '@/config/site';

/*
  No es una tarjeta: es una linea de carta de restaurante. Nombre a la izquierda,
  precio a la derecha, descripcion debajo, y una linea de 1 px que separa.

  Sin boton por plato: la linea entera agrega. Un boton por fila mete un elemento
  de interfaz cada 60 px y rompe el tono de revista, que es justamente lo que
  esta estetica vino a conseguir.
*/
export default function LineaPlato({ plato }: { plato: Plato }) {
  const { agregar, quitar, cantidadDe } = useCanasta();
  const cantidad = cantidadDe(plato.id);

  return (
    <li className="plato border-b border-linea">
      <div className="flex items-start gap-4 py-4">
        <button
          type="button"
          onClick={() => agregar(plato.id)}
          aria-label={`Agregar ${plato.nombre} al pedido, ${colones(plato.precio)}`}
          className="group flex-1 text-left"
        >
          {/*
            `min-w-0` en el nombre es lo que permite que envuelva dentro de su
            columna en vez de empujar el precio fuera de la fila. Sin eso, en un
            telefono de 375 px "Casado con bistec en salsa" desarma la linea
            entera y el precio termina pegado al nombre.
          */}
          <span className="flex items-baseline gap-3">
            <span className="min-w-0 flex-1 font-display text-h3 font-semibold leading-snug group-hover:text-tomate">
              {plato.nombre}
            </span>

            {/* Los puntos guia son de pantalla ancha y de papel. En un telefono
                no hay distancia que guiar, y ocupan el lugar del nombre. */}
            <span
              aria-hidden
              className="mb-1.5 hidden min-w-8 flex-1 self-end border-b-2 border-dotted border-guia sm:block"
            />

            <span className="shrink-0 font-cuerpo text-h3 tabular-nums text-tomate">
              {colones(plato.precio)}
            </span>
          </span>

          <span className="mt-1 block text-pie text-tinta-suave">
            {plato.descripcion}
            {plato.nota && <span className="ml-2 text-oliva">· {plato.nota}</span>}
          </span>
        </button>

        {/* Los controles solo aparecen cuando ya hay algo pedido: mientras la
            canasta esta vacia, la carta se lee limpia. */}
        {cantidad > 0 && (
          <div className="no-imprimir flex shrink-0 items-center gap-1 self-center">
            <button
              type="button"
              onClick={() => quitar(plato.id)}
              aria-label={`Quitar uno de ${plato.nombre}`}
              className="size-11 text-tinta-suave hover:text-tomate-hondo"
            >
              −
            </button>
            <span aria-live="polite" className="w-6 text-center tabular-nums">
              {cantidad}
            </span>
            <button
              type="button"
              onClick={() => agregar(plato.id)}
              aria-label={`Agregar otro ${plato.nombre}`}
              className="size-11 text-tinta-suave hover:text-tomate-hondo"
            >
              +
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
