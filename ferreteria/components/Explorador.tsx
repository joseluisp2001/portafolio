'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { site } from '@/config/site';
import { conteoPorCategoria, filtrar, total } from '@/lib/catalogo';
import FilaArticulo from '@/components/FilaArticulo';

/*
  Buscador + filtros + resultados, con TODO el estado en la URL.

  Esto no es un detalle: es la leccion de rapitelas, que tiene 3.060 telas y todo
  el estado en useState, sin un solo pushState en el proyecto. En celular,
  "atras" —que es EL gesto para cerrar un overlay— saca del sitio entero, y se
  pierden la busqueda, el filtro y las tarjetas cargadas a punta de "Ver mas".
  Y sin URL propia no se puede mandar "mira este" por WhatsApp, que es como se
  cierra la venta.

  Con el estado en la URL: atras funciona, la busqueda se puede pegar en un chat,
  y recargar no borra nada.
*/

const POR_PAGINA = 25;

export default function Explorador({ categoriaFija }: { categoriaFija?: string }) {
  const router = useRouter();
  const parametros = useSearchParams();

  const textoUrl = parametros.get('q') ?? '';
  const categoria = categoriaFija ?? parametros.get('cat') ?? '';

  /* El campo se escribe rapido; la URL se actualiza despues. Sin este desfase,
     cada tecla mete una entrada en el historial y "atras" se vuelve inutil. */
  const [texto, setTexto] = useState(textoUrl);
  const [visibles, setVisibles] = useState(POR_PAGINA);

  useEffect(() => setTexto(textoUrl), [textoUrl]);

  useEffect(() => {
    if (texto === textoUrl) return;

    const t = setTimeout(() => {
      const p = new URLSearchParams(parametros.toString());
      if (texto) p.set('q', texto);
      else p.delete('q');
      // `replace` y no `push`: escribir no deberia llenar el historial.
      router.replace(p.toString() ? `?${p}` : '?', { scroll: false });
    }, 250);

    return () => clearTimeout(t);
  }, [texto, textoUrl, parametros, router]);

  useEffect(() => setVisibles(POR_PAGINA), [textoUrl, categoria]);

  const resultados = useMemo(
    () => filtrar({ texto: textoUrl, categoria }),
    [textoUrl, categoria],
  );
  const conteos = useMemo(() => conteoPorCategoria(textoUrl), [textoUrl]);

  const irACategoria = (id: string) => {
    const p = new URLSearchParams();
    if (textoUrl) p.set('q', textoUrl);
    if (id) p.set('cat', id);
    router.push(p.toString() ? `/?${p}` : '/');
  };

  return (
    <div className="mx-auto max-w-5xl px-3 py-4">
      <div className="rounded-xs border border-linea bg-fila p-3 shadow-[var(--shadow-unica)]">
        <label htmlFor="buscar" className="sr-only">
          Buscar articulo
        </label>
        <input
          id="buscar"
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por nombre, codigo o medida…"
          className="w-full rounded-xs border border-linea px-3 py-3 outline-none focus:border-azul"
        />

        {/* Categorias como TEXTO, no como tarjetas con iconos, y cada una dice
            cuantos resultados deja. Un filtro que no lo dice obliga a probarlo
            para averiguarlo. */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => irACategoria('')}
            aria-pressed={categoria === ''}
            className={[
              'rounded-xs border px-2.5 py-1.5 text-xs',
              categoria === '' ? 'border-azul bg-elegido text-azul' : 'border-linea text-apagado',
            ].join(' ')}
          >
            Todo ({total})
          </button>

          {site.categorias.map((c) => {
            const n = conteos[c.id] ?? 0;
            return (
              <button
                key={c.id}
                type="button"
                disabled={n === 0}
                onClick={() => irACategoria(c.id)}
                aria-pressed={categoria === c.id}
                className={[
                  'rounded-xs border px-2.5 py-1.5 text-xs',
                  categoria === c.id ? 'border-azul bg-elegido text-azul' : 'border-linea text-apagado',
                  /* Los que darian cero se deshabilitan en vez de desaparecer:
                     que la lista de filtros no cambie de tamano al escribir. */
                  n === 0 ? 'opacity-40' : '',
                ].join(' ')}
              >
                {c.nombre} ({n})
              </button>
            );
          })}
        </div>
      </div>

      <p aria-live="polite" className="px-1 py-3 text-xs text-apagado">
        {resultados.length === 0
          ? 'Ningun articulo calza con esa busqueda'
          : `${resultados.length} ${resultados.length === 1 ? 'articulo' : 'articulos'}`}
        {textoUrl && ` para "${textoUrl}"`}
      </p>

      {resultados.length === 0 ? (
        <div className="rounded-xs border border-linea bg-fila px-4 py-8 text-center">
          <p className="font-medium">No lo encontramos en la lista</p>
          <p className="mt-1 text-apagado">
            Eso no quiere decir que no lo tengamos. Escribinos con la medida y le decimos
            de una.
          </p>
        </div>
      ) : (
        <>
          <ul className="overflow-hidden rounded-xs border border-linea">
            {resultados.slice(0, visibles).map((a) => (
              <FilaArticulo key={a.codigo} articulo={a} />
            ))}
          </ul>

          {visibles < resultados.length && (
            <button
              type="button"
              onClick={() => setVisibles((v) => v + POR_PAGINA)}
              className="mt-3 w-full rounded-xs border border-linea bg-fila py-3 text-azul hover:bg-hover"
            >
              Ver {Math.min(POR_PAGINA, resultados.length - visibles)} mas
            </button>
          )}
        </>
      )}
    </div>
  );
}
