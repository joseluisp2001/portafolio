import type { Metadata } from 'next';
import { site } from '@/config/site';
import { hayWhatsApp, urlWhatsApp } from '@/lib/whatsapp';

/*
  La pagina que justifica el sitio.

  Alguien con un animal convulsionando a las 11 de la noche no navega: busca un
  numero. Por eso esta pagina no tiene ni una sola pieza interactiva, ni un
  componente de cliente, ni JavaScript propio: es HTML plano que renderiza en el
  servidor y abre aunque todo lo demas falle.

  Y el tono: nada de "¡NO ESPERE!" ni de rojo. Quien la esta leyendo ya esta
  asustado; subirle el pulso no ayuda a que haga bien lo que hay que hacer.
*/

export const metadata: Metadata = {
  title: 'Emergencias',
  description: 'Que hacer mientras llega a la clinica. Telefono y ubicacion.',
  alternates: { canonical: '/emergencias' },
};

export default function Emergencias() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="text-h1">Emergencias</h1>

      <p className="mt-4 text-lg">
        Primero: llame o escriba, y venga. Vaya leyendo esto en el camino si alguien mas
        puede manejar.
      </p>

      {/* El contacto ARRIBA de todo el contenido. Nadie deberia tener que bajar
          para encontrar un numero en esta pagina. */}
      <div className="mt-8 rounded-3xl bg-arena px-6 py-6 shadow-blanda">
        {site.contacto.telefono ? (
          <p className="text-2xl font-extrabold">
            <a href={`tel:+${site.contacto.telefono}`} className="text-salvia-texto">
              {site.contacto.telefono}
            </a>
          </p>
        ) : (
          <p className="font-semibold text-alerta">
            Falta el telefono en config/site.ts. En esta pagina, mas que en ninguna otra.
          </p>
        )}

        {hayWhatsApp && (
          <p className="mt-3">
            <a
              href={urlWhatsApp('Emergencia. Voy en camino con mi animal.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-full bg-salvia-texto px-6 py-3 font-semibold text-nube"
            >
              Avisar por WhatsApp que voy en camino
            </a>
          </p>
        )}

        {site.contacto.mapa && (
          <p className="mt-3">
            <a
              href={site.contacto.mapa}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cielo-texto underline underline-offset-4"
            >
              Como llegar
            </a>
          </p>
        )}
      </div>

      <h2 className="mt-14 text-h2">Mientras llega</h2>

      <div className="mt-6 space-y-4">
        {site.emergencias.map((caso) => (
          <details
            key={caso.titulo}
            className="group rounded-3xl bg-tarjeta px-6 py-5 shadow-blanda open:shadow-alta"
          >
            {/* `details` en vez de un acordeon en JavaScript: funciona sin JS,
                lo lee cualquier lector de pantalla y no puede romperse. */}
            <summary className="cursor-pointer list-none font-bold marker:hidden">
              <span className="flex items-center justify-between gap-4">
                {caso.titulo}
                <span aria-hidden className="text-salvia-texto group-open:hidden">
                  +
                </span>
                <span aria-hidden className="hidden text-salvia-texto group-open:inline">
                  −
                </span>
              </span>
            </summary>

            <p className="mt-3 text-tinta/85">{caso.texto}</p>
          </details>
        ))}
      </div>

      <p className="mt-10 text-sm text-tinta/70">
        Esto no reemplaza una consulta: es lo que ayuda a que su animal llegue mejor.
      </p>
    </div>
  );
}
