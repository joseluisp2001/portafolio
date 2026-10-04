import Image from 'next/image';
import Link from 'next/link';
import { site } from '@/config/site';
import { esHoy, estadoHorario } from '@/lib/horario';
import { colones } from '@/lib/whatsapp';
import SeccionCarta from '@/components/SeccionCarta';
import LineaPlato from '@/components/LineaPlato';

/*
  Portada. Una foto (o, mientras no la haya, un encabezado tipografico), el menu
  del dia, y los platos que llevan foto. Nada de carrusel ni de tres botones
  compitiendo.
*/

function Portada() {
  const estado = estadoHorario();

  /* Con foto: a sangre, 70% del alto, el nombre abajo a la izquierda.
     Una sola imagen, con `priority`, servida al tamano que se muestra. El hero
     de shein-los-guido baja 4-5 MB en 24 fotos para pintar cuadritos tapados por
     un degradado: eso es la pestana cerrada con datos moviles. */
  if (site.hero.foto) {
    return (
      <section className="relative h-[70vh] min-h-[420px] w-full">
        <Image
          src={site.hero.foto}
          alt={site.hero.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-10">
          <h1 className="font-display text-h1 text-papel drop-shadow-sm">{site.nombre}</h1>
          <p className="mt-2 max-w-md text-papel">{site.descripcionCorta}</p>
        </div>
      </section>
    );
  }

  /* Sin foto: encabezado tipografico sobre papel hondo. Se ve intencional, que
     es distinto de verse vacio. En cuanto haya una foto buena, se pone la ruta
     en config/site.ts y esto cambia solo. */
  return (
    <section className="border-b border-linea bg-papel-hondo">
      <div className="entra mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="text-pie text-tinta-suave">
          {estado.abierto ? '● ' : '○ '}
          {estado.texto}
        </p>

        <h1 className="mt-4 font-display text-h1">{site.nombre}</h1>

        <p className="medida mt-5 text-lg">{site.descripcionLarga}</p>

        <p className="mt-8 text-pie">
          <Link href="/carta" className="text-tomate-hondo underline underline-offset-4">
            Ver la carta completa
          </Link>
        </p>
      </div>
    </section>
  );
}

function MenuDelDia() {
  /* Si la fecha no es la de hoy, la seccion no se muestra. Es mejor que no
     aparezca a que muestre el menu de anteayer — y evita el cartel de
     "proximamente", que es peor que no tener nada. */
  if (!esHoy(site.menuDelDia.fecha) || site.menuDelDia.platos.length === 0) return null;

  return (
    <section className="entra border-b border-linea bg-papel-hondo">
      <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-pie uppercase tracking-widest text-mostaza">Hoy</p>
        <h2 className="mt-2 font-display text-h2">El menu del dia</h2>

        <ul className="mt-6 border-t border-linea">
          {site.menuDelDia.platos.map((plato) => (
            <LineaPlato key={plato.id} plato={plato} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function ConFoto() {
  const conFoto = site.carta.flatMap((s) => s.platos).filter((p) => p.foto);
  if (conFoto.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
      <h2 className="font-display text-h2">De la cocina</h2>

      <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {conFoto.map((plato, i) => (
          <li key={plato.id}>
            <div className="relative aspect-4/5 w-full bg-papel-hondo">
              <Image
                src={plato.foto as string}
                alt={plato.nombre}
                fill
                /* Solo las primeras dos van con prioridad; el resto perezosas.
                   Los tamanos evitan que el navegador pida la variante mas
                   grande en un telefono. */
                priority={i < 2}
                loading={i < 2 ? undefined : 'lazy'}
                sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
                className="object-cover"
              />
            </div>
            <p className="mt-3 flex items-baseline justify-between gap-3">
              <span className="font-display text-h3">{plato.nombre}</span>
              <span className="tabular-nums text-tomate">{colones(plato.precio)}</span>
            </p>
            <p className="mt-1 text-pie text-tinta-suave">{plato.descripcion}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Inicio() {
  /* En la portada va solo lo que se come a diario. La carta entera esta en
     /carta: cuatro rutas en total, y cada ruta de mas es una que se queda sin
     actualizar. */
  const destacadas = site.carta.filter((s) => s.id === 'casados' || s.id === 'desayunos');

  return (
    <>
      <Portada />
      <MenuDelDia />
      <ConFoto />

      <div className="mx-auto max-w-5xl space-y-16 px-5 py-8 sm:px-8">
        {destacadas.map((seccion) => (
          <SeccionCarta key={seccion.id} seccion={seccion} />
        ))}

        <p className="text-pie">
          <Link href="/carta" className="text-tomate-hondo underline underline-offset-4">
            Ver la carta completa
          </Link>
        </p>
      </div>
    </>
  );
}
