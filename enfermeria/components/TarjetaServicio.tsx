import Link from 'next/link';
import { colones } from '@/lib/whatsapp';
import type { Servicio } from '@/config/site';

/** "240" -> "4 horas" · "45" -> "45 minutos" */
export function duracionEnPalabras(minutos: number): string {
  if (minutos < 60) return `${minutos} minutos`;
  const horas = minutos / 60;
  return horas === 1 ? '1 hora' : `${Number.isInteger(horas) ? horas : horas.toFixed(1)} horas`;
}

/*
  El precio y la duracion van EN LA TARJETA, no adentro del detalle.

  Quien compara dos opciones descarta la que no dice el precio, sin abrirla. Y
  la duracion importa porque la gente organiza el dia alrededor de la visita:
  no es lo mismo veinte minutos que cuatro horas.

  (12-9-2026) La forma es la de Gravity —tarjeta redonda, toda la tarjeta
  tocable, datos al pie— con el borde de 2 px, los grises AAA y los tamanos
  del proyecto. La suya ponia "Duracion" y "Costo" en 12 px gris claro
  (#94a3b8, 2,6:1): justo el dato que se compara, en lo menos legible.
*/
export default function TarjetaServicio({ servicio }: { servicio: Servicio }) {
  return (
    <li className="tarjeta relative flex h-full flex-col rounded-2xl p-6 transition-shadow hover:shadow-lg">
      <h3 className="text-h3 font-bold">
        {/* El ::before estira el enlace sobre toda la tarjeta: se toca en
            cualquier parte, no solo sobre las letras. */}
        <Link
          href={`/servicios/${servicio.slug}`}
          className="toque-texto text-verde underline underline-offset-4 before:absolute before:inset-0 before:rounded-2xl"
        >
          {servicio.nombre}
        </Link>
      </h3>

      <p className="medida mt-2 flex-grow">{servicio.resumen}</p>

      <dl className="mt-5 flex flex-wrap justify-between gap-x-8 gap-y-2 border-t-2 border-borde pt-4">
        <div>
          <dt className="text-chico text-gris">Dura</dt>
          <dd className="numero font-bold">{duracionEnPalabras(servicio.duracion)}</dd>
        </div>

        <div className="text-right">
          <dt className="text-chico text-gris">Cuesta</dt>
          <dd className="numero font-bold text-verde">
            {servicio.precio > 0 ? colones(servicio.precio) : 'Se cotiza'}
          </dd>
          {servicio.precio === 0 && servicio.depende && (
            <dd className="text-chico text-gris">Depende {servicio.depende}</dd>
          )}
        </div>
      </dl>

      {/*
        El aviso de receta va ACA, visible, no en letra chica adentro del
        detalle. Enterarse de que hacia falta receta cuando la enfermera ya
        llego es una visita perdida para los dos.
      */}
      {servicio.requiereReceta && (
        <p className="mt-4 rounded-lg border-2 border-urgente px-4 py-2 text-chico font-bold text-urgente">
          Se aplica con receta médica
        </p>
      )}
    </li>
  );
}
