'use client';

import { useEffect, useState } from 'react';
import { colones, hayWhatsApp, urlWhatsApp } from '@/lib/whatsapp';
import { useCanasta } from '@/components/Canasta';

/*
  Boton flotante con el total, y el panel del pedido.

  Regla que no se negocia: NADA puede quedar entre la persona y el chat. Ni un
  modal que haya que cerrar, ni una validacion que falle cerrada, ni un
  formulario obligatorio. Si algo falla, el enlace a WhatsApp sigue funcionando.
*/
export default function BotonCanasta() {
  const { lineas, total, unidades, quitar, agregar, vaciar, huboDescartes } = useCanasta();
  const [abierto, setAbierto] = useState(false);

  // Escape cierra el panel: es lo que espera cualquiera que lo abra con teclado.
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [abierto]);

  if (unidades === 0) {
    return huboDescartes ? (
      <p
        role="status"
        className="no-imprimir fixed bottom-4 left-1/2 z-40 -translate-x-1/2 border border-linea bg-papel-hondo px-4 py-2 text-pie"
      >
        Sacamos un plato del pedido: ya no esta en la carta.
      </p>
    ) : null;
  }

  const mensaje = [
    'Buenas! Quiero pedir:',
    '',
    ...lineas.map((l) => `• ${l.cantidad} × ${l.plato.nombre} — ${colones(l.plato.precio * l.cantidad)}`),
    '',
    `Total: ${colones(total)}`,
  ].join('\n');

  return (
    <>
      {/*
        En telefono es una barra de borde a borde; de sm para arriba, la pastilla
        centrada. Centrada y con texto largo, en 375 px se envolvia en tres
        renglones y tapaba media carta.
      */}
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="no-imprimir entra fixed inset-x-4 bottom-4 z-40 flex items-baseline justify-between gap-3 rounded-xs border border-tinta bg-tinta px-5 py-3 text-left text-papel sm:inset-x-auto sm:left-1/2 sm:w-auto sm:-translate-x-1/2 sm:justify-start"
      >
        <span className="whitespace-nowrap text-pie">
          Ver el pedido · {unidades} {unidades === 1 ? 'cosa' : 'cosas'}
        </span>
        <span className="whitespace-nowrap font-display text-h3 tabular-nums">{colones(total)}</span>
      </button>

      {abierto && (
        <div className="no-imprimir fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
          <button
            type="button"
            aria-label="Cerrar el pedido"
            onClick={() => setAbierto(false)}
            className="absolute inset-0 bg-tinta/40"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tu pedido"
            className="relative flex max-h-[85vh] w-full flex-col bg-papel sm:max-w-lg"
          >
            <div className="flex items-baseline justify-between border-b border-linea px-6 py-4">
              <h2 className="font-display text-h3 font-semibold">Tu pedido</h2>
              <button type="button" onClick={() => setAbierto(false)} className="px-2 text-pie text-tinta-suave">
                Cerrar
              </button>
            </div>

            <ul className="flex-1 overflow-y-auto px-6">
              {lineas.map(({ plato, cantidad }) => (
                <li key={plato.id} className="flex items-center gap-3 border-b border-linea py-3">
                  <div className="flex-1">
                    <p className="font-display">{plato.nombre}</p>
                    <p className="text-pie text-tinta-suave tabular-nums">
                      {colones(plato.precio)} c/u
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => quitar(plato.id)}
                      aria-label={`Quitar uno de ${plato.nombre}`}
                      className="size-11 text-tinta-suave hover:text-tomate-hondo"
                    >
                      −
                    </button>
                    <span className="w-6 text-center tabular-nums">{cantidad}</span>
                    <button
                      type="button"
                      onClick={() => agregar(plato.id)}
                      aria-label={`Agregar otro ${plato.nombre}`}
                      className="size-11 text-tinta-suave hover:text-tomate-hondo"
                    >
                      +
                    </button>
                  </div>

                  <p className="w-20 text-right font-display tabular-nums text-tomate">
                    {colones(plato.precio * cantidad)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="border-t border-linea bg-papel-hondo px-6 py-4">
              <p className="mb-3 flex items-baseline justify-between">
                <span className="font-display text-h3">Total</span>
                <span className="font-display text-h3 tabular-nums text-tomate-hondo">{colones(total)}</span>
              </p>

              {hayWhatsApp ? (
                <a
                  href={urlWhatsApp(mensaje)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-tinta px-5 py-3 text-center text-papel"
                >
                  Mandar el pedido por WhatsApp
                </a>
              ) : (
                <p className="border border-tomate-hondo px-4 py-3 text-pie text-tomate-hondo">
                  Falta el numero de WhatsApp en <code>config/site.ts</code>. El build de
                  produccion no deja publicar sin el.
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  vaciar();
                  setAbierto(false);
                }}
                className="mt-3 w-full py-2 text-pie text-tinta-suave hover:text-tomate-hondo"
              >
                Vaciar el pedido
              </button>

              <p className="mt-2 text-center text-pie text-tinta-suave">
                El pedido se manda por WhatsApp. Ahi se confirma la hora y si es para
                recoger o para comer aca.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
