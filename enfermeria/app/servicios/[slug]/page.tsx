import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { site, servicioPorSlug } from '@/config/site';
import { colones } from '@/lib/whatsapp';
import BotonWhatsApp from '@/components/BotonWhatsApp';
import { duracionEnPalabras } from '@/components/TarjetaServicio';

export function generateStaticParams() {
  return site.servicios.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const servicio = servicioPorSlug[slug];
  if (!servicio) return { title: 'Servicio no encontrado' };

  return {
    title: servicio.nombre,
    description: `${servicio.resumen} Dura ${duracionEnPalabras(servicio.duracion)}. A domicilio.`,
    alternates: { canonical: `/servicios/${servicio.slug}` },
  };
}

export default async function Servicio({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const servicio = servicioPorSlug[slug];
  if (!servicio) notFound();

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <p>
        <Link href="/" className="toque text-verde underline underline-offset-4">
          ← Todos los servicios
        </Link>
      </p>

      <h1 className="mt-4 text-h1">{servicio.nombre}</h1>
      <p className="medida mt-3 text-h3">{servicio.resumen}</p>

      {servicio.requiereReceta && (
        <p className="mt-5 rounded-lg border-2 border-urgente px-5 py-3 font-bold text-urgente">
          Este servicio se aplica con receta médica.
        </p>
      )}

      {/* --- Cuánto dura y cuánto cuesta ---------------------------------- */}
      <dl className="tarjeta mt-8 flex flex-wrap gap-x-12 gap-y-4 p-6">
        <div>
          <dt className="text-gris">Cuánto dura</dt>
          <dd className="numero text-h3 font-bold">{duracionEnPalabras(servicio.duracion)}</dd>
        </div>
        <div>
          <dt className="text-gris">Cuánto cuesta</dt>
          <dd className="numero text-h3 font-bold">
            {servicio.precio > 0 ? colones(servicio.precio) : 'Se cotiza'}
          </dd>
          {servicio.depende && <dd className="text-chico text-gris">Depende {servicio.depende}</dd>}
        </div>
      </dl>

      {/* --- Qué incluye --------------------------------------------------- */}
      <section className="mt-10">
        <h2 className="text-h2">Qué incluye</h2>
        <ul className="medida mt-4 space-y-2">
          {servicio.incluye.map((cosa) => (
            <li key={cosa} className="flex gap-3">
              <span aria-hidden className="text-verde">
                ·
              </span>
              <span>{cosa}</span>
            </li>
          ))}
        </ul>
      </section>

      {/*
        --- Qué preparar ---------------------------------------------------
        Esta seccion es la que casi ningun sitio pone, y es la que evita la
        visita perdida: llegar y que no este la receta, o que el medicamento
        haya que ir a comprarlo. Le ahorra tiempo a los dos lados.
      */}
      <section className="mt-10">
        <h2 className="text-h2">Qué hay que tener listo</h2>
        <p className="medida mt-2 text-gris">
          Con esto preparado, la visita sale de una. Si falta algo, escríbanos antes y lo
          vemos.
        </p>

        <ul className="medida mt-4 space-y-2">
          {servicio.preparar.map((cosa) => (
            <li key={cosa} className="flex gap-3">
              <span aria-hidden className="text-verde">
                ·
              </span>
              <span>{cosa}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10">
        <BotonWhatsApp
          mensaje={`Buenas! Necesito el servicio de ${servicio.nombre.toLowerCase()} a domicilio.`}
        >
          Pedir {servicio.nombre.toLowerCase()}
        </BotonWhatsApp>
      </div>
    </div>
  );
}
