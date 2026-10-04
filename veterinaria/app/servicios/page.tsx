import type { Metadata } from 'next';
import { site } from '@/config/site';
import { colones, hayWhatsApp, urlWhatsApp } from '@/lib/whatsapp';
import { formatoHora } from '@/lib/horario';
import Icono from '@/components/Icono';
import TablaVacunacion from '@/components/TablaVacunacion';

export const metadata: Metadata = {
  title: 'Servicios',
  description: site.servicios.map((s) => s.nombre).join(', ') + '.',
  alternates: { canonical: '/servicios' },
};

export default function Servicios() {
  return (
    <div>
      <div className="mx-auto max-w-5xl px-5 py-14">
        <h1 className="text-h1">Servicios</h1>
        <p className="mt-4 max-w-prose text-lg">
          Los precios que aparecen son el punto de partida. Lo que dependa del peso, la edad
          o del caso se lo decimos antes de hacer nada.
        </p>

        <ul className="mt-10 space-y-6">
          {site.servicios.map((servicio) => (
            <li
              key={servicio.id}
              className="flex flex-col gap-5 rounded-3xl bg-tarjeta p-8 shadow-blanda sm:flex-row sm:items-start"
            >
              <div className="shrink-0">
                <Icono nombre={servicio.icono} />
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold">{servicio.nombre}</h2>
                <p className="mt-2 text-tinta/80">{servicio.descripcion}</p>

                <p className="mt-3 text-sm font-semibold tabular-nums text-salvia-texto">
                  {servicio.precio ? `Desde ${colones(servicio.precio)}` : 'Se cotiza segun el caso'}
                </p>
              </div>

              {hayWhatsApp && (
                <a
                  href={urlWhatsApp(`Buenas! Quisiera agendar: ${servicio.nombre}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 self-start rounded-full bg-arena px-6 py-3 font-semibold transition-all duration-500 ease-blando hover:-translate-y-0.5 hover:shadow-blanda"
                >
                  Agendar
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>

      <TablaVacunacion />

      {/* El horario tambien es un dato: tabla dura, sin pastilla y sin sombra. */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <h2 className="text-h2">Horario</h2>

        <div className="tabla-dato mt-6 max-w-md overflow-hidden border border-tinta/10 bg-tarjeta">
          <table className="w-full text-sm">
            <tbody>
              {site.horario.map((franja, i) =>
                franja ? (
                  <tr key={franja.dia}>
                    <th scope="row" className="font-normal">
                      {franja.dia}
                    </th>
                    <td className="text-right whitespace-nowrap">
                      {formatoHora(franja.abre)} — {formatoHora(franja.cierra)}
                    </td>
                  </tr>
                ) : (
                  <tr key={`cerrado-${i}`}>
                    <th scope="row" className="font-normal">
                      Domingo
                    </th>
                    <td className="text-right text-tinta/60">Cerrado</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
