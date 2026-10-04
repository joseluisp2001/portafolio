import Link from 'next/link';
import { site } from '@/config/site';
import { estadoHorario, formatoHora } from '@/lib/horario';
import { colones, hayWhatsApp, urlWhatsApp } from '@/lib/whatsapp';
import Icono from '@/components/Icono';
import TablaVacunacion from '@/components/TablaVacunacion';

/*
  Los blobs van SIEMPRE al fondo y NUNCA detras de texto: son la parte de la
  estetica que mas facil arruina la legibilidad si se descuida.
*/
function Blobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <svg viewBox="0 0 600 400" className="absolute -top-24 -right-32 w-[38rem] text-salvia/25">
        <path
          fill="currentColor"
          d="M420 60c60 40 120 90 110 160s-90 110-170 130-170-10-220-70-60-150-10-200 130-60 190-60 40 0 100 40z"
        />
      </svg>
      <svg viewBox="0 0 600 400" className="absolute -bottom-40 -left-40 w-[32rem] text-cielo/20">
        <path
          fill="currentColor"
          d="M300 40c90 0 180 50 200 130s-40 160-130 190-200 10-250-60-30-170 30-220 60-40 150-40z"
        />
      </svg>
    </div>
  );
}

function Portada() {
  const estado = estadoHorario();
  const hoy = site.horario[new Date().getDay()];

  return (
    <section className="relative">
      <Blobs />

      <div className="mx-auto max-w-5xl px-5 py-20 sm:py-28">
        <h1 className="text-h1 max-w-2xl">{site.frase}</h1>

        <p className="mt-5 max-w-prose text-lg">{site.descripcionLarga}</p>

        {/*
          La barra de "hoy" va ANTES que los servicios: es el bloque que mas se
          va a tocar del sitio entero. Saber si estan abiertos y poder escribir
          es lo unico que la mayoria viene a hacer.
        */}
        <div className="mt-10 flex flex-col gap-4 rounded-3xl bg-arena px-6 py-6 shadow-blanda sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">
              {estado.abierto ? 'Abierto ahora' : 'Cerrado ahora'}
            </p>
            {/* Solo el horario de hoy. Antes decia ademas `estado.texto`, que
                repetia la hora de cierre en la misma linea: "de 8:00 a. m. a
                1:00 p. m. · Abierto hasta las 1:00 p. m.". */}
            <p className="text-sm">
              {hoy
                ? `Hoy ${hoy.dia.toLowerCase()}, de ${formatoHora(hoy.abre)} a ${formatoHora(hoy.cierra)}`
                : estado.texto}
            </p>
          </div>

          {hayWhatsApp ? (
            <a
              href={urlWhatsApp('Buenas! Quisiera agendar una cita.')}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-salvia-texto px-6 py-3 text-center font-semibold text-nube transition-all duration-500 ease-blando hover:-translate-y-0.5 hover:shadow-alta"
            >
              Agendar por WhatsApp
            </a>
          ) : (
            <Link
              href="/emergencias"
              className="rounded-full bg-salvia-texto px-6 py-3 text-center font-semibold text-nube"
            >
              Ver emergencias
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function Servicios() {
  return (
    /*
      Fondo tenue en la seccion, tarjetas blancas encima.

      En una estetica sin bordes ni lineas, la unica cosa que separa una
      superficie de otra es el color de fondo. Con la seccion y las tarjetas del
      mismo tono, no hay pastillas: hay un bloque de texto flotando.
    */
    <section className="bg-arena/25 py-16">
      <div className="mx-auto max-w-5xl px-5">
        <h2 className="text-h2">Que hacemos</h2>

        {/* Mucho espacio entre las pastillas: el aire es lo que comunica calma. */}
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {site.servicios.map((servicio) => (
            <li
              key={servicio.id}
              className="rounded-3xl bg-tarjeta p-8 shadow-blanda transition-all duration-500 ease-blando hover:-translate-y-0.5 hover:shadow-alta"
            >
              <Icono nombre={servicio.icono} />

              <h3 className="mt-5 text-xl font-bold">{servicio.nombre}</h3>
              <p className="mt-2 text-tinta/80">{servicio.descripcion}</p>

              <p className="mt-4 text-sm font-semibold tabular-nums text-salvia-texto">
                {/* Sin precio real no se inventa uno: se dice que se consulta. */}
                {servicio.precio ? `Desde ${colones(servicio.precio)}` : 'Se cotiza segun el caso'}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function Inicio() {
  return (
    <>
      <Portada />
      <Servicios />
      <TablaVacunacion />
    </>
  );
}
