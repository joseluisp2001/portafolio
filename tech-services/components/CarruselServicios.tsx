'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { ServiceCard } from '@/components/ServiceCard';
import type { Service } from '@/config/site';
import { cn } from '@/lib/cn';

// Carrusel de las tarjetas de un grupo de servicios (hoy, Mantenimiento y
// Reparación, las que tienen escena animada). La tarjeta activa va al centro y
// su escena corre al llegar; las vecinas asoman más chicas.
// - Avanza solo cada 5 s mientras está en pantalla, da UNA vuelta y para (el
//   sitio desaconseja el movimiento sin fin). Al salir de la sección vuelve al
//   principio, así al regresar se repite.
// - Se detiene con el mouse encima, con el foco adentro, al deslizarlo de lado,
//   con un toque o con el botón de pausa (WCAG 2.2.2). Un deslizamiento vertical
//   que empieza sobre la tarjeta es scroll de la página: no lo detiene (en el
//   teléfono la tarjeta ocupa media pantalla). Con "reducir movimiento" no avanza solo.
// - Es un scroll con snap: en el teléfono se desliza con el dedo.
// - Al navegar a mano, una región viva anuncia "2 de 5: nombre" al lector.

const INTERVALO_MS = 5000;

export function CarruselServicios({ services, titulo }: { services: Service[]; titulo: string }) {
  const raiz = useRef<HTMLDivElement>(null);
  const pista = useRef<HTMLDivElement>(null);
  const [activa, setActiva] = useState(0);
  const [pausado, setPausado] = useState(false); // botón de pausa
  const [manual, setManual] = useState(false); // la persona está navegando
  const [enPantalla, setEnPantalla] = useState(false);
  const [retenido, setRetenido] = useState(false); // mouse encima o foco adentro
  const [reducido, setReducido] = useState(false);
  const toque = useRef<{ x: number; y: number } | null>(null);
  const n = services.length;

  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const actualizar = () => setReducido(m.matches);
    actualizar();
    m.addEventListener('change', actualizar);
    return () => m.removeEventListener('change', actualizar);
  }, []);

  const ir = useCallback(
    (i: number, suave = true) => {
      const p = pista.current;
      const d = p?.children[i] as HTMLElement | undefined;
      if (!p || !d) return;
      p.scrollTo({ left: d.offsetLeft - (p.clientWidth - d.clientWidth) / 2, behavior: suave && !reducido ? 'smooth' : 'auto' });
    },
    [reducido],
  );

  // La activa es la que tiene el centro más cerca del centro de la pista.
  useEffect(() => {
    const p = pista.current;
    if (!p) return;
    let cuadro = 0;
    const medir = () => {
      cuadro = 0;
      const centro = p.scrollLeft + p.clientWidth / 2;
      let mejor = 0;
      let distancia = Infinity;
      Array.from(p.children).forEach((c, i) => {
        const el = c as HTMLElement;
        const d = Math.abs(el.offsetLeft + el.clientWidth / 2 - centro);
        if (d < distancia) {
          distancia = d;
          mejor = i;
        }
      });
      setActiva(mejor);
    };
    const alDesplazar = () => {
      if (!cuadro) cuadro = requestAnimationFrame(medir);
    };
    p.addEventListener('scroll', alDesplazar, { passive: true });
    return () => {
      p.removeEventListener('scroll', alDesplazar);
      cancelAnimationFrame(cuadro);
    };
  }, []);

  // En pantalla o no. Al salir del todo, vuelve al principio para repetirse al regresar.
  useEffect(() => {
    const r = raiz.current;
    if (!r) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setEnPantalla(e.isIntersecting && e.intersectionRatio >= 0.4);
        if (!e.isIntersecting) {
          setManual(false);
          ir(0, false);
          setActiva(0);
        }
      },
      { threshold: [0, 0.4] },
    );
    io.observe(r);
    return () => io.disconnect();
  }, [ir]);

  const avanzaSolo = !reducido && !pausado && !manual && enPantalla && !retenido && activa < n - 1;
  const autoplayPosible = !reducido && !manual && activa < n - 1;

  useEffect(() => {
    if (!avanzaSolo) return;
    const t = window.setTimeout(() => ir(activa + 1), INTERVALO_MS);
    return () => window.clearTimeout(t);
  }, [avanzaSolo, activa, ir]);

  // Solo al navegar a mano: el avance solo no se anuncia.
  const anuncio = manual ? `${activa + 1} de ${n}: ${services[activa].name}` : '';

  const navegar = (i: number) => {
    setManual(true);
    ir(Math.max(0, Math.min(n - 1, i)));
  };

  return (
    <div
      ref={raiz}
      className="carrusel mt-8"
      role="region"
      aria-roledescription="carrusel"
      aria-label={titulo}
      data-detenido={avanzaSolo ? undefined : ''}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setRetenido(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setRetenido(false)}
      onFocus={() => setRetenido(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setRetenido(false);
      }}
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {anuncio}
      </p>
      <div
        ref={pista}
        className="carrusel-pista relative flex gap-6 overflow-x-auto snap-x snap-mandatory py-4"
        onPointerDown={(e) => {
          if (e.pointerType !== 'touch') setManual(true);
        }}
        // Con el dedo: manual solo si el gesto es de lado. Un toque (sin
        // deslizar) llega como click.
        onTouchStart={(e) => {
          const t = e.touches[0];
          toque.current = t ? { x: t.clientX, y: t.clientY } : null;
        }}
        onTouchMove={(e) => {
          const inicio = toque.current;
          const t = e.touches[0];
          if (!inicio || !t) return;
          const dx = Math.abs(t.clientX - inicio.x);
          const dy = Math.abs(t.clientY - inicio.y);
          if (dx > 8 && dx > dy) {
            setManual(true);
            toque.current = null;
          } else if (dy > 8) {
            toque.current = null;
          }
        }}
        onClick={() => setManual(true)}
        onWheel={(e) => {
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) setManual(true);
        }}
      >
        {services.map((service, i) => (
          <div
            key={service.slug}
            className="carrusel-diapo flex snap-center"
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`${i + 1} de ${n}: ${service.name}`}
            data-activa={i === activa ? '' : undefined}
            // Solo el foco del teclado centra la tarjeta. Con el mouse, el foco
            // llega al apretar: la tarjeta se deslizaba bajo el cursor y el clic
            // en "Consultar" de la vecina se perdía.
            onFocus={(e) => {
              if (i !== activa && (e.target as HTMLElement).matches(':focus-visible')) navegar(i);
            }}
          >
            <div className="w-full">
              <ServiceCard service={service} activa={i === activa} />
            </div>
          </div>
        ))}
      </div>

      {/* Las flechas no se deshabilitan con disabled: con el foco encima, el foco
          caía al <body> al llegar al extremo. En el teléfono no van (no caben con
          cinco puntos): se desliza con el dedo y los puntos llevan a cada una. */}
      <div data-zona-calma className="carrusel-controles mx-auto mt-4 flex w-fit items-center justify-center gap-3">
        <button
          type="button"
          className="carrusel-boton carrusel-flecha"
          onClick={() => activa > 0 && navegar(activa - 1)}
          aria-disabled={activa === 0}
          aria-label="Servicio anterior"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-1">
          {services.map((service, i) => (
            <button
              key={service.slug}
              type="button"
              className="carrusel-punto"
              onClick={() => navegar(i)}
              aria-label={`Ir a ${service.name}`}
              aria-current={i === activa ? 'true' : undefined}
            >
              <span className="carrusel-punto-marca" data-activa={i === activa ? '' : undefined}>
                {i === activa && autoplayPosible && <span key={`${activa}-${avanzaSolo}`} className="carrusel-progreso" />}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="carrusel-boton carrusel-flecha"
          onClick={() => activa < n - 1 && navegar(activa + 1)}
          aria-disabled={activa === n - 1}
          aria-label="Servicio siguiente"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>

        {!reducido && (
          <button
            type="button"
            className={cn('carrusel-boton', !autoplayPosible && 'invisible')}
            onClick={() => setPausado((p) => !p)}
            aria-label={pausado ? 'Reanudar el carrusel' : 'Pausar el carrusel'}
          >
            {pausado ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  );
}
