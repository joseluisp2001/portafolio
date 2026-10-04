'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ESCENAS } from '@/components/escenas';
import type { Paso } from '@/components/escenas/comun';
import type { EscenaServicio as NombreEscena } from '@/config/site';
import { cn } from '@/lib/cn';

// Una escena animada en lugar de la ilustración fija de un servicio.
// - El SVG, tal como sale del servidor, ES el cuadro final: sin JavaScript o con
//   "reducir movimiento" se ve completo y cuenta el trabajo solo.
// - Con movimiento, las animaciones (WAAPI) se crean en pausa en su primer cuadro
//   y corren cada vez que la escena entra en pantalla (al 50 %). Cuando sale del
//   todo se rebobina, así al volver se repite (pedido del dueño, 26-9-2026).
// - Si entran varias juntas arrancan en cascada, una detrás de otra.
// - Dentro de un carrusel (`activa` definido) solo corre la de la tarjeta del
//   centro; al dejar de serlo se rebobina, así se repite cada vez que vuelve.
// - "Ver otra vez" la repite a mano.

// La tarjeta termina de entrar (Reveal) antes de que arranque la escena.
const ESPERA_REVEAL_MS = 350;
// Entre una escena y la siguiente cuando entran juntas.
const ENTRE_ESCENAS_MS = 220;

// Turno compartido por todas las escenas de la página: la cascada.
let proximoTurno = 0;
type Reserva = { turno: number; previo: number };
function reservarTurno(): Reserva & { espera: number } {
  const ahora = performance.now();
  const previo = proximoTurno;
  const turno = Math.max(ahora + ESPERA_REVEAL_MS, proximoTurno + ENTRE_ESCENAS_MS);
  proximoTurno = turno;
  return { turno, previo, espera: turno - ahora };
}
// Una reserva que se cancela antes de correr (la tarjeta pasó de largo en el
// carrusel) devuelve su lugar: si no, cada una dejaba un hueco de 220 ms y la
// escena de destino esperaba ~0,8 s después de saltar con un punto.
function devolverTurno(r: Reserva) {
  if (proximoTurno === r.turno) proximoTurno = r.previo;
}

function armar(raiz: Element, pasos: Paso[]): Animation[] {
  const lista: Animation[] = [];
  for (const paso of pasos) {
    raiz.querySelectorAll<SVGElement>(`[data-p="${paso.p}"]`).forEach((el, i) => {
      if (paso.origen) el.style.transformOrigin = paso.origen;
      const kf = typeof paso.kf === 'function' ? paso.kf(i) : paso.kf;
      const delay = paso.delays?.[i] ?? paso.delay + Math.min(i, 5) * (paso.escalon ?? 0);
      // Con más de dos keyframes la curva general deforma los tramos intermedios
      // (un destello pasaba en 30 ms): por defecto va lineal.
      const easing = paso.ease ?? (kf.length > 2 ? 'linear' : 'cubic-bezier(0.22, 1, 0.36, 1)');
      const a = el.animate(kf, { duration: paso.dur, delay, easing, fill: 'both' });
      a.pause();
      a.currentTime = 0;
      lista.push(a);
    });
  }
  return lista;
}

export function EscenaServicio({ escena, nombre, activa }: { escena: NombreEscena; nombre: string; activa?: boolean }) {
  const { Dibujo, descripcion, pasos } = ESCENAS[escena];
  // Ids únicos para los filtros y degradados: hay varias escenas en la página.
  const uid = 'e' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const svg = useRef<SVGSVGElement>(null);
  const correr = useRef<(() => void) | null>(null);
  const [yaCorrio, setYaCorrio] = useState(false);
  const [corriendo, setCorriendo] = useState(false);
  const activaRef = useRef(activa);
  const control = useRef<{ alCambiarActiva: () => void } | null>(null);

  useEffect(() => {
    const raiz = svg.current;
    if (!raiz || typeof raiz.animate !== 'function') return;
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducido.matches) return;

    let vivo = true;
    let temporizador = 0;
    let enCurso = false;
    let corrida = 0; // para ignorar el final de una corrida que se rebobinó
    const lista = armar(raiz, pasos);

    correr.current = () => {
      if (reducido.matches) return;
      const esta = ++corrida;
      enCurso = true;
      setCorriendo(true);
      lista.forEach((a) => {
        a.currentTime = 0;
        a.play();
      });
      Promise.all(lista.map((a) => a.finished)).then(
        () => {
          if (!vivo || reducido.matches || esta !== corrida) return;
          enCurso = false;
          setCorriendo(false);
          setYaCorrio(true);
        },
        () => {},
      );
    };

    const rebobinar = () => {
      corrida++;
      enCurso = false;
      lista.forEach((a) => {
        a.pause();
        a.currentTime = 0;
      });
      setCorriendo(false);
    };

    // Al 50 % en pantalla (y, en un carrusel, siendo la del centro) pide turno y
    // corre. Si sale del todo o deja de ser la activa, se rebobina para repetirse
    // al volver; si sale antes de arrancar, pierde el turno.
    let visible = false;
    let reserva: Reserva | null = null;
    const puede = () => visible && activaRef.current !== false;
    const pedirTurno = () => {
      if (temporizador || enCurso) return;
      const r = reservarTurno();
      reserva = r;
      temporizador = window.setTimeout(() => {
        temporizador = 0;
        reserva = null;
        if (puede()) correr.current?.();
      }, r.espera);
    };
    const soltar = () => {
      if (temporizador) {
        window.clearTimeout(temporizador);
        temporizador = 0;
      }
      if (reserva) {
        devolverTurno(reserva);
        reserva = null;
      }
      rebobinar();
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio >= 0.5) {
          visible = true;
          if (puede()) pedirTurno();
        } else if (!e.isIntersecting) {
          visible = false;
          soltar();
        }
      },
      { threshold: [0, 0.5] },
    );
    io.observe(raiz);
    control.current = {
      alCambiarActiva: () => {
        if (activaRef.current === false) soltar();
        else if (visible) pedirTurno();
      },
    };

    // Si a mitad de camino se activa "reducir movimiento", salta al cuadro final.
    const alCambiar = () => {
      if (!reducido.matches) return;
      window.clearTimeout(temporizador);
      temporizador = 0;
      lista.forEach((a) => a.finish());
      enCurso = false;
      setCorriendo(false);
      setYaCorrio(false);
    };
    reducido.addEventListener('change', alCambiar);

    return () => {
      vivo = false;
      window.clearTimeout(temporizador);
      if (reserva) devolverTurno(reserva);
      io.disconnect();
      reducido.removeEventListener('change', alCambiar);
      lista.forEach((a) => a.cancel());
      correr.current = null;
      control.current = null;
    };
  }, [pasos]);

  useEffect(() => {
    activaRef.current = activa;
    control.current?.alCambiarActiva();
  }, [activa]);

  return (
    <div className="escena relative aspect-video overflow-hidden bg-[#0F172A]">
      <svg
        ref={svg}
        viewBox="0 0 800 450"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={descripcion}
      >
        <Dibujo uid={uid} />
      </svg>
      {yaCorrio && (
        <button
          type="button"
          onClick={() => {
            if (!corriendo) correr.current?.();
          }}
          aria-label={`Repetir la animación de ${nombre}`}
          aria-disabled={corriendo}
          className={cn(
            'escena-repetir absolute bottom-3 right-3 grid size-11 place-items-center rounded-full border border-slate-600/50 bg-slate-900/70 text-slate-300 backdrop-blur-sm',
            corriendo && 'opacity-40',
          )}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
