'use client';

import { useEffect } from 'react';

// Dispara las entradas de texto de la portada (títulos, rótulos, párrafos,
// listas): cada [data-animar] recibe data-visto="entra" la primera vez que entra
// en pantalla y el CSS hace el resto (app/globals.css, bloque "Texto").
// - El estado oculto solo existe si esto corrió (pone html[data-entradas]): sin
//   JavaScript, o si el paquete no llega, todo se ve.
// - Lo que ya está a la vista al hidratar queda en data-visto="ya": no parpadea
//   ni se anima de nuevo.
// - Con "reducir movimiento" no hace nada: el texto queda quieto y visible.
// - Una sola vez por elemento: nada se repite al volver a pasar.
export function AnimarAlVer() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const elementos = Array.from(document.querySelectorAll<HTMLElement>('[data-animar]'));
    const alto = window.innerHeight;
    for (const el of elementos) {
      if (el.dataset.visto) continue;
      const r = el.getBoundingClientRect();
      if (r.top < alto && r.bottom > 0) el.dataset.visto = 'ya';
    }
    document.documentElement.dataset.entradas = '';
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.visto = 'entra';
          io.unobserve(e.target);
        }
      },
      // threshold 0 con el recorte en el margen: entra cuando su borde de arriba pasa
      // el 88 % de la pantalla, sea del alto que sea. Con un umbral en proporción
      // (0.15) un bloque de más de ~5,9 pantallas nunca llegaba y quedaba oculto: las
      // preguntas frecuentes con zoom al 400 % (320 × 155) miden 6.
      { rootMargin: '0px 0px -12% 0px', threshold: 0 },
    );
    for (const el of elementos) if (!el.dataset.visto) io.observe(el);
    return () => io.disconnect();
  }, []);
  return null;
}
