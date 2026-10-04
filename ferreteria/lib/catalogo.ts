import datos from '@/data/articulos.json';
import { site } from '@/config/site';

export type Articulo = {
  codigo: string;
  nombre: string;
  categoria: string;
  presentacion: string;
  detalle: string;
  precio: number;
  stock: boolean;
};

/*
  El catalogo se lee del JSON importado, no con readFileSync.

  rapitelas hace `JSON.parse(readFileSync(...))` en el nivel superior del modulo
  y sin try/catch: si el archivo queda escrito a medias porque el script que lo
  genera se interrumpio, el modulo tira al importarse y se cae TODA la
  aplicacion — portada, sitemap y robots incluidos, no solo el catalogo.

  Un `import` de JSON lo resuelve el compilador: si el archivo esta roto, el
  build falla en la laptop y no en produccion.
*/
export const articulos: Articulo[] = datos as Articulo[];

export const total = articulos.length;

export const porCodigo: Record<string, Articulo> = Object.fromEntries(
  articulos.map((a) => [a.codigo, a]),
);

export const nombreCategoria = (id: string): string =>
  site.categorias.find((c) => c.id === id)?.nombre ?? id;

/** Quita tildes y pasa a minusculas, para que "electrico" encuentre "eléctrico". */
const normalizar = (texto: string): string =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/**
 * Busca por nombre, codigo, presentacion y detalle.
 *
 * Cada palabra del texto tiene que aparecer en algun lado (AND, no OR): quien
 * escribe "tornillo 2" quiere los tornillos de 2 pulgadas, no todo lo que
 * contenga un 2.
 */
export function buscar(articulos: Articulo[], texto: string): Articulo[] {
  const palabras = normalizar(texto).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return articulos;

  return articulos.filter((a) => {
    const heno = normalizar(`${a.nombre} ${a.codigo} ${a.presentacion} ${a.detalle}`);
    return palabras.every((p) => heno.includes(p));
  });
}

export function filtrar(opciones: { texto?: string; categoria?: string }): Articulo[] {
  let lista = articulos;
  if (opciones.categoria) lista = lista.filter((a) => a.categoria === opciones.categoria);
  if (opciones.texto) lista = buscar(lista, opciones.texto);
  return lista;
}

/**
 * Cuantos resultados dejaria cada categoria con el texto actual.
 *
 * Un filtro que no dice cuanto deja obliga a probarlo para averiguarlo, y uno
 * que da cero se ve igual que uno que da doscientos hasta que se toca.
 */
export function conteoPorCategoria(texto: string): Record<string, number> {
  const base = texto ? buscar(articulos, texto) : articulos;
  const cuenta: Record<string, number> = {};
  for (const categoria of site.categorias) {
    cuenta[categoria.id] = base.filter((a) => a.categoria === categoria.id).length;
  }
  return cuenta;
}
