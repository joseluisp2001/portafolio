'use client';

import { useEffect } from 'react';

/*
  Lo que aparece al hacer scroll.

  No dibuja nada: mira los elementos marcados con `data-revelar` y, cuando uno
  entra en pantalla, le pone `data-visto`. El resto lo hace el CSS.

  - UNA VEZ: apenas se revela, se deja de mirar.
  - ESCALONADO: los que entran juntos salen de a uno, 70 ms entre cada uno, con
    tope de seis escalones. Mas de eso ya se siente lento.
  - LOS PRIMEROS esperan a que termine la entrada del encabezado, para que la
    pagina no arranque con todo moviendose a la vez. El reloj es la animacion
    de la hoja y no la carga de la pagina: contando desde la carga, "Lo que se
    hacer" subia antes que el resumen, que esta arriba.
  - EL FOCO MANDA. Si alguien llega con Tab a algo que todavia no aparecio
    (queda pegado al borde de abajo), aparece en el acto: un foco invisible es
    un foco perdido.

  `data-visto` es un atributo que React no maneja, asi que un re-render de un
  componente de cliente (las habilidades, la galeria) no lo borra.

  Si no hay `data-mov` en <html> (reducir movimiento, o el script de <head> ya
  se rindio), no hace nada: la pagina ya esta visible.
*/

const PASO = 70; // ms entre elementos que entran juntos
const TOPE = 6; // escalones como maximo
const FIN_ENTRADA = 780; // ms desde que arranca la hoja hasta que el resumen esta al 90 %

export default function Revelador() {
  useEffect(() => {
    const html = document.documentElement;

    // Avisa al script de <head> que el JS arranco: ya no hace falta la salida
    // de emergencia.
    (window as Window & { __revelar?: boolean }).__revelar = true;

    if (!html.hasAttribute('data-mov')) return;

    if (!('IntersectionObserver' in window)) {
      html.removeAttribute('data-mov');
      return;
    }

    // Si alguien activa "reducir movimiento" con la pagina abierta, se apaga
    // todo y queda visible.
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)');
    const alCambiar = () => {
      if (reducir.matches) html.removeAttribute('data-mov');
    };
    reducir.addEventListener('change', alCambiar);

    const pendientes = new Set(document.querySelectorAll<HTMLElement>('[data-revelar]:not([data-visto])'));

    function revelar(el: HTMLElement, retardo: number) {
      el.style.setProperty('--retardo', `${Math.round(retardo)}ms`);
      el.dataset.visto = '';
      pendientes.delete(el);
      observador.unobserve(el);
    }

    // Cuando termina la entrada, en el reloj de las animaciones. Si la hoja ya
    // termino de posarse (la pagina tardo en hidratar), no hay nada que esperar.
    const hoja = document.querySelector('.hoja')?.getAnimations()[0];
    const finEntrada = typeof hoja?.startTime === 'number' ? hoja.startTime + FIN_ENTRADA : 0;
    const ahora = () => Number(document.timeline.currentTime ?? performance.now());

    let primera = true;

    const observador = new IntersectionObserver(
      (entradas) => {
        const base = primera ? Math.max(0, finEntrada - ahora()) : 0;
        primera = false;

        entradas
          .filter((e) => e.isIntersecting)
          .forEach((e, i) => revelar(e.target as HTMLElement, base + Math.min(i, TOPE) * PASO));
      },
      // Un poco antes del borde de abajo, para que no aparezca ya a la vista.
      { rootMargin: '0px 0px -48px 0px', threshold: 0.1 },
    );

    pendientes.forEach((el) => observador.observe(el));

    /*
      Lo ultimo de la hoja (los idiomas) queda dentro de esos 48 px de abajo
      aun con la pagina bajada hasta el final: nunca cruzaria la linea y se
      quedaria invisible. Al llegar al fondo se revela lo que este a la vista.
    */
    function alFondo() {
      const fondo = document.documentElement.scrollHeight - 2;
      if (window.innerHeight + window.scrollY < fondo) return;

      let i = 0;
      pendientes.forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight) revelar(el, Math.min(i++, TOPE) * PASO);
      });
    }

    window.addEventListener('scroll', alFondo, { passive: true });

    // Al recargar, el navegador devuelve la pagina a donde estaba ANTES de que
    // este efecto ponga el escuchador: si estaba al fondo, no llega ningun
    // evento de scroll. Se mira una vez ahora y otra en el cuadro siguiente.
    alFondo();
    const cuadro = requestAnimationFrame(alFondo);

    function alFoco(e: FocusEvent) {
      const bloque = (e.target as Element | null)?.closest?.<HTMLElement>('[data-revelar]:not([data-visto])');
      if (bloque) revelar(bloque, 0);
    }

    document.addEventListener('focusin', alFoco);

    return () => {
      observador.disconnect();
      cancelAnimationFrame(cuadro);
      document.removeEventListener('focusin', alFoco);
      window.removeEventListener('scroll', alFondo);
      reducir.removeEventListener('change', alCambiar);
    };
  }, []);

  return null;
}
