// Señales de la placa madre: cometas cian que corren por las pistas de
// lib/placa.ts (las mismas del SVG del fondo, por eso van justo encima).
// Solo la lógica: nacer, avanzar y armar los puntos a dibujar. El dibujo lo hace
// el lienzo del anillo (lib/anillo.ts), y quién las llama, components/FondoAnillo.
//
// Coordenadas de placa = px desde la esquina del <main data-placa>: la baldosa se
// repite cada PLACA_ANCHO × PLACA_ALTO. Una señal vive en una repetición concreta
// (base) y no aparece en las demás.
//
// Ritmo (emil-kowalski:animate): movimiento en pantalla a velocidad constante
// (lineal), nace con un fundido corto de salida, y al llegar la vía se enciende y
// se apaga. Topes para que el fondo no compita con el contenido.

import { crearPlaca, PLACA_ALTO, PLACA_ANCHO, type Pista } from '@/lib/placa';

const VELOCIDAD = 280; // px/s
const ESTELA = 72; // px
const PUNTOS_ESTELA = 16; // cada 4,5 px: se lee como un trazo, no como cuentas
const NACE_S = 0.12;
const LLEGA_S = 0.24;
const MAX = 36;
const CURSOR_CADA_S = 0.07;
const CURSOR_MIN_PX = 18;
const CURSOR_RADIO = 70;
const RAFAGA = 6;
const RAFAGA_RADIO = 120;
const AMBIENTE_CADA_S = 0.45;
const AMBIENTE_RADIO = 120;
const CELDA = 32;

/** Por señal: halo + cabeza + estela + destello al llegar. */
export const SPRITES_POR_SENAL = 2 + PUNTOS_ESTELA + 1;
export const MAX_SPRITES = MAX * SPRITES_POR_SENAL;
/** Datos por sprite: x, y (px del lienzo), tamaño (px), alfa, dureza (0 suave, 1 nítido). */
export const DATOS_SPRITE = 5;

interface Senal {
  pista: number;
  /** Suma a las coordenadas de la pista: repetición de la baldosa y copia del borde. */
  bx: number;
  by: number;
  s: number;
  dir: 1 | -1;
  t0: number;
  /** Momento en que llegó al final; -1 mientras corre. */
  llegada: number;
}

interface Entrada {
  pista: number;
  tramo: number;
  ox: number;
  oy: number;
}

interface Cercana {
  pista: number;
  s: number;
  bx: number;
  by: number;
  d: number;
  tx: number;
  ty: number;
  qx: number;
  qy: number;
}

export interface Senales {
  /** El mouse se movió: (x, y) en coordenadas de placa, (vx, vy) su desplazamiento. */
  desdeCursor(x: number, y: number, vx: number, vy: number, t: number): void;
  /** Un clic: ráfaga desde las pistas cercanas. */
  rafaga(x: number, y: number, t: number): void;
  /** Una de ambiente dentro del rectángulo visible de la placa. */
  ambiente(x0: number, y0: number, x1: number, y1: number, t: number): void;
  avanzar(dt: number, t: number): void;
  /**
   * Escribe los sprites en `out` y devuelve cuántos. (ox, oy): esquina de la
   * placa en px del lienzo; entre clip0 y clip1 (y del lienzo) se ve la placa.
   */
  sprites(out: Float32Array, ox: number, oy: number, clip0: number, clip1: number, t: number): number;
  activas(): number;
}

const salida = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

function puntoEn(p: Pista, s: number): [number, number, number, number] {
  const s1 = Math.min(p.largo, Math.max(0, s));
  let lo = 0;
  let hi = p.acumulado.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (p.acumulado[m] <= s1) lo = m;
    else hi = m;
  }
  const [ax, ay] = p.puntos[lo];
  const [bx, by] = p.puntos[hi];
  const l = p.acumulado[hi] - p.acumulado[lo] || 1;
  const f = (s1 - p.acumulado[lo]) / l;
  return [ax + (bx - ax) * f, ay + (by - ay) * f, (bx - ax) / l, (by - ay) / l];
}

export function crearSenales(): Senales {
  const { pistas } = crearPlaca();
  const cols = PLACA_ANCHO / CELDA;
  const filas = PLACA_ALTO / CELDA;
  const rejilla: Entrada[][] = Array.from({ length: cols * filas }, () => []);

  // Cada tramo se anota en las celdas que toca, con el desplazamiento que lo
  // trae a esa celda si cruza el borde de la baldosa.
  pistas.forEach((p, pista) => {
    for (let tramo = 0; tramo < p.puntos.length - 1; tramo++) {
      const [ax, ay] = p.puntos[tramo];
      const [bx, by] = p.puntos[tramo + 1];
      const pasos = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / (CELDA / 2)));
      const vistas = new Set<number>();
      for (let k = 0; k <= pasos; k++) {
        const x = ax + ((bx - ax) * k) / pasos;
        const y = ay + ((by - ay) * k) / pasos;
        const cx = Math.floor(x / CELDA);
        const cy = Math.floor(y / CELDA);
        const wx = ((cx % cols) + cols) % cols;
        const wy = ((cy % filas) + filas) % filas;
        const i = wy * cols + wx;
        if (vistas.has(i)) continue;
        vistas.add(i);
        rejilla[i].push({ pista, tramo, ox: (wx - cx) * CELDA, oy: (wy - cy) * CELDA });
      }
    }
  });

  /** Pistas cercanas a (x, y) en coordenadas de placa, la más cercana de cada una. */
  const cercanas = (x: number, y: number, radio: number): Cercana[] => {
    const rx = Math.floor(x / PLACA_ANCHO) * PLACA_ANCHO;
    const ry = Math.floor(y / PLACA_ALTO) * PLACA_ALTO;
    const lx = x - rx;
    const ly = y - ry;
    const r = Math.ceil(radio / CELDA);
    const cx0 = Math.floor(lx / CELDA);
    const cy0 = Math.floor(ly / CELDA);
    const mejor = new Map<number, Cercana>();
    for (let cy = cy0 - r; cy <= cy0 + r; cy++) {
      for (let cx = cx0 - r; cx <= cx0 + r; cx++) {
        // celdas fuera de la baldosa: la de al lado (y su desplazamiento)
        const wx = ((cx % cols) + cols) % cols;
        const wy = ((cy % filas) + filas) % filas;
        const sx = (cx - wx) * CELDA;
        const sy = (cy - wy) * CELDA;
        for (const e of rejilla[wy * cols + wx]) {
          const p = pistas[e.pista];
          const ox = e.ox + sx;
          const oy = e.oy + sy;
          const [ax, ay] = p.puntos[e.tramo];
          const [bx, by] = p.puntos[e.tramo + 1];
          const ux = bx - ax;
          const uy = by - ay;
          const l2 = ux * ux + uy * uy || 1;
          const f = Math.min(1, Math.max(0, ((lx - ox - ax) * ux + (ly - oy - ay) * uy) / l2));
          const qx = ax + ux * f + ox;
          const qy = ay + uy * f + oy;
          const d = Math.hypot(lx - qx, ly - qy);
          if (d > radio) continue;
          const previa = mejor.get(e.pista);
          if (previa && previa.d <= d) continue;
          const l = Math.sqrt(l2);
          mejor.set(e.pista, {
            pista: e.pista,
            s: p.acumulado[e.tramo] + f * l,
            bx: rx + ox,
            by: ry + oy,
            d,
            tx: ux / l,
            ty: uy / l,
            qx: rx + qx,
            qy: ry + qy,
          });
        }
      }
    }
    return [...mejor.values()].sort((a, b) => a.d - b.d);
  };

  const vivas: Senal[] = [];
  let tCursor = -1;
  let xCursor = 0;
  let yCursor = 0;
  let tAmbiente = -1;

  const nacer = (c: Cercana, dir: 1 | -1, t: number) => {
    if (vivas.length >= MAX) return;
    const p = pistas[c.pista];
    // si nace pegada al final hacia el que va, no se ve: sale para el otro lado
    const queda = dir > 0 ? p.largo - c.s : c.s;
    const d = queda < ESTELA ? ((-dir) as 1 | -1) : dir;
    vivas.push({ pista: c.pista, bx: c.bx, by: c.by, s: c.s, dir: d, t0: t, llegada: -1 });
  };

  return {
    desdeCursor(x, y, vx, vy, t) {
      if (t - tCursor < CURSOR_CADA_S || Math.hypot(x - xCursor, y - yCursor) < CURSOR_MIN_PX) return;
      tCursor = t;
      xCursor = x;
      yCursor = y;
      const [c] = cercanas(x, y, CURSOR_RADIO);
      if (!c) return;
      // corre hacia donde va el mouse (lo empuja); si va de través, se aleja del cursor
      let dir = Math.sign(c.tx * vx + c.ty * vy);
      if (Math.abs(c.tx * vx + c.ty * vy) < 0.3 * Math.hypot(vx, vy)) dir = Math.sign(c.tx * (c.qx - x) + c.ty * (c.qy - y));
      nacer(c, dir < 0 ? -1 : 1, t);
    },

    rafaga(x, y, t) {
      const lista = cercanas(x, y, RAFAGA_RADIO).slice(0, RAFAGA);
      lista.forEach((c, i) => {
        const aleja = Math.sign(c.tx * (c.qx - x) + c.ty * (c.qy - y));
        nacer(c, (aleja === 0 ? (i % 2 ? 1 : -1) : aleja) as 1 | -1, t);
      });
    },

    ambiente(x0, y0, x1, y1, t) {
      if (t - tAmbiente < AMBIENTE_CADA_S || x1 <= x0 || y1 <= y0) return;
      tAmbiente = t;
      const lista = cercanas(x0 + Math.random() * (x1 - x0), y0 + Math.random() * (y1 - y0), AMBIENTE_RADIO);
      if (lista.length) nacer(lista[0], Math.random() < 0.5 ? 1 : -1, t);
    },

    avanzar(dt, t) {
      for (let i = vivas.length - 1; i >= 0; i--) {
        const v = vivas[i];
        if (v.llegada < 0) {
          const p = pistas[v.pista];
          v.s += v.dir * VELOCIDAD * dt;
          if (v.s >= p.largo || v.s <= 0) {
            v.s = Math.min(p.largo, Math.max(0, v.s));
            v.llegada = t;
          }
        } else if (t - v.llegada > LLEGA_S) {
          vivas.splice(i, 1);
        }
      }
    },

    sprites(out, ox, oy, clip0, clip1, t) {
      let n = 0;
      const poner = (x: number, y: number, tam: number, alfa: number, dureza: number) => {
        if (alfa < 0.01 || y < clip0 - tam || y > clip1 + tam) return;
        const i = n * DATOS_SPRITE;
        out[i] = x;
        out[i + 1] = y;
        out[i + 2] = tam;
        out[i + 3] = alfa;
        out[i + 4] = dureza;
        n++;
      };
      for (const v of vivas) {
        const p = pistas[v.pista];
        const nace = salida((t - v.t0) / NACE_S);
        const llega = v.llegada < 0 ? 0 : Math.min(1, (t - v.llegada) / LLEGA_S);
        const a = nace * (1 - llega);
        const x0 = v.bx + ox;
        const y0 = v.by + oy;
        const [hx, hy] = puntoEn(p, v.s);
        // estela: del más lejano al más cercano, así la cabeza queda encima
        for (let k = PUNTOS_ESTELA; k >= 1; k--) {
          const [ex, ey] = puntoEn(p, v.s - v.dir * k * (ESTELA / PUNTOS_ESTELA));
          poner(ex + x0, ey + y0, 5 - k * 0.2, 0.8 * (1 - k / (PUNTOS_ESTELA + 1)) * a, 1);
        }
        poner(hx + x0, hy + y0, 24, 0.38 * a, 0);
        poner(hx + x0, hy + y0, 7, 1 * a, 1);
        // al llegar, la vía se enciende y se apaga
        if (llega > 0) poner(hx + x0, hy + y0, 8 + 16 * salida(llega), 0.6 * (1 - llega), 0);
      }
      return n;
    },

    activas: () => vivas.length,
  };
}
