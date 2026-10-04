import Link from 'next/link';
import { site } from '@/config/site';
import { colones } from '@/lib/whatsapp';

/*
  Portada: sin foto de hero. Un titular que ocupa casi toda la pantalla, y
  debajo la tabla de precios.

  Las fotos existen, pero abajo y en blanco y negro dentro de la rejilla. Es lo
  que hace que esta estetica perdone material malo: una foto de celular, en
  blanco y negro y con bordes duros alrededor, se ve intencional.
*/

function Titular() {
  return (
    <section className="border-b border-borde">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:py-28">
        <h1 className="text-h1">
          {site.titular.map((linea) => (
            <span key={linea} className="block">
              {linea}
            </span>
          ))}
        </h1>

        <p className="mt-8 border-t border-borde pt-6 text-xs uppercase text-gris">
          {site.descripcionCorta}
        </p>
      </div>
    </section>
  );
}

function Precios() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <h2 className="text-h2">Precios</h2>

      {/*
        No es una tarjeta por servicio: es una tabla. Nombre a la izquierda,
        duracion al centro, precio a la derecha, los tres alineados en columna.
        Eso es lo que permite comparar de un vistazo, y ninguna de las otras
        esteticas del grupo presenta los precios asi.
      */}
      <ul className="mt-8 border-t border-borde">
        {site.servicios.map((servicio) => (
          <li key={servicio.id}>
            <Link
              href={{ pathname: '/reservar', query: { servicio: servicio.id } }}
              className="fila flex items-baseline gap-4 border-b border-borde px-3 py-4 uppercase"
            >
              <span className="min-w-0 flex-1 font-semibold">
                {servicio.nombre}
                {servicio.detalle && (
                  <span className="ml-2 normal-case text-gris">({servicio.detalle})</span>
                )}
              </span>
              <span className="hidden shrink-0 text-gris sm:block">{servicio.duracion} min</span>
              <span className="w-24 shrink-0 text-right tabular-nums text-ambar">
                {colones(servicio.precio)}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8">
        <Link href="/reservar" className="fila inline-block border border-hueso px-5 py-3 uppercase">
          Apartar hora →
        </Link>
      </p>
    </section>
  );
}

function Horario() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-16">
      <h2 className="text-h2">Horario</h2>

      <div className="rejilla mt-8 grid-cols-2 sm:grid-cols-4">
        {site.horario.map((franja, i) =>
          franja ? (
            <div key={franja.dia} className="px-4 py-5">
              <p className="text-xs uppercase text-gris">{franja.dia}</p>
              <p className="mt-1 tabular-nums">
                {franja.abre}–{franja.cierra}
              </p>
            </div>
          ) : (
            <div key={`cerrado-${i}`} className="px-4 py-5">
              <p className="text-xs uppercase text-gris">Domingo</p>
              <p className="mt-1 text-gris">Cerrado</p>
            </div>
          ),
        )}
      </div>
    </section>
  );
}

export default function Inicio() {
  return (
    <>
      <Titular />
      <Precios />
      <Horario />
    </>
  );
}
