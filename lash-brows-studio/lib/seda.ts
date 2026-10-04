/**
 * La seda del hero: el lienzo diminuto que se estira a pantalla completa.
 *
 * Cuatro hebras de gradiente radial, achatadas, que se cruzan muy despacio y se
 * doblan con la velocidad del scroll. Se dibujan en un lienzo de 200 px de
 * ancho y el navegador lo escala a toda la pantalla: a esa resolución el costo
 * por cuadro es despreciable (medido: 0,13-0,19 ms) y el propio escalado es lo
 * que da el aspecto de seda. Por eso acá NO hay `filter: blur()`, que en un
 * teléfono de gama baja cuesta un desenfoque de pantalla completa por cuadro.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EL TOPE DE TINTE NO ES DECORATIVO: ES LO QUE MANTIENE EL CONTRASTE
 *
 * El aura ya estaba al borde (gold-ink de las estrellas en 3.24 sobre un mínimo
 * de 3). Así que la seda NO agrega tinte: lo reemplaza. Mientras se ve el hero,
 * `--salida` baja las manchas del aura al 30 % y sube la seda; al salir del
 * hero pasa lo contrario. El peor píxel posible de este módulo está acotado por
 * construcción:
 *
 *   dos hebras sand  al 22 %
 *   una  hebra  blush al 16 %
 *   una  hebra  rose  al  8 %
 *
 * Las cuatro juntas dan un tope de 53 %. Ese apilado, encima del aura al 30 %,
 * da mocha 4.76, que es el máximo que permite el colchón del proyecto (4.5 más
 * 0.15).
 *
 * ESTOS ALFAS SON DEL 19-9-2026 Y SUBIERON UN 60 % POR UNA RAZÓN CONCRETA: las
 * estrellas de la calificación del hero salieron del fondo. Eran gold-ink sobre
 * el aura, 3.24 contra un mínimo de 3, y mientras estuvieran ahí eran EL TECHO
 * de todo. Ahora van sobre una pastilla opaca (components/Hero.tsx) y el que
 * limita pasó a ser el texto mocha —la bajada del hero y la bajada del
 * encabezado, que a scroll 0 está sobre esta misma seda—. Los alfas están duplicados en `scripts/check-contrast.mjs`, que falla
 * con exit 1 si alguien los sube. **Si acá se agrega una hebra o se sube un
 * alfa, hay que tocar el script y volver a medir.**
 *
 * SON CUATRO Y GRANDES, Y ESO NO ES CASUAL. La cuenta del contraste sólo mira
 * el PEOR caso —las cuatro cruzadas en el mismo píxel—, así que el tope no
 * depende del tamaño de las hebras ni de cuántas haya: depende de los alfas.
 * Lo que el ojo ve, en cambio, es el PROMEDIO. Con seis hebras finas el tope
 * era el mismo y la alfa típica medida era 0.02: se gastaba todo el presupuesto
 * en un pico que casi nunca pasaba y el hero quedaba más pálido que antes. Con
 * cuatro hebras grandes la típica sube a 0.139 con el MISMO peor caso. Medido
 * con getImageData sobre el lienzo real, no estimado.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Lo que el componente de scroll actualiza en cada cuadro. */
export type Estado = {
  /** 0 en el tope de la página, 1 cuando el hero ya salió. */
  salida: number;
  /** Velocidad de scroll con signo, en px por cuadro. La consume el dibujo. */
  velocidad: number;
};

export type Seda = {
  despertar: () => void;
  detener: () => void;
  marca: { cuadros: number; ms: number };
};

/** Ancho del lienzo real. Todo lo demás se escala desde acá. */
const ANCHO = 200;

/** Ancho de pantalla al que están calibradas las frecuencias: un teléfono. */
const ANCHO_BASE = 390;

/**
 * Las cuatro hebras. `alfa` es el tope de cada una y no se toca sin volver a
 * medir (ver el encabezado). `fx`/`fy` son vueltas por segundo A 390 px DE
 * ANCHO; en pantallas más anchas se dividen (ver `factorVelocidad`).
 */
const HEBRAS = [
  { color: "sand", alfa: 0.22, radio: 0.82, achate: 0.62, fx: 0.0204, fy: 0.0126, ax: 0.3, ay: 0.26, fase: 0, arrastre: 1 },
  { color: "sand", alfa: 0.22, radio: 0.68, achate: 0.54, fx: 0.0136, fy: 0.0185, ax: 0.34, ay: 0.22, fase: 2.1, arrastre: -0.8 },
  { color: "blush", alfa: 0.16, radio: 0.58, achate: 0.58, fx: 0.0253, fy: 0.0107, ax: 0.36, ay: 0.28, fase: 4, arrastre: 1.7 },
  { color: "rose", alfa: 0.08, radio: 0.46, achate: 0.5, fx: 0.0282, fy: 0.0156, ax: 0.38, ay: 0.3, fase: 3.3, arrastre: -2.2 },
];

/** Un cuadro cada 33 ms: uno de cada dos a 60 Hz, cadencia estable. */
const MS_POR_CUADRO = 33;

/** Cuánto se consume el impulso del scroll en cada cuadro dibujado. */
const FRENO = 0.8;

/**
 * La amplitud de una hebra es una fracción del lienzo, y el lienzo se estira a
 * todo el ancho de la pantalla: sin corregir, el pico horizontal es
 * `2π · fx · ax · anchoDeLaPantalla`, o sea 28 px/s en un teléfono y 103 px/s
 * en una laptop. El sitio ya midió y fijó su techo para el fondo ambiental
 * —15 px/s, "no compite con ninguna interacción", en el bloque de
 * `--ease-vaiven` de globals.css—, y 103 px/s al lado del botón de WhatsApp lo
 * rompe siete veces. Esto lo deja en ~15 px/s en cualquier pantalla.
 */
function factorVelocidad() {
  const ancho = Math.max(360, Math.min(1920, window.innerWidth || ANCHO_BASE));
  return ANCHO_BASE / ancho;
}

/** Lee un color de la paleta del sitio: una sola fuente de verdad. */
function color(nombre: string) {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-" + nombre)
    .trim();
  return v || "#efe4da";
}

/** Convierte #rrggbb a "r, g, b" para poder pegarle el alfa. */
function canales(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(", ");
}

export function arrancar(
  hueco: HTMLElement,
  estado: Estado,
  alPrimerCuadro?: () => void,
): Seda | null {
  const lienzo = document.createElement("canvas");
  lienzo.setAttribute("aria-hidden", "true");
  const ctx = lienzo.getContext("2d", { alpha: true });
  if (!ctx) return null;

  const tonos = HEBRAS.map((h) => canales(color(h.color)));
  const reducido = window.matchMedia("(prefers-reduced-motion: reduce)");
  /* Sólo en local: son dos lecturas de reloj por cuadro que en el VPS no lee
     nadie, y la variable global que las expone tampoco existe allá. */
  const diagnostico = window.location.hostname === "localhost";

  let alto = ANCHO;
  let medido = false;
  const medir = () => {
    /* La proporción sale de la CAJA, no de window: la capa mide 100svh y eso
       NO cambia cuando el teléfono esconde la barra de direcciones. Con
       innerHeight, cada aparición de la barra estiraba las hebras. */
    const ancho = hueco.clientWidth || window.innerWidth;
    const altoCaja = hueco.clientHeight || window.innerHeight;
    /* En una pestaña que arranca en SEGUNDO PLANO la caja mide 0 y también
       window: medido en producción, ahí el lienzo quedaba cuadrado (200x200 en
       una pantalla de 1280x720) hasta el próximo resize. No se puede medir
       todavía, así que no se mide: se reintenta en el primer cuadro, que por
       definición ocurre con la pestaña a la vista. */
    if (!ancho || !altoCaja) return;
    const nuevo = Math.round(Math.min(2, Math.max(0.5, altoCaja / ancho)) * ANCHO);
    medido = true;
    /* Asignar width/height REINICIA el mapa de bits aunque el valor no cambie:
       en el teléfono, cada resize de la barra de direcciones borraba el cuadro
       y la seda parpadeaba. */
    if (nuevo === alto && lienzo.width === ANCHO) return;
    alto = nuevo;
    lienzo.width = ANCHO;
    lienzo.height = alto;
  };
  medir();
  hueco.appendChild(lienzo);

  let corriendo = true;
  let pedido = 0;
  let ultimoCuadro = 0;
  let primero = true;
  /* Cuánto se doblan las hebras ahora mismo. Persigue a estado.velocidad con
     retraso: lo que se siente como una corriente es la vuelta lenta. */
  let corriente = 0;
  /* Fase acumulada por hebra, en radianes. NO se calcula como `f × tiempo`: la
     frecuencia cambia con el ancho de la pantalla, y el bucle se corta al salir
     del hero o al esconder la pestaña. Con la fase acumulada, ni un resize ni
     una pausa de dos minutos mueven a las hebras de donde estaban. */
  const fase = HEBRAS.map((h) => ({ x: h.fase, y: h.fase * 1.7 }));
  const marca = { cuadros: 0, ms: 0 };

  function dibujar(t: number) {
    pedido = 0;
    if (!corriendo) return;

    /* Debajo del hero no hay nada que dibujar y la capa ya está en opacidad 0.
       Se corta el bucle y lo vuelven a encender el scroll o la pestaña. Con
       movimiento reducido, igual: el CSS esconde la capa, pero dibujar cuatro
       gradientes que nadie ve sigue gastando batería. */
    if (estado.salida >= 0.999 || document.hidden || reducido.matches) return;

    /* Acá abajo la pestaña está a la vista por definición, así que la caja ya
       tiene tamaño: es el momento de medir si no se pudo antes. */
    if (!medido) medir();

    const transcurrido = ultimoCuadro ? t - ultimoCuadro : MS_POR_CUADRO;
    if (transcurrido >= MS_POR_CUADRO) {
      const t0 = diagnostico ? performance.now() : 0;
      /* Acotado a dos cuadros: si la pestaña estuvo escondida un minuto, el
         primer cuadro al volver no adelanta un minuto de movimiento. */
      const dt = Math.min(transcurrido, MS_POR_CUADRO * 2) / 1000;
      const vel = factorVelocidad();

      corriente += (estado.velocidad - corriente) * 0.08;
      /* El impulso se consume acá y no en el oyente de scroll: si no, al soltar
         el dedo la velocidad quedaba clavada en su último valor y las hebras se
         quedaban dobladas para siempre. A 30 cuadros por segundo, un impulso de
         60 px baja de 1 px en unos 400 ms, que es la vuelta lenta que se busca. */
      estado.velocidad *= FRENO;

      ctx!.clearRect(0, 0, ANCHO, alto);
      for (let i = 0; i < HEBRAS.length; i++) {
        const h = HEBRAS[i];
        fase[i].x += 2 * Math.PI * h.fx * vel * dt;
        fase[i].y += 2 * Math.PI * h.fy * vel * dt;

        const cx = (0.5 + h.ax * Math.sin(fase[i].x)) * ANCHO + corriente * h.arrastre * 0.9;
        const cy = (0.5 + h.ay * Math.sin(fase[i].y)) * alto - corriente * h.arrastre * 0.35;
        /* El radio se mide contra el lado MAYOR: con el ancho, en un teléfono
           —lienzo de 200x400— las hebras cubrían la mitad que en escritorio y
           la seda quedaba pálida (alfa típica 0.053 contra 0.138). */
        const r = h.radio * Math.max(ANCHO, alto);

        const grad = ctx!.createRadialGradient(0, 0, 0, 0, 0, r);
        grad.addColorStop(0, "rgba(" + tonos[i] + ", " + h.alfa + ")");
        grad.addColorStop(0.42, "rgba(" + tonos[i] + ", " + h.alfa * 0.62 + ")");
        grad.addColorStop(1, "rgba(" + tonos[i] + ", 0)");

        ctx!.save();
        ctx!.translate(cx, cy);
        /* Achatadas: una hebra de seda es ancha y baja, no una pelota. Cada una
           trae su propio achatado para que no se lean como un patrón. */
        ctx!.scale(1, h.achate);
        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.arc(0, 0, r, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }
      ultimoCuadro = t;
      if (diagnostico) {
        marca.cuadros++;
        marca.ms += performance.now() - t0;
      }
      /* Recién ahora hay algo pintado, así que recién ahora el aura puede
         empezar a bajar. Antes de esto, bajarla dejaba el hero más pálido que
         el fondo de siempre durante los dos segundos de espera. */
      if (primero) {
        primero = false;
        alPrimerCuadro?.();
      }
    }
    pedido = requestAnimationFrame(dibujar);
  }

  function despertar() {
    if (!corriendo || pedido) return;
    pedido = requestAnimationFrame(dibujar);
  }

  const alRedimensionar = () => {
    medir();
    despertar();
  };

  function detener() {
    corriendo = false;
    if (pedido) cancelAnimationFrame(pedido);
    lienzo.remove();
    window.removeEventListener("resize", alRedimensionar);
    document.removeEventListener("visibilitychange", alRedimensionar);
    reducido.removeEventListener("change", despertar);
  }

  window.addEventListener("resize", alRedimensionar, { passive: true });
  document.addEventListener("visibilitychange", alRedimensionar);
  /* Si la persona APAGA el movimiento reducido con la página abierta, el bucle
     tiene que volver a encenderse solo. */
  reducido.addEventListener("change", despertar);

  despertar();
  return { despertar, detener, marca };
}
