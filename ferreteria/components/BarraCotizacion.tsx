'use client';

import { useEffect, useState } from 'react';
import { colones, hayWhatsApp, urlWhatsApp } from '@/lib/whatsapp';
import { useCotizacion } from '@/components/Cotizacion';

/*
  La barra de la cotizacion y su panel.

  El mensaje lleva SIEMPRE el codigo de cada articulo. Es lo que hace que del
  otro lado no haya que adivinar cual de los cuatro tornillos parecidos es, y es
  la diferencia entre contestar en diez segundos o en tres mensajes.
*/
export default function BarraCotizacion() {
  const { lineas, unidades, agregar, quitar, fijar, vaciar } = useCotizacion();
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [abierto]);

  if (unidades === 0) return null;

  const estimado = lineas.reduce((s, l) => s + l.articulo.precio * l.cantidad, 0);

  const mensaje = [
    'Buenas! Necesito cotizar:',
    '',
    ...lineas.map((l) => `• ${l.articulo.nombre} (${l.articulo.codigo}) — ${l.cantidad}`),
    '',
    '¿Me confirman disponibilidad y precio?',
  ].join('\n');

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-fila shadow-[var(--shadow-unica)]">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-3 py-2">
          <button
            type="button"
            onClick={() => setAbierto((a) => !a)}
            className="flex-1 rounded-xs px-2 py-2 text-left hover:bg-hover"
          >
            <span className="font-medium">
              {unidades} {unidades === 1 ? 'articulo' : 'articulos'} en la cotizacion
            </span>
            <span className="precio ml-2 text-apagado">≈ {colones(estimado)}</span>
          </button>

          {hayWhatsApp ? (
            <a
              href={urlWhatsApp(mensaje)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-xs bg-azul px-4 py-3 font-medium text-white"
            >
              Cotizar por WhatsApp
            </a>
          ) : (
            <span className="shrink-0 rounded-xs border border-error px-3 py-2 text-xs text-error">
              Falta el WhatsApp en config/site.ts
            </span>
          )}
        </div>

        {abierto && (
          <div className="mx-auto max-h-[50vh] max-w-5xl overflow-y-auto border-t border-linea px-3 py-2">
            <ul>
              {lineas.map(({ articulo, cantidad }) => (
                <li key={articulo.codigo} className="fila flex items-center gap-3 border-b border-linea">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{articulo.nombre}</span>
                    <span className="codigo block text-xs text-apagado">
                      {articulo.codigo} · {articulo.presentacion}
                    </span>
                  </span>

                  <span className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => quitar(articulo.codigo)}
                      aria-label={`Quitar uno de ${articulo.nombre}`}
                      className="size-11 rounded-xs border border-linea"
                    >
                      −
                    </button>
                    <label className="sr-only" htmlFor={`cantidad-${articulo.codigo}`}>
                      Cantidad de {articulo.nombre}
                    </label>
                    <input
                      id={`cantidad-${articulo.codigo}`}
                      type="number"
                      min={0}
                      max={999}
                      value={cantidad}
                      onChange={(e) => fijar(articulo.codigo, Number(e.target.value))}
                      className="precio w-16 rounded-xs border border-linea px-2 py-2 text-center"
                    />
                    <button
                      type="button"
                      onClick={() => agregar(articulo.codigo)}
                      aria-label={`Agregar otro ${articulo.nombre}`}
                      className="size-11 rounded-xs border border-linea"
                    >
                      +
                    </button>
                  </span>

                  <span className="precio w-24 shrink-0 text-right">
                    {colones(articulo.precio * cantidad)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between py-3">
              <button type="button" onClick={vaciar} className="rounded-xs px-3 py-2 text-error hover:bg-hover">
                Vaciar
              </button>
              <p className="text-xs text-apagado">
                El total es estimado. El precio final se confirma por WhatsApp segun cantidad
                y bodega.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Espacio para que la barra no tape la ultima fila de la lista. */}
      <div aria-hidden className="h-16" />
    </>
  );
}
