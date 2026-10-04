'use client';

import { useEffect, useRef } from 'react';
import type { Anillo, ColoresAnillo } from '@/lib/anillo';
import type { Senales } from '@/lib/senales';

// Fondo vivo: el anillo de partículas sigue al mouse con retraso.
// - En escritorio con movimiento, el lienzo va FIJO detrás de toda la portada
//   (pedido del dueño, 27-9-2026: "que se mueva toda la pantalla"). El contenido
//   de cada sección queda por encima; detrás de cada texto marcado con
//   [data-zona-calma] el anillo se apaga del todo, y en el hero ([data-zona-calma
//   ="tenue"]) queda al 16 %. Sobre [data-fondo-oscuro] usa la paleta oscura.
// - En el teléfono y con "reducir movimiento", solo en el hero, como antes: sin
//   mouse no hay qué seguir, y un lienzo que se redibuja en cada scroll gasta
//   batería (y con movimiento reducido no va parallax).
// - Con la placa madre de fondo (<main data-placa>, lib/placa.ts), en el mismo
//   lienzo corren las señales (lib/senales.ts): nacen de la pista más cercana al
//   mouse, en ráfaga con un clic y unas pocas de ambiente. Solo donde se ve la
//   placa: debajo del hero y dentro del <main>.
// No es un bucle infinito (la nota del sitio lo desaconseja): se mueve mientras
// hay mouse o scroll, frena suave y se duerme a los 3,5 s quieto, con el último
// cuadro a la vista. En el teléfono solo reacciona a un toque (no al scroll).
// Sin WebGL2, sin JavaScript o si algo falla, la página queda como antes.

const DORMIR_MS = 3500;
// En los últimos 800 ms antes de dormir, la deriva y el bamboleo frenan de a poco.
const FRENADA_MS = 800;
const ENTRADA_MS = 900;
// Opacidad del anillo detrás del texto del hero. Medido el 26-9-2026: con 0,16 el
// texto más justo (el eyebrow cian) queda en 4,72:1 en el peor píxel.
const ZONA_TENUE = 0.16;
// Alto del encabezado fijo y transparente (h-16) más un margen.
const ENCABEZADO_PX = 76;

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as const;
};

// Tokens de globals.css. Sobre lo claro no va el blanco (no se ve): su lugar lo
// toman la tinta y el azul del texto.
const COLORES: ColoresAnillo = {
  oscuro: {
    lejos: rgb('#64748B'), // text-secondary
    c1: rgb('#06B6D4'), // accent
    c2: rgb('#0891B2'), // accent-hover
    c3: rgb('#F8FAFC'), // text-inverse
    c4: rgb('#0E7490'), // accent-ink
  },
  claro: {
    lejos: rgb('#64748B'),
    c1: rgb('#06B6D4'),
    c2: rgb('#0891B2'),
    c3: rgb('#0E7490'),
    c4: rgb('#0F172A'), // text-primary
  },
};

// --ease-tech: cubic-bezier(0.22, 1, 0.36, 1)
function easeTech(x: number) {
  const [x1, y1, x2, y2] = [0.22, 1, 0.36, 1];
  const bx = (t: number) => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
  const by = (t: number) => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (bx(mid) < x) lo = mid;
    else hi = mid;
  }
  return by((lo + hi) / 2);
}

export function FondoAnillo() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const hero = canvas?.parentElement;
    if (!canvas || !hero) return;

    let vivo = true;
    let anillo: Anillo | null = null;
    let lib: typeof import('@/lib/anillo') | null = null;
    let raf = 0;
    const limpiezas: Array<() => void> = [];
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
    const tactil = window.matchMedia('(pointer: coarse)').matches;
    // true: lienzo fijo detrás de toda la portada; false: solo en el hero
    let pagina = false;

    let W = 0;
    let H = 0;
    // puntero en px del lienzo: destino y seguidor lento
    let tx = 0;
    let ty = 0;
    let sx = 0;
    let sy = 0;
    // el pulso sube rápido hacia su objetivo y el objetivo decae: una onda, no un salto
    let pulso = 0;
    let pulsoObj = 0;
    let reloj = 0;
    let velocidad = 1; // del reloj de la deriva: frena antes de dormir
    let inicio = 0;
    let entradaHecha = false;
    let ultimaActividad = 0;
    let ultimoCuadro = 0;
    let heroVisible = false;

    let zonas = new Float32Array(0);
    let zonasAlfa = new Float32Array(0);
    let oscuras = new Float32Array(0);
    let nZonas = 0;
    let nOscuras = 0;
    const rango = document.createRange();
    // Señales de la placa (solo escritorio y con la placa en la página)
    const main = hero.closest<HTMLElement>('main[data-placa]');
    let sen: Senales | null = null;
    let bufSprites: Float32Array | null = null;

    const visible = () => (pagina || heroVisible) && !document.hidden;

    // Zonas calmas y franjas oscuras, en uv del lienzo (y hacia arriba). En el
    // modo página se miden en cada cuadro: el contenido se mueve con el scroll.
    const medirZonas = () => {
      if (!lib || !W || !H) return;
      const c = canvas.getBoundingClientRect();
      const raiz: ParentNode = pagina ? document : hero;
      nZonas = 0;
      for (const el of raiz.querySelectorAll<HTMLElement>('[data-zona-calma]')) {
        if (nZonas >= lib.MAX_ZONAS) break;
        // El rango abraza el texto: un título centrado no apaga todo el ancho.
        rango.selectNodeContents(el);
        const r = rango.getBoundingClientRect();
        if (r.width < 1 || r.bottom < c.top - 80 || r.top > c.bottom + 80) continue;
        const tenue = el.dataset.zonaCalma === 'tenue';
        // Una zona total apaga a 0,02 del ancho hacia adentro, más medio guion.
        const pad = tenue ? 28 : 0.02 * W + 12;
        // La del hero llega hasta arriba del hero: entre el menú y el eyebrow
        // tampoco queda un arco suelto.
        const arriba = tenue ? (el.closest('[data-fondo-oscuro]') ?? hero).getBoundingClientRect().top : r.top - pad;
        const i = nZonas * 4;
        zonas[i] = (r.left - c.left - pad) / W;
        zonas[i + 1] = 1 - (r.bottom - c.top + pad) / H;
        zonas[i + 2] = (r.right - c.left + pad) / W;
        zonas[i + 3] = 1 - (arriba - c.top) / H;
        zonasAlfa[nZonas] = tenue ? ZONA_TENUE : 0;
        nZonas++;
      }
      nOscuras = 0;
      if (!pagina) {
        oscuras[0] = -1;
        oscuras[1] = 2;
        nOscuras = 1;
        return;
      }
      for (const el of document.querySelectorAll<HTMLElement>('[data-fondo-oscuro]')) {
        if (nOscuras >= lib.MAX_OSCURAS) break;
        const r = el.getBoundingClientRect();
        if (r.bottom < c.top || r.top > c.bottom) continue;
        oscuras[nOscuras * 2] = 1 - (r.bottom - c.top) / H;
        oscuras[nOscuras * 2 + 1] = 1 - (r.top - c.top) / H;
        nOscuras++;
      }
    };

    const dibujar = (dt: number, asentar = false) => {
      if (!anillo || !W || !H) return;
      if (pagina || asentar) medirZonas();
      const ahora = performance.now();
      const entrada = inicio ? easeTech(Math.min(1, (ahora - inicio) / ENTRADA_MS)) : 0;
      const quieto = ahora - ultimaActividad;
      const velocidadObj = Math.min(1, Math.max(0, (DORMIR_MS - quieto) / FRENADA_MS));
      velocidad += (velocidadObj - velocidad) * (1 - Math.exp(-dt * 10));
      const k = 1 - Math.exp(-dt * 4.5);
      sx += (tx - sx) * k;
      sy += (ty - sy) * k;
      pulso += (pulsoObj - pulso) * (1 - Math.exp(-dt * 18));
      pulsoObj *= Math.exp(-dt * 3.2);
      reloj += dt * velocidad;
      let nSprites = 0;
      if (pagina && sen && main && bufSprites) {
        const c = canvas.getBoundingClientRect();
        const m = main.getBoundingClientRect();
        const h = hero.getBoundingClientRect();
        const ox = m.left - c.left;
        const oy = m.top - c.top;
        // la placa se ve entre el final del hero y el final del <main>
        const clip0 = Math.max(0, h.bottom - c.top);
        const clip1 = Math.min(H, m.bottom - c.top);
        const ts = ahora / 1000;
        sen.avanzar(dt, ts);
        if (quieto < DORMIR_MS && !reducido.matches && clip1 > clip0) sen.ambiente(-ox, clip0 - oy, W - ox, clip1 - oy, ts);
        nSprites = sen.sprites(bufSprites, ox, oy, clip0, clip1, ts);
      }
      anillo.frame({
        mx: sx / W,
        my: 1 - sy / H,
        t: reloj,
        dt,
        entrada,
        pulso,
        zonas,
        zonasAlfa,
        nZonas,
        oscuras,
        nOscuras,
        tope: 1 - ENCABEZADO_PX / H,
        topeAlfa: ZONA_TENUE,
        asentar,
        sprites: bufSprites ?? undefined,
        nSprites,
      });
    };

    const paso = (ahora: number) => {
      raf = 0;
      if (!anillo || !visible()) return;
      // en el teléfono, tope de 30 cuadros por segundo
      if (tactil && ultimoCuadro && ahora - ultimoCuadro < 32) {
        raf = requestAnimationFrame(paso);
        return;
      }
      const dt = ultimoCuadro ? Math.min(0.05, (ahora - ultimoCuadro) / 1000) : 1 / 60;
      ultimoCuadro = ahora;
      dibujar(dt);
      const entrando = inicio > 0 && ahora - inicio < ENTRADA_MS;
      const despierto = ahora - ultimaActividad < DORMIR_MS || velocidad > 0.01;
      const senales = pagina && sen ? sen.activas() : 0;
      if (entrando || despierto || pulso > 0.02 || pulsoObj > 0.02 || senales > 0) raf = requestAnimationFrame(paso);
    };

    const despertar = () => {
      ultimaActividad = performance.now();
      if (!raf && anillo && visible() && !reducido.matches) {
        ultimoCuadro = 0;
        raf = requestAnimationFrame(paso);
      }
    };

    // Un cuadro suelto que lleva todo a su sitio: al cambiar de tamaño el lienzo se borra.
    const cuadroFijo = () => dibujar(0, true);

    const medir = () => {
      const r = canvas.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, tactil ? 1.5 : 2);
      const primera = !W;
      W = r.width;
      H = r.height;
      const cw = Math.round(W * dpr);
      const ch = Math.round(H * dpr);
      // reasignar el tamaño borra el lienzo: solo si cambió
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      if (primera) {
        // Nace donde se ve: a la derecha del texto en escritorio, abajo en el
        // teléfono. En el centro quedaría detrás del texto, en la zona calma.
        const [rx, ry] = W > H ? [0.78, 0.56] : [0.5, 0.92];
        tx = sx = W * rx;
        ty = sy = H * ry;
      }
      anillo?.resize(W, H, dpr);
      // En el hero la zona se mide una vez; en la página, en cada cuadro.
      medirZonas();
    };

    // Escritorio con movimiento: página entera. Si cambia "reducir movimiento",
    // vuelve al hero (o sale de él) en el acto.
    const elegirModo = () => {
      const antes = pagina;
      pagina = !tactil && !reducido.matches;
      canvas.classList.toggle('fondo-anillo--pagina', pagina);
      if (antes !== pagina && W) {
        // el anillo se queda donde estaba en la pantalla
        const c = canvas.getBoundingClientRect();
        const h = hero.getBoundingClientRect();
        const dx = pagina ? h.left - c.left : c.left - h.left;
        const dy = pagina ? h.top - c.top : c.top - h.top;
        tx += dx;
        sx += dx;
        ty += dy;
        sy += dy;
      }
    };

    const empezarEntrada = () => {
      if (entradaHecha || !anillo) return;
      entradaHecha = true;
      if (reducido.matches) {
        inicio = performance.now() - ENTRADA_MS; // sin entrada: el cuadro fijo, entero
        cuadroFijo();
        return;
      }
      inicio = performance.now();
      despertar();
    };

    const enInteractivo = (e: Event) =>
      e.target instanceof Element && e.target.closest('a, button, input, textarea, select, label') !== null;
    const posicion = (x: number, y: number) => {
      const r = canvas.getBoundingClientRect();
      tx = x - r.left;
      ty = y - r.top;
    };
    // Punto en coordenadas de placa, o null si cae sobre el hero (ahí no hay placa).
    const enPlaca = (x: number, y: number): [number, number] | null => {
      if (!main || y < hero.getBoundingClientRect().bottom) return null;
      const m = main.getBoundingClientRect();
      return y > m.bottom ? null : [x - m.left, y - m.top];
    };
    // El mouse mueve el anillo. El dedo no: un arrastre es un scroll.
    const alMover = (e: PointerEvent) => {
      if (reducido.matches || e.pointerType === 'touch') return;
      if (!pagina && !hero.contains(e.target as Node)) return;
      posicion(e.clientX, e.clientY);
      if (pagina && sen) {
        const p = enPlaca(e.clientX, e.clientY);
        if (p) sen.desdeCursor(p[0], p[1], e.movementX, e.movementY, performance.now() / 1000);
      }
      despertar();
    };
    // Un clic o un toque de verdad (el navegador no manda click si hubo scroll).
    const alTocar = (e: MouseEvent) => {
      if (reducido.matches || enInteractivo(e)) return;
      if (!pagina && !hero.contains(e.target as Node)) return;
      posicion(e.clientX, e.clientY);
      pulsoObj = 1;
      if (pagina && sen) {
        const p = enPlaca(e.clientX, e.clientY);
        if (p) sen.rafaga(p[0], p[1], performance.now() / 1000);
      }
      despertar();
    };
    // Con la página entera, el scroll también lo despierta: el contenido pasa por
    // encima y las zonas calmas lo siguen.
    const alDesplazar = () => {
      if (pagina) despertar();
    };

    const arrancar = async () => {
      try {
        lib = await import('@/lib/anillo');
      } catch {
        return;
      }
      if (!vivo) return;
      if (!tactil && main) {
        try {
          const ms = await import('@/lib/senales');
          if (!vivo) return;
          sen = ms.crearSenales();
          bufSprites = new Float32Array(ms.MAX_SPRITES * ms.DATOS_SPRITE);
        } catch {
          // sin señales: la placa quieta y el anillo siguen igual
        }
      }
      zonas = new Float32Array(lib.MAX_ZONAS * 4);
      zonasAlfa = new Float32Array(lib.MAX_ZONAS);
      oscuras = new Float32Array(lib.MAX_OSCURAS * 2);
      try {
        anillo = lib.crearAnillo(canvas, { movil: tactil, colores: COLORES });
      } catch {
        canvas.hidden = true;
        return;
      }
      elegirModo();
      medir();

      const ro = new ResizeObserver(() => {
        medir();
        cuadroFijo();
      });
      ro.observe(canvas);
      // Si el contenido cambia de alto (una pregunta que se abre), las zonas se mueven.
      ro.observe(document.body);
      // En el hero, la entrada espera a que esté a la vista (puede cargar con scroll).
      const io = new IntersectionObserver(([e]) => {
        heroVisible = e.isIntersecting;
        if (!visible()) return;
        if (!entradaHecha) empezarEntrada();
        else if (performance.now() - ultimaActividad < DORMIR_MS) despertar();
      });
      io.observe(hero);
      if (pagina) empezarEntrada();
      window.addEventListener('pointermove', alMover, { passive: true });
      window.addEventListener('click', alTocar);
      window.addEventListener('scroll', alDesplazar, { passive: true });
      const alCambiarReducido = () => {
        elegirModo();
        medir();
        if (!reducido.matches) return;
        cancelAnimationFrame(raf);
        raf = 0;
        inicio = performance.now() - ENTRADA_MS;
        cuadroFijo();
      };
      reducido.addEventListener('change', alCambiarReducido);
      const alPerder = (e: Event) => {
        e.preventDefault();
        cancelAnimationFrame(raf);
        raf = 0;
        anillo = null;
        canvas.hidden = true;
      };
      canvas.addEventListener('webglcontextlost', alPerder);
      limpiezas.push(() => {
        ro.disconnect();
        io.disconnect();
        window.removeEventListener('pointermove', alMover);
        window.removeEventListener('click', alTocar);
        window.removeEventListener('scroll', alDesplazar);
        reducido.removeEventListener('change', alCambiarReducido);
        canvas.removeEventListener('webglcontextlost', alPerder);
        canvas.classList.remove('fondo-anillo--pagina');
      });
      canvas.dataset.listo = '';
    };

    // Entra cuando terminó el texto del hero (y la carga en forma de circuito,
    // si se está mostrando), y cuando el navegador respire.
    const demora = document.documentElement.dataset.intro === 'mostrando' ? 2000 : 800;
    const temporizador = window.setTimeout(() => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(() => void arrancar(), { timeout: 800 });
      else void arrancar();
    }, demora);

    return () => {
      vivo = false;
      window.clearTimeout(temporizador);
      cancelAnimationFrame(raf);
      limpiezas.forEach((f) => f());
      anillo?.destroy();
      anillo = null;
    };
  }, []);

  // z-0: por encima del fondo de las secciones y del velo del hero, por debajo
  // del contenido (el de cada sección va `relative`, después en el árbol).
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="fondo-anillo pointer-events-none absolute inset-0 z-0 h-full w-full"
    />
  );
}
