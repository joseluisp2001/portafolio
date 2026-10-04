'use client';

import Image from 'next/image';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cv } from '@/config/cv';

/*
  Pase de imagenes con fundido.

  Lo que lo separa de un carrusel cualquiera:

  1. FUNDIDO, no desplazamiento. Las laminas estan apiladas y solo cambia la
     opacidad. Un slide que se desliza obliga al ojo a seguirlo; un fundido deja
     comparar una identidad con la siguiente, que es justo el argumento de esta
     seccion.

  2. FUNDIDO SIN BAJON. La lamina que entra aparece ENCIMA de la anterior, que
     se queda entera debajo hasta que la nueva termina: nunca se ve el blanco
     del fondo a mitad del cambio. Y la que entra arranca SIEMPRE desde cero,
     aunque ya estuviera opaca debajo (volver con ‹ a la que se acaba de ir):
     por eso el fundido lo lanza element.animate() y no una transicion de CSS,
     que en ese caso no tendria de donde partir y cortaria en seco.

  3. EL TIEMPO SE VE. La barra de la lamina activa se llena en lo que falta
     para la siguiente, y el avance lo dispara el fin de esa barra: no hay un
     setInterval aparte que se pueda desfasar de lo que se ve.

  4. SE DETIENE cuando alguien lo mira o cuando nadie lo ve: mouse encima, foco
     adentro, pestana oculta, galeria fuera de la pantalla, o el boton de pausa.
     Mientras avanza solo, el pie no se anuncia (aria-live="off"): un lector de
     pantalla no tiene por que dictar una lamina nueva cada 4 segundos.

  5. Respeta "reducir movimiento". Sin avance automatico, sin escala, y un
     fundido de 200 ms — quedan los botones y ya.

  Al imprimir desaparece entero: en papel va la lista de proyectos.
*/

const CADA = 4200; // ms que se queda cada lamina

const SALIDA = 'cubic-bezier(0.23, 1, 0.32, 1)'; // --ease-out de globals.css
const EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)'; // --ease-expo

export default function PaseDeImagenes() {
  const laminas = cv.galeria;
  const [actual, setActual] = useState(0);
  const [previa, setPrevia] = useState<number | null>(null);

  // Lo que detiene el avance. Cada uno se prende y se apaga por su lado:
  // sacar el mouse no tiene que reanudar un pase que tiene el foco adentro.
  const [mouse, setMouse] = useState(false);
  const [foco, setFoco] = useState(false);
  const [oculta, setOculta] = useState(false); // pestana en segundo plano
  const [fuera, setFuera] = useState(true); // galeria fuera de la pantalla
  const [pausado, setPausado] = useState(false); // el boton de pausa

  // Arranca quieto: en el servidor no se sabe si la persona pidio "reducir
  // movimiento", y es mejor empezar sin avance que arrancar y frenar.
  const [quieto, setQuieto] = useState(true);

  // El pie solo se anima cuando cambia de verdad, no al cargar.
  const [cambio, setCambio] = useState(false);

  const raiz = useRef<HTMLDivElement>(null);
  const imagenes = useRef<(HTMLImageElement | null)[]>([]);
  const montado = useRef(false);

  function ir(destino: number) {
    const n = laminas.length;
    const siguiente = ((destino % n) + n) % n;
    if (siguiente === actual) return;

    setPrevia(actual);
    setActual(siguiente);
    setCambio(true);
  }

  // El fundido de la lamina que entra. useLayoutEffect y no useEffect: corre
  // antes de pintar, asi el primer cuadro ya la muestra en opacidad 0 y no hay
  // un destello de la lamina entera.
  useLayoutEffect(() => {
    if (!montado.current) {
      montado.current = true;
      return;
    }

    const img = imagenes.current[actual];
    if (!img) return;

    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    img.animate({ opacity: [0, 1] }, { duration: reducir ? 200 : 700, easing: SALIDA });
    if (!reducir) {
      img.animate({ transform: ['scale(1.04)', 'none'] }, { duration: 1400, easing: EXPO });
    }
  }, [actual]);

  // "Reducir movimiento", y si cambia con la pagina abierta.
  useEffect(() => {
    const reducir = window.matchMedia('(prefers-reduced-motion: reduce)');
    const leer = () => setQuieto(reducir.matches);
    leer();
    reducir.addEventListener('change', leer);
    return () => reducir.removeEventListener('change', leer);
  }, []);

  // Si la pestana no se ve, no tiene sentido seguir avanzando.
  useEffect(() => {
    const leer = () => setOculta(document.hidden);
    leer();
    document.addEventListener('visibilitychange', leer);
    return () => document.removeEventListener('visibilitychange', leer);
  }, []);

  // Tampoco si la galeria esta fuera de la pantalla.
  useEffect(() => {
    const el = raiz.current;
    if (!el || !('IntersectionObserver' in window)) {
      setFuera(false);
      return;
    }

    const observador = new IntersectionObserver(([e]) => setFuera(!e.isIntersecting), {
      threshold: 0.35,
    });
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  const detenido = mouse || foco || oculta || fuera || pausado;
  const rotando = !quieto && !detenido;

  // Flechas del teclado, cuando el foco esta adentro.
  const alTeclear = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') ir(actual + 1);
    if (e.key === 'ArrowLeft') ir(actual - 1);
  };

  // Fin de la barra: pasa a la siguiente. Se vuelve a mirar la preferencia
  // aca porque con "reducir movimiento" las animaciones duran 0,01 ms y, si la
  // barra llegara a montarse, avanzaria sin parar.
  const alLlenarse = (e: React.AnimationEvent) => {
    if (e.target !== e.currentTarget) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    ir(actual + 1);
  };

  return (
    <div
      ref={raiz}
      className="no-imprimir"
      onMouseEnter={() => setMouse(true)}
      onMouseLeave={() => setMouse(false)}
      // Solo el foco de TECLADO detiene el pase. Un clic en ‹ › tambien deja
      // el foco en el boton, y el pase quedaba congelado despues de que el
      // mouse ya se habia ido; con mouse, pausa el hover.
      onFocusCapture={(e) => {
        if ((e.target as Element).matches(':focus-visible')) setFoco(true);
      }}
      onBlurCapture={(e) => {
        // Pasar el foco de un boton a otro del pase no cuenta como salir.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFoco(false);
      }}
      onKeyDown={alTeclear}
    >
      {/* La cortina de entrada y el asentado viven en globals.css
          ([data-revelar="cortina"], .cortina y .asentar).

          El recorte va en .cortina y NO en el marco que se observa: Chrome no
          avisa que entro en pantalla un elemento recortado entero con
          clip-path, y la cortina no se abria nunca. */}
      <div data-revelar="cortina" className="relative aspect-[8/5] w-full">
        <div className="cortina absolute inset-0 overflow-hidden border border-regla bg-papel">
          <div className="asentar absolute inset-0">
            {laminas.map((l, i) => (
              <Image
                key={l.archivo}
                ref={(el) => {
                  imagenes.current[i] = el;
                }}
                src={`/proyectos/${l.archivo}`}
                alt={l.titulo}
                // Solo la lamina visible existe para un lector de pantalla; las
                // otras cinco estan apiladas debajo, transparentes.
                aria-hidden={i !== actual || undefined}
                fill
                // Las laminas son SVG dibujado: el optimizador no aporta nada y
                // ademas no las procesa.
                unoptimized
                priority={i === 0}
                sizes="(min-width: 768px) 700px, 100vw"
                className={[
                  'lamina object-cover',
                  i === actual ? 'lamina-actual' : i === previa ? 'lamina-previa' : '',
                ].join(' ')}
              />
            ))}
          </div>
        </div>
      </div>

      <div data-revelar="bloque">
        {/* Los puntos: tambien son botones, no adornos. Van PEGADOS a la imagen,
            que es de lo que son indice (antes quedaban debajo del pie, flotando
            en una franja vacia). La raya mide 2 px, el mismo idioma de las
            reglas de la hoja; el boton mide 22 para que se pueda tocar con un
            dedo. La del actual lleva el acento tenue desde el primer cuadro,
            antes de que la barra empiece a llenarse. */}
        <div className="flex gap-1.5">
          {laminas.map((l, i) => (
            <button
              key={l.archivo}
              type="button"
              onClick={() => ir(i)}
              aria-label={`Ver ${l.titulo}`}
              aria-current={i === actual}
              className="group flex-1 py-2.5"
            >
              <span
                className={[
                  'relative block h-0.5 overflow-hidden transition-colors duration-200',
                  i === actual ? 'bg-acento/25' : 'bg-regla group-hover:bg-gris',
                ].join(' ')}
              >
                {i === actual &&
                  (quieto ? (
                    <span className="absolute inset-0 bg-acento" />
                  ) : (
                    <span
                      key={actual}
                      className="barra-progreso absolute inset-0 bg-acento"
                      style={{
                        animationDuration: `${CADA}ms`,
                        animationPlayState: detenido ? 'paused' : 'running',
                      }}
                      onAnimationEnd={alLlenarse}
                    />
                  ))}
              </span>
            </button>
          ))}
        </div>

        {/* En el telefono el pie va entero arriba y los botones debajo, a la
            derecha: al lado de tres botones el pie quedaba en cuatro renglones
            de 200 px. */}
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          {/*
            Los seis pies estan apilados en la misma celda, y solo se ve el de
            la lamina actual. Asi el renglon mide siempre lo del pie mas largo:
            con un solo pie que cambiaba de texto, la pagina de abajo saltaba
            16-24 px en cada avance, sin que nadie tocara nada.

            El actual sube desde atras de su renglon al cambiar.
          */}
          <p aria-live={rotando ? 'off' : 'polite'} className="grid overflow-hidden text-gris">
            {laminas.map((l, i) => (
              <span
                key={i === actual ? `${l.archivo}-${actual}` : l.archivo}
                aria-hidden={i !== actual || undefined}
                className={[
                  '[grid-area:1/1]',
                  i === actual ? (cambio ? 'pie-entra' : '') : 'invisible',
                ].join(' ')}
              >
                <span className="font-semibold text-tinta">{l.titulo}</span> · {l.pie}
              </span>
            ))}
          </p>

          {/* Un solo control de tres partes: los bordes se comparten (-ml-px).
              Con 4 px entre cuadros se leia como un borde doble. */}
          <div className="flex shrink-0 items-center self-end sm:self-auto [&>button+button]:-ml-px">
            <button
              type="button"
              onClick={() => ir(actual - 1)}
              aria-label="Lámina anterior"
              className="pulsable size-10 border sm:size-8 border-regla hover:bg-mesa"
            >
              ‹
            </button>

            {/* Pausar: el pase se mueve solo y sin fin, y quien lee tiene que
                poder frenarlo (WCAG 2.2.2). Con "reducir movimiento" no avanza
                solo, asi que el boton no hace falta. */}
            {!quieto && (
              <button
                type="button"
                onClick={() => setPausado((p) => !p)}
                aria-label={pausado ? 'Reanudar el pase' : 'Pausar el pase'}
                className="pulsable grid size-10 place-items-center sm:size-8 border border-regla hover:bg-mesa"
              >
                <svg aria-hidden viewBox="0 0 10 10" className="size-2.5 fill-current">
                  {pausado ? <path d="M2 1l7 4-7 4z" /> : <path d="M2 1h2v8H2zM6 1h2v8H6z" />}
                </svg>
              </button>
            )}

            <button
              type="button"
              onClick={() => ir(actual + 1)}
              aria-label="Lámina siguiente"
              className="pulsable size-10 border sm:size-8 border-regla hover:bg-mesa"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
