import { cn } from '@/lib/cn';
import React from 'react';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  /** Parte del título que se destaca (tinta del acento + pista que la subraya). Tiene que estar en `title`. */
  destacado?: string;
  intro?: string;
  align?: 'left' | 'center';
  size?: 'section' | 'group';
  className?: string;
}

/** Cada palabra en su máscara, con su orden para el escalonado. */
function palabras(texto: string, desde: number): { nodos: React.ReactNode[]; cuantas: number } {
  const lista = texto.split(/\s+/).filter(Boolean);
  const nodos: React.ReactNode[] = [];
  lista.forEach((p, k) => {
    if (k > 0) nodos.push(' ');
    nodos.push(
      <span key={`${desde + k}-${p}`} className="palabra">
        <span className="anim-palabra" style={{ '--i': Math.min(desde + k, 10) } as React.CSSProperties}>
          {p}
        </span>
      </span>,
    );
  });
  return { nodos, cuantas: lista.length };
}

// Encabezado de sección.
// - Rótulo: el pin con señal del logo y su pista, antes del nombre.
// - Título en Space Grotesk semibold, apretado; cada palabra sube en su máscara.
// - `destacado`: la frase en tinta del acento, subrayada por una pista que se
//   traza cuando terminan de subir las palabras y termina en una vía.
// - Los grupos (size="group") son h3, con una pista que sale del nombre, como
//   una etiqueta de red en la placa.
// Las entradas las dispara AnimarAlVer; sin JS o con movimiento reducido, todo
// queda quieto y visible. Cada texto lleva data-zona-calma (placa madre).
export function SectionHeading({ eyebrow, title, destacado, intro, align = 'left', size = 'section', className }: SectionHeadingProps) {
  const i = destacado ? title.indexOf(destacado) : -1;
  const antes = i >= 0 ? title.slice(0, i) : title;
  const despues = i >= 0 ? title.slice(i + destacado!.length) : '';
  const a = palabras(antes, 0);
  const d = i >= 0 ? palabras(destacado!, a.cuantas) : null;
  const b = palabras(despues, a.cuantas + (d?.cuantas ?? 0));
  const total = a.cuantas + (d?.cuantas ?? 0) + b.cuantas;
  // el subrayado arranca cuando la última palabra ya va subiendo
  const retardoDestacado = 160 + Math.min(total, 10) * 45 + 220;

  const contenidoTitulo = (
    <>
      {a.nodos}
      {d && (
        <>
          {/\s$/.test(antes) ? ' ' : ''}
          <span className="destacado">{d.nodos}</span>
          <span className="destacado-via" aria-hidden="true" />
        </>
      )}
      {b.cuantas > 0 && /^\s/.test(despues) ? ' ' : ''}
      {b.nodos}
    </>
  );

  const Titulo = size === 'section' ? 'h2' : 'h3';

  return (
    <div
      data-animar
      style={{ '--d-destacado': `${retardoDestacado}ms` } as React.CSSProperties}
      // items-*: cada hijo abraza su texto, así su zona libre (placa madre) no es una franja
      className={cn('flex flex-col gap-4', align === 'center' ? 'mx-auto items-center text-center' : 'items-start', className)}
    >
      {eyebrow && (
        <span data-zona-calma className="rotulo text-sm font-semibold uppercase tracking-[0.18em] text-accent-ink">
          <span className="rotulo-pin anim-pin" aria-hidden="true" />
          <span className="rotulo-pista anim-pista" aria-hidden="true" />
          <span className="anim-sube" style={{ '--d': '120ms' } as React.CSSProperties}>
            {eyebrow}
          </span>
        </span>
      )}
      {size === 'section' ? (
        <Titulo data-zona-calma className="titulo-seccion text-text-primary">
          {contenidoTitulo}
        </Titulo>
      ) : (
        <div className="flex w-full items-center gap-5">
          <Titulo data-zona-calma className="titulo-grupo text-text-primary">
            {contenidoTitulo}
          </Titulo>
          <span className="traza-grupo anim-pista hidden sm:block" aria-hidden="true" />
        </div>
      )}
      {intro && (
        <p
          data-zona-calma
          className={cn(
            'texto-intro anim-sube max-w-[62ch] text-slate-600 leading-relaxed',
            size === 'section' ? 'text-lg md:text-xl' : 'text-base md:text-lg',
            align === 'center' && 'mx-auto',
          )}
          style={{ '--d': `${160 + Math.min(total, 10) * 45 + 120}ms` } as React.CSSProperties}
        >
          {intro}
        </p>
      )}
    </div>
  );
}
