// Placa madre de fondo de la portada (pedido del dueño, 27-9-2026: "que el fondo
// se mueva como una placa madre, con los colores del logo").
// Con una semilla fija arma una baldosa de 1600 × 2400 px que se repite sin
// costura: buses de pistas con esquinas a 45°, chips con patas, zócalos tipo RAM,
// componentes chicos, vías y la huella del conector D-sub del logo.
// - El servidor la sirve como SVG (app/placa-clara.svg, app/placa-oscura.svg).
// - El cliente usa las mismas pistas para las señales (lib/senales.ts).
// Por eso no toca el DOM ni usa Math.random: los dos lados tienen que dar
// exactamente la misma placa.

import { LOGO_CARCASA, LOGO_PINES, LOGO_PIN_ACTIVO, LOGO_RADIO_PIN } from '@/lib/logo';

export const PLACA_ANCHO = 1600;
export const PLACA_ALTO = 2400;
/** Rejilla: todo nace en múltiplos de 8 px, como un ruteo de verdad. */
const G = 8;
const COLS = PLACA_ANCHO / G;
const FILAS = PLACA_ALTO / G;
const SEMILLA = 27092026;

export type Punto = [number, number];

export interface Pista {
  puntos: Punto[];
  /** Largo acumulado hasta cada punto. */
  acumulado: number[];
  largo: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Chip extends Rect {
  tipo: 'cpu' | 'qfp' | 'soic' | 'ram';
}

export interface Via {
  x: number;
  y: number;
  /** Pin con señal: cian, como el del logo. */
  senal: boolean;
}

export interface Placa {
  pistas: Pista[];
  chips: Chip[];
  /** Patas de chips, pads de componentes y contactos de los zócalos. */
  patas: Rect[];
  vias: Via[];
  /** Esquina superior izquierda de cada huella del conector del logo (32 × 4 px). */
  conectores: Punto[];
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

// mulberry32: rápido, determinista y suficiente para esto.
function crearAzar(semilla: number) {
  let a = semilla | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Ocho direcciones, de 45° en 45°. Girar = sumar o restar 1.
const DIRS: Punto[] = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
];
const unidad = (d: number): Punto => {
  const [x, y] = DIRS[mod(d, 8)];
  const l = Math.hypot(x, y);
  return [x / l, y / l];
};
// normal a la izquierda de la dirección (en pantalla, con y hacia abajo)
const normal = (d: number): Punto => {
  const [x, y] = unidad(d);
  return [y, -x];
};

/** Ocupación de la rejilla, en toro: lo que sale por un borde entra por el otro. */
class Ocupacion {
  private o = new Uint8Array(COLS * FILAS);
  private i(nx: number, ny: number) {
    return mod(ny, FILAS) * COLS + mod(nx, COLS);
  }
  libre(nx: number, ny: number) {
    return this.o[this.i(nx, ny)] === 0;
  }
  marcar(nx: number, ny: number) {
    this.o[this.i(nx, ny)] = 1;
  }
  rectLibre(nx: number, ny: number, w: number, h: number) {
    for (let y = ny; y < ny + h; y++) for (let x = nx; x < nx + w; x++) if (!this.libre(x, y)) return false;
    return true;
  }
  marcarRect(nx: number, ny: number, w: number, h: number) {
    for (let y = ny; y < ny + h; y++) for (let x = nx; x < nx + w; x++) this.marcar(x, y);
  }
  /** Un punto en px está libre si su nodo y los cuatro vecinos lo están (deja un nodo de aire). */
  puntoLibre(x: number, y: number) {
    const nx = Math.round(x / G);
    const ny = Math.round(y / G);
    return this.libre(nx, ny) && this.libre(nx + 1, ny) && this.libre(nx - 1, ny) && this.libre(nx, ny + 1) && this.libre(nx, ny - 1);
  }
  marcarPunto(x: number, y: number) {
    this.marcar(Math.round(x / G), Math.round(y / G));
  }
}

function medir(puntos: Punto[]): Pista {
  const acumulado = [0];
  for (let i = 1; i < puntos.length; i++) {
    acumulado.push(acumulado[i - 1] + Math.hypot(puntos[i][0] - puntos[i - 1][0], puntos[i][1] - puntos[i - 1][1]));
  }
  return { puntos, acumulado, largo: acumulado[acumulado.length - 1] };
}

interface Ctx {
  azar: () => number;
  oc: Ocupacion;
  placa: Placa;
  /** Vías del final de los buses: de ahí salen los pines con señal. */
  finales: Via[];
}

const entre = (azar: () => number, a: number, b: number) => a + Math.floor(azar() * (b - a + 1));

/**
 * Tiende un bus de n pistas paralelas (8 px entre sí) desde `inicio` (las puntas
 * de las patas, ordenadas sobre la normal de d0). La línea central avanza por
 * tramos rectos y codos de 45°; cada pista es su desplazamiento con inglete, así
 * la separación se mantiene también en las diagonales. Si choca, se corta ahí.
 * Los primeros `libres` pasos no se comprueban: salen de su propio chip.
 */
function bus(ctx: Ctx, inicio: Punto[], d0: number, conVias = true, libres = 2): boolean {
  const { azar, oc } = ctx;
  const n = inicio.length;
  const c0: Punto = [inicio.reduce((s, p) => s + p[0], 0) / n, inicio.reduce((s, p) => s + p[1], 0) / n];
  const desp = inicio.map((_, j) => (j - (n - 1) / 2) * G);

  // Plan de tramos: [dirección, pasos]
  const plan: Array<[number, number]> = [[d0, entre(azar, libres + 1, libres + 12)]];
  let d = d0;
  const codos = entre(azar, 1, 3);
  const diagMin = Math.ceil(n / 2) + 1;
  for (let k = 0; k < codos; k++) {
    const s = azar() < 0.5 ? 1 : -1;
    const d1 = d + s;
    plan.push([d1, entre(azar, diagMin, diagMin + 4)]);
    // Dos codos del mismo lado: vuelta de 90°. De lados opuestos: un escalón.
    const d2 = azar() < 0.65 ? d1 + s : d1 - s;
    plan.push([d2, entre(azar, 6, 32)]);
    d = d2;
  }

  // Avanzar paso a paso comprobando todo el ancho del bus.
  const vertices: Punto[] = [c0];
  const dirs: number[] = [];
  let c: Punto = [c0[0], c0[1]];
  let pasosTotales = 0;
  let choco = false;
  for (const [dir, pasos] of plan) {
    const [ux, uy] = unidad(dir);
    const [nx, ny] = normal(dir);
    const [dx, dy] = DIRS[mod(dir, 8)];
    const paso = dx !== 0 && dy !== 0 ? G * Math.SQRT2 : G;
    let hechos = 0;
    for (let k = 0; k < pasos; k++) {
      const sig: Punto = [c[0] + ux * paso, c[1] + uy * paso];
      if (pasosTotales >= libres && desp.some((o) => !oc.puntoLibre(sig[0] + nx * o, sig[1] + ny * o))) {
        choco = true;
        break;
      }
      c = sig;
      hechos++;
      pasosTotales++;
    }
    if (hechos) {
      vertices.push([c[0], c[1]]);
      dirs.push(dir);
    }
    if (choco) break;
  }
  // Un bus que no llegó a salir de su chip no se dibuja.
  if (pasosTotales <= libres) return false;
  return terminarBus(ctx, vertices, dirs, desp, conVias);
}

function terminarBus(ctx: Ctx, vertices: Punto[], dirs: number[], desp: number[], conVias: boolean): boolean {
  const { oc, placa } = ctx;
  if (dirs.length === 0) return false;
  const pistas: Punto[][] = desp.map((o) => {
    const pts: Punto[] = [];
    for (let k = 0; k < vertices.length; k++) {
      const [vx, vy] = vertices[k];
      if (k === 0 || k === vertices.length - 1) {
        const [nx, ny] = normal(dirs[k === 0 ? 0 : dirs.length - 1]);
        pts.push([vx + nx * o, vy + ny * o]);
      } else {
        const [ax, ay] = normal(dirs[k - 1]);
        const [bx, by] = normal(dirs[k]);
        let mx = ax + bx;
        let my = ay + by;
        const ml = Math.hypot(mx, my) || 1;
        mx /= ml;
        my /= ml;
        const f = o / (mx * bx + my * by);
        pts.push([vx + mx * f, vy + my * f]);
      }
    }
    return pts;
  });
  // Escalonar los finales: las pistas impares terminan un nodo antes, así las
  // vías vecinas no se tocan.
  const ultima = dirs[dirs.length - 1];
  const [ux, uy] = unidad(ultima);
  pistas.forEach((pts, j) => {
    if (j % 2 === 1) {
      const p = pts[pts.length - 1];
      const q = pts[pts.length - 2];
      const l = Math.hypot(p[0] - q[0], p[1] - q[1]);
      if (l > G * 1.5) pts[pts.length - 1] = [p[0] - ux * G, p[1] - uy * G];
    }
  });
  for (const pts of pistas) {
    const pista = medir(pts);
    if (pista.largo < G * 2) continue;
    placa.pistas.push(pista);
    // marcar la ocupación cada 4 px
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      const pasos = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 4));
      for (let s = 0; s <= pasos; s++) oc.marcarPunto(ax + ((bx - ax) * s) / pasos, ay + ((by - ay) * s) / pasos);
    }
    if (conVias) {
      const [ex, ey] = pts[pts.length - 1];
      const via = { x: ex, y: ey, senal: false };
      placa.vias.push(via);
      ctx.finales.push(via);
    }
  }
  return true;
}

/** Busca un lugar libre de w × h nodos con margen; lo marca y devuelve la esquina en nodos. */
function colocar(ctx: Ctx, w: number, h: number, margen: number): Punto | null {
  const { azar, oc } = ctx;
  for (let intento = 0; intento < 400; intento++) {
    const nx = Math.floor(azar() * COLS);
    const ny = Math.floor(azar() * FILAS);
    if (oc.rectLibre(nx - margen, ny - margen, w + 2 * margen, h + 2 * margen)) {
      oc.marcarRect(nx - 1, ny - 1, w + 2, h + 2);
      return [nx, ny];
    }
  }
  return null;
}

type Lado = 'arriba' | 'abajo' | 'izquierda' | 'derecha';
const DIR_LADO: Record<Lado, number> = { derecha: 0, abajo: 2, izquierda: 4, arriba: 6 };

/** Puntas de las patas de un lado del chip (px), ordenadas sobre la normal de la salida. */
function puntasDelLado(r: Rect, lado: Lado, largoPata: number): Punto[] {
  const pts: Punto[] = [];
  if (lado === 'arriba' || lado === 'abajo') {
    const y = lado === 'arriba' ? r.y - largoPata : r.y + r.h + largoPata;
    for (let x = r.x + G; x < r.x + r.w; x += G) pts.push([x, y]);
  } else {
    const x = lado === 'izquierda' ? r.x - largoPata : r.x + r.w + largoPata;
    for (let y = r.y + G; y < r.y + r.h; y += G) pts.push([x, y]);
  }
  // ordenar sobre la normal de la dirección de salida (así cuadran los desplazamientos)
  const [nx, ny] = normal(DIR_LADO[lado]);
  return pts.sort((a, b) => a[0] * nx + a[1] * ny - (b[0] * nx + b[1] * ny));
}

function patasDelLado(ctx: Ctx, r: Rect, lado: Lado, largo: number) {
  const ancho = 3;
  if (lado === 'arriba' || lado === 'abajo') {
    const y = lado === 'arriba' ? r.y - largo : r.y + r.h;
    for (let x = r.x + G; x < r.x + r.w; x += G) ctx.placa.patas.push({ x: x - ancho / 2, y, w: ancho, h: largo });
  } else {
    const x = lado === 'izquierda' ? r.x - largo : r.x + r.w;
    for (let y = r.y + G; y < r.y + r.h; y += G) ctx.placa.patas.push({ x, y: y - ancho / 2, w: largo, h: ancho });
  }
}

/** Saca de un lado del chip `cuantos` buses de 3 a `maxN` pistas, sin pisarse. */
function busesDelLado(ctx: Ctx, r: Rect, lado: Lado, largoPata: number, cuantos: number, minN: number, maxN: number) {
  const puntas = puntasDelLado(r, lado, largoPata);
  const usadas = new Uint8Array(puntas.length);
  for (let b = 0; b < cuantos; b++) {
    const n = entre(ctx.azar, minN, maxN);
    if (puntas.length < n + 2) return;
    for (let intento = 0; intento < 12; intento++) {
      const s = entre(ctx.azar, 1, puntas.length - n - 1);
      let libre = true;
      for (let j = s - 1; j <= s + n; j++) if (usadas[j]) libre = false;
      if (!libre) continue;
      for (let j = s; j < s + n; j++) usadas[j] = 1;
      bus(ctx, puntas.slice(s, s + n), DIR_LADO[lado]);
      break;
    }
  }
}

function chip(ctx: Ctx, tipo: Chip['tipo'], wN: number, hN: number): void {
  const pos = colocar(ctx, wN, hN, tipo === 'cpu' ? 6 : 4);
  if (!pos) return;
  const r: Chip = { tipo, x: pos[0] * G, y: pos[1] * G, w: wN * G, h: hN * G };
  ctx.placa.chips.push(r);
  const lados: Lado[] = tipo === 'soic' ? ['izquierda', 'derecha'] : tipo === 'ram' ? ['arriba', 'abajo'] : ['arriba', 'abajo', 'izquierda', 'derecha'];
  const largoPata = tipo === 'ram' ? 0 : 5;
  for (const lado of lados) {
    if (largoPata) patasDelLado(ctx, r, lado, largoPata);
    if (tipo === 'cpu') busesDelLado(ctx, r, lado, largoPata, 2, 4, 6);
    else if (tipo === 'ram') busesDelLado(ctx, r, lado, 2, 3, 4, 6);
    else if (tipo === 'qfp' && ctx.azar() < 0.85) busesDelLado(ctx, r, lado, largoPata, 1, 3, 5);
    else if (tipo === 'soic') busesDelLado(ctx, r, lado, largoPata, 1, 3, 4);
  }
}

/** Dos zócalos tipo RAM, juntos y paralelos; los buses salen de los lados de afuera. */
function zocalos(ctx: Ctx) {
  const pos = colocar(ctx, 72, 13, 6);
  if (!pos) return;
  const arriba: Chip = { tipo: 'ram', x: pos[0] * G, y: pos[1] * G, w: 72 * G, h: 5 * G };
  const abajo: Chip = { ...arriba, y: arriba.y + 8 * G };
  for (const [r, lado] of [[arriba, 'arriba'], [abajo, 'abajo']] as Array<[Chip, Lado]>) {
    ctx.placa.chips.push(r);
    busesDelLado(ctx, r, lado, 2, 4, 4, 6);
    for (let x = r.x + G; x < r.x + r.w - G / 2; x += G) {
      ctx.placa.patas.push({ x: x - 1, y: r.y + 5, w: 2, h: 7 });
      ctx.placa.patas.push({ x: x - 1, y: r.y + r.h - 12, w: 2, h: 7 });
    }
  }
}

/** Componente chico (resistencia o capacitor): dos pads; a veces sale una pista suelta. */
function componente(ctx: Ctx) {
  const horizontal = ctx.azar() < 0.5;
  const pos = colocar(ctx, horizontal ? 3 : 2, horizontal ? 2 : 3, 2);
  if (!pos) return;
  const x = pos[0] * G;
  const y = pos[1] * G;
  if (horizontal) {
    ctx.placa.patas.push({ x: x + 2, y: y + 5, w: 5, h: 6 }, { x: x + 17, y: y + 5, w: 5, h: 6 });
    if (ctx.azar() < 0.85) bus(ctx, [[x + 24, y + 8]], 0);
  } else {
    ctx.placa.patas.push({ x: x + 5, y: y + 2, w: 6, h: 5 }, { x: x + 5, y: y + 17, w: 6, h: 5 });
    if (ctx.azar() < 0.85) bus(ctx, [[x + 8, y + 24]], 2);
  }
}

/** Troncal: un bus que cruza la placa de vía a vía (pasa por esta capa). */
function troncal(ctx: Ctx) {
  const n = entre(ctx.azar, 2, 5);
  const d0 = entre(ctx.azar, 0, 3) * 2; // sale en recto
  const pos = colocar(ctx, n + 2, n + 2, 3);
  if (!pos) return;
  const [nx, ny] = normal(d0);
  const cx = (pos[0] + 1) * G;
  const cy = (pos[1] + 1) * G;
  const inicio: Punto[] = [];
  for (let j = 0; j < n; j++) inicio.push([cx + nx * (j - (n - 1) / 2) * G, cy + ny * (j - (n - 1) / 2) * G]);
  inicio.sort((a, b) => a[0] * nx + a[1] * ny - (b[0] * nx + b[1] * ny));
  // las vías de salida, solo si el bus llegó a tenderse
  if (bus(ctx, inicio, d0, true, 2)) inicio.forEach(([x, y]) => ctx.placa.vias.push({ x, y, senal: false }));
}

/** Grupo de vías de costura en rejilla de 16 px. */
function grupoVias(ctx: Ctx) {
  const a = entre(ctx.azar, 2, 4);
  const b = entre(ctx.azar, 2, 3);
  const pos = colocar(ctx, a * 2, b * 2, 2);
  if (!pos) return;
  for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) ctx.placa.vias.push({ x: (pos[0] + i * 2 + 1) * G, y: (pos[1] + j * 2 + 1) * G, senal: false });
}

/** La huella del conector del logo, 32 × 4 = 128 px, con pistas que salen de sus pines. */
function conector(ctx: Ctx) {
  const pos = colocar(ctx, 16, 16, 5);
  if (!pos) return;
  const x = pos[0] * G;
  const y = pos[1] * G;
  ctx.placa.conectores.push([x, y]);
  const e = 4;
  // los tres pines de la izquierda salen hacia la izquierda; los de la derecha, a la derecha
  const izq = LOGO_PINES.filter((p) => p.x < 16).map((p): Punto => [x + p.x * e, y + p.y * e]);
  const der = [...LOGO_PINES.filter((p) => p.x >= 16), LOGO_PIN_ACTIVO].map((p): Punto => [x + p.x * e, y + p.y * e]);
  izq.forEach((p) => bus(ctx, [p], 4, true, 9));
  der.forEach((p) => bus(ctx, [p], 0, true, 9));
}

let cache: Placa | null = null;

export function crearPlaca(): Placa {
  if (cache) return cache;
  const ctx: Ctx = {
    azar: crearAzar(SEMILLA),
    oc: new Ocupacion(),
    placa: { pistas: [], chips: [], patas: [], vias: [], conectores: [] },
    finales: [],
  };
  // Primero lo grande: así encuentra lugar.
  chip(ctx, 'cpu', 24, 24);
  zocalos(ctx);
  conector(ctx);
  for (let i = 0; i < 5; i++) chip(ctx, 'qfp', 12, 12);
  for (let i = 0; i < 6; i++) chip(ctx, 'soic', 6, 10);
  for (let i = 0; i < 30; i++) troncal(ctx);
  for (let i = 0; i < 10; i++) grupoVias(ctx);
  for (let i = 0; i < 60; i++) componente(ctx);
  // Pines con señal: pocos, como el del logo.
  for (let i = 0; i < 5 && ctx.finales.length; i++) {
    ctx.finales[Math.floor(ctx.azar() * ctx.finales.length)].senal = true;
  }
  cache = ctx.placa;
  return cache;
}

// ---------------------------------------------------------------- SVG

/** Colores por rol. Clara: sobre --color-light (#F8FAFC); oscura: sobre --color-dark. */
const TEMAS = {
  clara: {
    trazo: '#0F172A', // --color-dark (el azul marino del logo)
    pista: 0.09,
    cuerpo: 0.025,
    borde: 0.13,
    pata: 0.14,
    via: 0.15,
  },
  oscura: {
    trazo: '#F8FAFC', // --color-text-inverse
    pista: 0.06,
    cuerpo: 0.02,
    borde: 0.09,
    pata: 0.1,
    via: 0.1,
  },
} as const;
const SENAL = '#06B6D4'; // --color-accent: el pin con señal del logo

const n1 = (v: number) => String(Math.round(v * 10) / 10);

/** Desplazamientos (±ancho, ±alto) con los que una caja toca la baldosa. */
function copias(x0: number, y0: number, x1: number, y1: number): Punto[] {
  const out: Punto[] = [];
  for (const dx of [-PLACA_ANCHO, 0, PLACA_ANCHO]) {
    for (const dy of [-PLACA_ALTO, 0, PLACA_ALTO]) {
      if (x1 + dx >= -10 && x0 + dx <= PLACA_ANCHO + 10 && y1 + dy >= -10 && y0 + dy <= PLACA_ALTO + 10) out.push([dx, dy]);
    }
  }
  return out;
}

export function placaSvg(tema: keyof typeof TEMAS): string {
  const p = crearPlaca();
  const t = TEMAS[tema];
  let pistas = '';
  for (const { puntos } of p.pistas) {
    const xs = puntos.map((q) => q[0]);
    const ys = puntos.map((q) => q[1]);
    for (const [dx, dy] of copias(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys))) {
      pistas += 'M' + puntos.map(([x, y]) => `${n1(x + dx)} ${n1(y + dy)}`).join(' ');
    }
  }
  let cuerpos = '';
  let internos = '';
  for (const c of p.chips) {
    for (const [dx, dy] of copias(c.x, c.y, c.x + c.w, c.y + c.h)) {
      const x = c.x + dx;
      const y = c.y + dy;
      cuerpos += `<rect x="${x}" y="${y}" width="${c.w}" height="${c.h}" rx="${c.tipo === 'ram' ? 3 : 4}"/>`;
      if (c.tipo === 'cpu') internos += `<rect x="${x + 36}" y="${y + 36}" width="${c.w - 72}" height="${c.h - 72}" rx="3"/>`;
      if (c.tipo !== 'ram') internos += `<circle cx="${x + 10}" cy="${y + 10}" r="2.5"/>`;
      else internos += `<rect x="${x + Math.round(c.w * 0.38)}" y="${y + 3}" width="${G}" height="${c.h - 6}" rx="2"/>`;
    }
  }
  let patas = '';
  for (const r of p.patas) {
    for (const [dx, dy] of copias(r.x, r.y, r.x + r.w, r.y + r.h)) patas += `M${n1(r.x + dx)} ${n1(r.y + dy)}h${n1(r.w)}v${n1(r.h)}h${n1(-r.w)}z`;
  }
  let vias = '';
  let senales = '';
  for (const v of p.vias) {
    for (const [dx, dy] of copias(v.x - 4, v.y - 4, v.x + 4, v.y + 4)) {
      const x = v.x + dx;
      const y = v.y + dy;
      if (v.senal) senales += `<circle cx="${n1(x)}" cy="${n1(y)}" r="3"/>`;
      else vias += `M${n1(x - 3.25)} ${n1(y)}a3.25 3.25 0 1 0 6.5 0a3.25 3.25 0 1 0-6.5 0`;
    }
  }
  let conectores = '';
  for (const [cx, cy] of p.conectores) {
    for (const [dx, dy] of copias(cx, cy, cx + 128, cy + 128)) {
      const x = cx + dx;
      const y = cy + dy;
      conectores += `<path transform="translate(${x} ${y}) scale(4)" d="${LOGO_CARCASA}" vector-effect="non-scaling-stroke"/>`;
      for (const pin of LOGO_PINES) conectores += `<circle cx="${x + pin.x * 4}" cy="${y + pin.y * 4}" r="${LOGO_RADIO_PIN * 4}"/>`;
      senales += `<circle cx="${x + LOGO_PIN_ACTIVO.x * 4}" cy="${y + LOGO_PIN_ACTIVO.y * 4}" r="${LOGO_RADIO_PIN * 4}"/>`;
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${PLACA_ANCHO}" height="${PLACA_ALTO}" viewBox="0 0 ${PLACA_ANCHO} ${PLACA_ALTO}">` +
    `<path d="${pistas}" fill="none" stroke="${t.trazo}" stroke-opacity="${t.pista}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<g fill="${t.trazo}" fill-opacity="${t.cuerpo}" stroke="${t.trazo}" stroke-opacity="${t.borde}" stroke-width="1.5">${cuerpos}</g>` +
    `<g fill="none" stroke="${t.trazo}" stroke-opacity="${t.borde}" stroke-width="1.5">${internos}</g>` +
    `<path d="${patas}" fill="${t.trazo}" fill-opacity="${t.pata}"/>` +
    `<path d="${vias}" fill="none" stroke="${t.trazo}" stroke-opacity="${t.via}" stroke-width="1.5"/>` +
    `<g fill="none" stroke="${t.trazo}" stroke-opacity="${t.borde}" stroke-width="1.5">${conectores}</g>` +
    `<g fill="${SENAL}" fill-opacity="${tema === 'clara' ? 0.6 : 0.75}">${senales}</g>` +
    `</svg>`
  );
}
