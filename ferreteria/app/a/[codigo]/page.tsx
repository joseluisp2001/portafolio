import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { articulos, nombreCategoria, porCodigo } from '@/lib/catalogo';
import { colones } from '@/lib/whatsapp';
import BotonAgregar from '@/components/BotonAgregar';

/*
  La pagina de un articulo es la que hace que Google mande gente: alguien busca
  "tubo PVC SDR-17 media pulgada Desamparados" y tiene que caer aca, no en la
  portada. Por eso cada articulo tiene URL propia y metadatos propios.

  Y por eso se generan las rutas al compilar: son HTML estatico, salen al
  instante y no cuestan una consulta por visita.
*/

export function generateStaticParams() {
  return articulos.map((a) => ({ codigo: a.codigo }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ codigo: string }>;
}): Promise<Metadata> {
  const { codigo } = await params;
  const articulo = porCodigo[codigo];
  if (!articulo) return { title: 'Articulo no encontrado' };

  return {
    title: `${articulo.nombre} (${articulo.codigo})`,
    description: `${articulo.nombre}. ${articulo.presentacion}. ${articulo.detalle}. ${colones(articulo.precio)}.`,
    alternates: { canonical: `/a/${articulo.codigo}` },
  };
}

export default async function Articulo({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const articulo = porCodigo[codigo];
  if (!articulo) notFound();

  const parecidos = articulos
    .filter((a) => a.categoria === articulo.categoria && a.codigo !== articulo.codigo)
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-5xl px-3 py-4">
      <nav aria-label="Migas" className="text-xs text-apagado">
        <Link href="/" className="text-azul">
          Inicio
        </Link>
        {' / '}
        <Link href={`/?cat=${articulo.categoria}`} className="text-azul">
          {nombreCategoria(articulo.categoria)}
        </Link>
      </nav>

      <div className="mt-3 rounded-xs border border-linea bg-fila p-4">
        <p className="codigo text-xs text-apagado">{articulo.codigo}</p>
        <h1 className="mt-1 text-h1 font-semibold">{articulo.nombre}</h1>

        <table className="tabla mt-4 w-full max-w-md text-left">
          <tbody>
            <tr className="border-t border-linea">
              <th scope="row" className="w-40 py-2 font-normal text-apagado">
                Presentacion
              </th>
              <td className="py-2">{articulo.presentacion}</td>
            </tr>
            <tr className="border-t border-linea">
              <th scope="row" className="py-2 font-normal text-apagado">
                Detalle
              </th>
              <td className="py-2">{articulo.detalle}</td>
            </tr>
            <tr className="border-t border-linea">
              <th scope="row" className="py-2 font-normal text-apagado">
                Categoria
              </th>
              <td className="py-2">{nombreCategoria(articulo.categoria)}</td>
            </tr>
            <tr className="border-t border-linea">
              <th scope="row" className="py-2 font-normal text-apagado">
                Disponibilidad
              </th>
              <td className="py-2">
                {articulo.stock ? (
                  'En bodega'
                ) : (
                  <span className="inline-flex items-center gap-2">
                    {/* Pildora naranja con texto oscuro encima: 5,8:1. El
                        naranja como LETRA da 2,6:1 y no se lee. */}
                    <span className="rounded-xs bg-naranja px-2 py-0.5 text-xs font-medium text-texto">
                      Sobre pedido
                    </span>
                  </span>
                )}
              </td>
            </tr>
            <tr className="border-t border-linea">
              <th scope="row" className="py-2 font-normal text-apagado">
                Precio
              </th>
              <td className="precio py-2 text-h2 font-semibold">{colones(articulo.precio)}</td>
            </tr>
          </tbody>
        </table>

        <p className="mt-3 text-xs text-apagado">
          El precio es de referencia. Por cantidad cambia, y se confirma al cotizar.
        </p>

        <div className="mt-4">
          <BotonAgregar codigo={articulo.codigo} nombre={articulo.nombre} />
        </div>
      </div>

      {parecidos.length > 0 && (
        <section className="mt-6">
          <h2 className="text-h2 font-semibold">De la misma categoria</h2>
          <ul className="mt-2 overflow-hidden rounded-xs border border-linea">
            {parecidos.map((a) => (
              <li key={a.codigo} className="fila border-b border-linea bg-fila">
                <Link href={`/a/${a.codigo}`} className="flex h-full items-center gap-3 px-3 py-2 hover:bg-hover">
                  <span className="min-w-0 flex-1 truncate">{a.nombre}</span>
                  <span className="codigo shrink-0 text-xs text-apagado">{a.codigo}</span>
                  <span className="precio w-24 shrink-0 text-right">{colones(a.precio)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
