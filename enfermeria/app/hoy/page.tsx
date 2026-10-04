import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/config/site';
import { diaDeHoy, estadoHorario, formatoHora } from '@/lib/horario';
import BotonWhatsApp from '@/components/BotonWhatsApp';

/*
  La pagina para cuando se necesita hoy.

  Sin componentes de cliente y sin JavaScript propio: es HTML que renderiza en
  el servidor y abre aunque todo lo demas falle. Quien llega aca esta apurado.

  Y NO da consejo medico. En la veterinaria hay una pagina de "que hacer
  mientras llega" y ahi tiene sentido, porque son primeros auxilios de un animal.
  Con personas es otra cosa: decir que hacer sin ver al paciente puede hacer
  dano, y ademas no es lo que este sitio esta habilitado a hacer.
*/

/* Hora de ahora: sin esto la pagina se genera una vez al compilar y el
   "Atendiendo ahora" queda congelado en la hora del build. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Si lo necesita hoy',
  description: 'Cómo pedir una visita de enfermería para hoy mismo.',
  alternates: { canonical: '/hoy' },
};

export default function Hoy() {
  const estado = estadoHorario();
  const hoy = site.horario[diaDeHoy()];

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <h1 className="text-h1">Si lo necesita hoy</h1>

      <div className="tarjeta mt-6 p-6">
        <p className="text-h3 font-bold">
          {estado.abierto ? 'Atendiendo ahora' : 'Fuera de horario en este momento'}
        </p>
        <p className="mt-1 text-gris">
          {hoy
            ? `Hoy ${hoy.dia.toLowerCase()}, de ${formatoHora(hoy.abre)} a ${formatoHora(hoy.cierra)}`
            : estado.texto}
        </p>

        <div className="mt-5">
          <BotonWhatsApp mensaje="Buenas! Necesito una visita de enfermería HOY. Le cuento:">
            Escribir ahora por WhatsApp
          </BotonWhatsApp>
        </div>

        {!estado.abierto && (
          <p className="medida mt-4 text-gris">
            Escriba igual: el mensaje queda y se contesta apenas se pueda.
          </p>
        )}
      </div>

      {/* Qué contar en el mensaje. Que la persona lo mande completo de una vez
          ahorra tres idas y vueltas justo cuando hay apuro. */}
      <section className="mt-10">
        <h2 className="text-h2">Qué contarnos en el mensaje</h2>
        <p className="medida mt-2 text-gris">
          Con esto podemos decirle de una si se puede y cuánto sale.
        </p>

        <ol className="medida mt-4 space-y-3">
          {[
            'Qué se necesita: una inyección, una curación, un control…',
            'En qué barrio o distrito',
            'Para qué hora le sirve',
            'Si ya tiene la receta y el medicamento',
            'Si la persona puede caminar o está en cama',
          ].map((linea, i) => (
            <li key={linea} className="flex gap-3">
              <span aria-hidden className="numero font-bold text-verde">
                {i + 1}.
              </span>
              <span>{linea}</span>
            </li>
          ))}
        </ol>
      </section>

      {/*
        La linea que separa esto de una emergencia. Va grande y no en letra
        chica: alguien que confunde las dos cosas pierde minutos que importan.
      */}
      <section className="mt-10 rounded-lg border-2 border-urgente p-6">
        <h2 className="text-h2 text-urgente">Si es una emergencia, no escriba: llame</h2>
        <p className="medida mt-3">
          Dolor de pecho, dificultad para respirar, pérdida de conocimiento, sangrado que no
          para o un golpe fuerte son emergencias.{' '}
          <strong>Llame al 9-1-1 o vaya al servicio de emergencias más cercano.</strong>
        </p>
        <p className="medida mt-3 text-gris">
          Este servicio es de enfermería a domicilio programada, no de atención de
          emergencias.
        </p>
      </section>

      <p className="mt-10">
        <Link href="/" className="toque text-verde underline underline-offset-4">
          ← Ver todos los servicios
        </Link>
      </p>
    </div>
  );
}
