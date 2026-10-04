import Link from 'next/link';
import { site } from '@/config/site';
import { diaDeHoy, estadoHorario, formatoHora } from '@/lib/horario';
import TarjetaServicio from '@/components/TarjetaServicio';
import BotonWhatsApp from '@/components/BotonWhatsApp';
import NuestroCuidado from '@/components/NuestroCuidado';

/*
  El orden de esta pagina esta decidido por quien la abre.

  Casi nunca es el paciente: es la hija o el hijo arreglando el cuidado de la
  mama, preocupado y comparando dos opciones. Necesita saber, en este orden:
  que hacen, cuanto cuesta, y si pueden venir hoy.

  Por eso la franja de hoy va arriba de los servicios, y los precios van en la
  tarjeta y no adentro del detalle.

  (12-9-2026) La composicion es la de Gravity: portada en dos columnas con la
  tarjeta de disponibilidad a la derecha, servicios en grilla y horario al
  lado de su texto. Se corrigio lo que decia de mas:
   - "Cuidado MEDICO experto": es enfermeria, no medicina. No se puede ofrecer
     lo que no se esta habilitado a hacer.
   - "¿Tiene una emergencia medica? Solicitar visita hoy": una emergencia va al
     9-1-1, no a una enfermera que llega en una hora. Mandar ahi a alguien con
     una emergencia es el peor error que este sitio podria cometer.
   - "Todos detallan el costo exacto": hoy todos dicen "Se cotiza".
   - "Atendemos de lunes a domingo": sale del horario, no se escribe a mano.
*/

/* Hora de ahora: sin esto Next genera la pagina una vez al compilar y
   "Atendiendo ahora" quedaria congelado en la hora del build. */
export const dynamic = 'force-dynamic';

function Portada() {
  const estado = estadoHorario();
  const hoy = site.horario[diaDeHoy()];

  return (
    <section className="relative overflow-hidden border-b-2 border-borde bg-nieve">
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border-2 border-verde px-4 py-1 text-chico font-bold text-verde">
            Enfermería a domicilio
          </p>

          <h1 className="mt-6 text-h1">Cuidado de enfermería en la comodidad de su casa.</h1>

          <p className="medida mt-5 text-h3 font-normal">{site.descripcionLarga}</p>

          {/* La zona, escrita con nombres. "Gran Area Metropolitana" no le sirve
              a nadie: la gente quiere ver el nombre de SU barrio. */}
          {site.cobertura.length > 0 && (
            <p className="medida mt-5 flex items-start gap-3 rounded-xl border-2 border-borde bg-blanco px-5 py-3">
              <svg aria-hidden="true" className="mt-1 shrink-0 text-verde" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              <span>Vamos a {site.cobertura.join(', ')}.</span>
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <BotonWhatsApp mensaje="Buenas! Necesito un servicio de enfermería a domicilio.">
              Escribir por WhatsApp
            </BotonWhatsApp>
          </div>
        </div>

        {/* --- La franja de hoy --------------------------------------------
            "¿Pueden venir hoy?" es la pregunta que trae a la mayoria. */}
        <div className="w-full max-w-md lg:justify-self-end">
          <div className="tarjeta rounded-3xl p-7 shadow-lg">
            <h2 className="text-chico font-bold text-gris">Disponibilidad</h2>

            <p className="mt-3 text-h3 font-bold">
              {estado.abierto ? 'Atendiendo ahora' : 'Fuera de horario en este momento'}
            </p>
            <p className="mt-1 text-gris">
              {hoy
                ? `Hoy ${hoy.dia.toLowerCase()}, de ${formatoHora(hoy.abre)} a ${formatoHora(hoy.cierra)}`
                : estado.texto}
            </p>

            <div className="mt-6 border-t-2 border-borde pt-6">
              <Link
                href="/hoy"
                className="boton toque w-full rounded-full border-2 border-verde text-verde hover:bg-verde hover:text-blanco"
              >
                Lo necesito hoy
              </Link>
              <p className="mt-4 text-chico text-gris">
                Si es una emergencia, llame al <strong className="text-urgente">9-1-1</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Inicio() {
  const diasQueSeAtiende = site.horario.filter(Boolean).length;

  return (
    <>
      <Portada />

      <NuestroCuidado />

      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-h2">Qué hacemos</h2>
        <p className="medida mt-2 text-gris">
          Cada uno dice cuánto dura y cuánto cuesta. Si algo que necesita no está en la
          lista, escríbanos y le decimos si se puede.
        </p>

        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {site.servicios.map((servicio) => (
            <TarjetaServicio key={servicio.slug} servicio={servicio} />
          ))}
        </ul>
      </section>

      {/* --- El horario, en tabla ---------------------------------------- */}
      <section className="border-t-2 border-borde bg-nieve">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-10 px-5 py-14 md:flex-row">
          <div className="max-w-md">
            <h2 className="text-h2">Horario</h2>
            <p className="mt-2 text-gris">
              {diasQueSeAtiende === 7
                ? 'Atendemos todos los días.'
                : `Atendemos ${diasQueSeAtiende} días a la semana.`}{' '}
              Para una hora fuera de este horario, escríbanos y le decimos si se puede.
            </p>
            <div className="mt-6">
              <BotonWhatsApp mensaje="Buenas! Quisiera consultar la disponibilidad de horarios." variante="borde">
                Consultar horario
              </BotonWhatsApp>
            </div>
          </div>

          <table className="numero tarjeta w-full max-w-md border-collapse rounded-2xl text-left">
            <tbody>
              {site.horario.map((franja, i) =>
                franja ? (
                  <tr key={franja.dia} className="border-b-2 border-borde last:border-0">
                    <th scope="row" className="px-6 py-3 font-normal">
                      {franja.dia}
                    </th>
                    <td className="px-6 py-3 text-right">
                      {formatoHora(franja.abre)} — {formatoHora(franja.cierra)}
                    </td>
                  </tr>
                ) : (
                  <tr key={`cerrado-${i}`} className="border-b-2 border-borde last:border-0">
                    <th scope="row" className="px-6 py-3 font-normal">
                      Día {i}
                    </th>
                    <td className="px-6 py-3 text-right text-gris">No se atiende</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
