/**
 * Geometría del logo de Desamparados Tech. Un solo lugar para el componente
 * `Logo` y para `scripts/generar-logo.mjs`, así el favicon y el encabezado no
 * se separan.
 *
 * La idea: un conector D-sub (el de los cables VGA y serie) puesto de costado.
 * Su carcasa en trapecio se lee como una "D" y los pines dicen "taller
 * técnico" sin recurrir a circuitos, cerebros ni destellos. Un pin va en cian:
 * el que tiene señal.
 *
 * Todo en una grilla de 32 × 32.
 */

export const LOGO_VIEWBOX = '0 0 32 32';

/** Carcasa: borde izquierdo recto, derecho más corto y con esquinas amplias. */
export const LOGO_CARCASA =
  'M6 6.5Q6 4 8.43 4.61L21.63 7.91Q26 9 26 13.5V18.5Q26 23 21.63 24.09L8.43 27.39Q6 28 6 25.5Z';

/** Grosor del trazo de la carcasa en la versión de línea. */
export const LOGO_TRAZO = 2.4;

export type Pin = { x: number; y: number };

/** Tres pines a la izquierda y dos a la derecha, como en un DE-9 real. */
export const LOGO_PINES: Pin[] = [
  { x: 12, y: 11 },
  { x: 12, y: 16 },
  { x: 12, y: 21 },
  { x: 19.5, y: 18.5 },
];

/** El pin con señal. */
export const LOGO_PIN_ACTIVO: Pin = { x: 19.5, y: 13.5 };

export const LOGO_RADIO_PIN = 1.35;

/** Radio de los pines en la versión sólida (favicon), donde se ven como huecos. */
export const LOGO_RADIO_PIN_SOLIDO = 1.9;

/** Un círculo como trazo de path, para recortarlo con `evenodd`. */
export function circuloPath({ x, y }: Pin, r: number): string {
  return `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
}

/** Carcasa sólida con los pines comunes recortados (para tamaños chicos). */
export function carcasaSolida(): string {
  return [LOGO_CARCASA, ...LOGO_PINES.map((p) => circuloPath(p, LOGO_RADIO_PIN_SOLIDO))].join('');
}

/**
 * Ondas de señal WiFi que salen del pin activo, hacia arriba a la derecha.
 * Arrancan en r = 10 para no tocar la esquina de la carcasa; la más grande
 * se sale del viewBox (el SVG va con `overflow: visible`) pero no llega al
 * nombre, que empieza 10 px después del símbolo.
 */
export const LOGO_ONDAS_RADIOS = [10, 13.5, 17] as const;
const ONDA_DESDE = -65;
const ONDA_HASTA = -5;

export function ondaPath(r: number): string {
  const punto = (grados: number) => {
    const a = (grados * Math.PI) / 180;
    return `${(LOGO_PIN_ACTIVO.x + r * Math.cos(a)).toFixed(2)} ${(LOGO_PIN_ACTIVO.y + r * Math.sin(a)).toFixed(2)}`;
  };
  return `M${punto(ONDA_DESDE)}A${r} ${r} 0 0 1 ${punto(ONDA_HASTA)}`;
}

/** Colores de marca, iguales a los tokens de globals.css. */
export const LOGO_COLORES = {
  oscuro: '#0F172A',
  claro: '#F8FAFC',
  cian: '#06B6D4',
  /** Cian para fondos claros: el #06B6D4 no llega a 3:1 sobre blanco. */
  cianTinta: '#0E7490',
} as const;
