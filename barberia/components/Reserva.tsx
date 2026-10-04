'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { site, serviciosPorId } from '@/config/site';
import { generarHoras, proximosDias } from '@/lib/horario';
import { colones, hayWhatsApp, urlWhatsApp } from '@/lib/whatsapp';

/*
  Servicio → dia → hora, y de ahi a WhatsApp con todo escrito.

  Regla que no se negocia: el camino al chat NUNCA se bloquea. No hay validacion
  que falle cerrada ni paso obligatorio: mientras no haya elegido, el boton
  manda un mensaje mas corto, pero manda.
*/
export default function Reserva() {
  const parametros = useSearchParams();
  const preseleccionado = parametros.get('servicio');

  const [servicioId, setServicioId] = useState(
    preseleccionado && serviciosPorId[preseleccionado] ? preseleccionado : '',
  );
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');

  const servicio = servicioId ? serviciosPorId[servicioId] : null;
  const dias = useMemo(() => proximosDias(7), []);
  const horas = useMemo(
    () => (servicio && fecha ? generarHoras(servicio, fecha) : []),
    [servicio, fecha],
  );

  const diaElegido = dias.find((d) => d.iso === fecha);

  const mensaje = [
    'Buenas! Quiero apartar hora:',
    '',
    servicio ? `Servicio: ${servicio.nombre} (${servicio.duracion} min · ${colones(servicio.precio)})` : null,
    diaElegido ? `Dia: ${diaElegido.dia} ${diaElegido.numero}` : null,
    hora ? `Hora: ${hora}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-h2">Apartar hora</h1>

      {/* --- 1. Servicio ------------------------------------------------- */}
      <section className="mt-10">
        <h2 className="text-xs uppercase text-gris">1 · Que se hace</h2>

        <ul className="rejilla mt-3 grid-cols-1 sm:grid-cols-2">
          {site.servicios.map((s) => {
            const elegido = s.id === servicioId;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  aria-pressed={elegido}
                  onClick={() => {
                    setServicioId(s.id);
                    setHora('');
                  }}
                  className={[
                    'fila flex w-full items-baseline gap-3 px-4 py-4 text-left uppercase',
                    elegido ? 'invertida bg-ambar text-negro' : '',
                  ].join(' ')}
                >
                  <span className="min-w-0 flex-1 font-semibold">{s.nombre}</span>
                  <span className={elegido ? 'text-negro' : 'text-gris'}>{s.duracion} min</span>
                  <span className={['w-20 text-right tabular-nums', elegido ? 'text-negro' : 'text-ambar'].join(' ')}>
                    {colones(s.precio)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* --- 2. Dia ------------------------------------------------------- */}
      {servicio && (
        <section className="mt-10">
          <h2 className="text-xs uppercase text-gris">2 · Que dia</h2>

          <ul className="rejilla mt-3 grid-cols-4 sm:grid-cols-7">
            {dias.map((d) => {
              const elegido = d.iso === fecha;
              return (
                <li key={d.iso}>
                  <button
                    type="button"
                    aria-pressed={elegido}
                    onClick={() => {
                      setFecha(d.iso);
                      setHora('');
                    }}
                    className={[
                      'fila w-full px-2 py-4 text-center uppercase',
                      elegido ? 'invertida bg-ambar text-negro' : '',
                    ].join(' ')}
                  >
                    <span className={['block text-xs', elegido ? 'text-negro' : 'text-gris'].join(' ')}>
                      {d.dia.slice(0, 3)}
                    </span>
                    <span className="mt-1 block font-titulo text-xl">{d.numero}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* --- 3. Hora ------------------------------------------------------ */}
      {servicio && fecha && (
        <section className="mt-10">
          <h2 className="text-xs uppercase text-gris">
            3 · A que hora
            <span className="ml-2 normal-case">
              — el paso es de {Math.ceil((servicio.duracion + site.colchon) / 30) * 30} min porque{' '}
              {servicio.nombre.toLowerCase()} ocupa {servicio.duracion}
            </span>
          </h2>

          {horas.length === 0 ? (
            <p className="mt-3 border border-borde px-4 py-6 text-gris">
              Ya no quedan horas para ese dia. Proba con el siguiente, o escribinos y vemos.
            </p>
          ) : (
            <ul className="rejilla mt-3 grid-cols-3 sm:grid-cols-6">
              {horas.map((h) => {
                const elegido = h === hora;
                return (
                  <li key={h}>
                    <button
                      type="button"
                      aria-pressed={elegido}
                      onClick={() => setHora(h)}
                      className={[
                        'fila w-full px-2 py-4 text-center tabular-nums',
                        elegido ? 'invertida bg-ambar text-negro' : '',
                      ].join(' ')}
                    >
                      {h}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* --- Cierre ------------------------------------------------------- */}
      <section className="mt-12 border-t border-borde pt-8">
        {hayWhatsApp ? (
          <a
            href={urlWhatsApp(mensaje)}
            target="_blank"
            rel="noopener noreferrer"
            className="fila inline-block border border-ambar bg-ambar px-6 py-4 uppercase text-negro"
          >
            {hora ? `Confirmar por WhatsApp · ${hora}` : 'Escribir por WhatsApp'}
          </a>
        ) : (
          <p className="border border-ambar px-4 py-4 text-ambar">
            Falta el numero de WhatsApp en config/site.ts. El build de produccion no deja
            publicar sin el.
          </p>
        )}

        <p className="mt-4 text-gris">
          La hora se confirma por WhatsApp. Si no contesta nadie en un rato, es que esta
          cortando: igual queda anotado.
        </p>
      </section>
    </div>
  );
}
