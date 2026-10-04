/**
 * Verificador de contraste WCAG 2.1 para la paleta de Aura Studio.
 *
 *   node scripts/check-contrast.mjs
 *
 * Comprueba cada par color/fondo que el sitio usa de verdad, contra el umbral
 * que le corresponde: 4.5:1 para texto normal (1.4.3), 3:1 para texto grande
 * y para componentes de interfaz y gráficos con significado (1.4.11).
 *
 * Se corre a mano cuando se toca la paleta. No forma parte del build.
 */

const palette = {
  cream: "#FAF6F2",
  sand: "#EFE4DA",
  blush: "#E8C4C0",
  rose: "#C98B87",
  espresso: "#2E2422",
  mocha: "#6F5C55",
  gold: "#C9A227",
  // Variantes "ink": mismo tono, oscurecidas sólo para poder cargar texto
  // o un indicador de foco sin romper AA. Ver globals.css.
  "rose-ink": "#9A524C",
  "gold-ink": "#9A7818",
};

function channel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
}

function ratio(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** [primer plano, fondo, umbral, para qué se usa] */
const checks = [
  ["espresso", "cream", 4.5, "texto principal sobre el fondo base"],
  ["espresso", "sand", 4.5, "texto principal sobre secciones alternas"],
  ["espresso", "blush", 4.5, "texto sobre botón secundario"],
  ["espresso", "gold", 4.5, "texto del badge 'Más pedido'"],
  ["mocha", "cream", 4.5, "texto secundario sobre el fondo base"],
  ["mocha", "sand", 4.5, "texto secundario sobre secciones alternas"],
  ["cream", "espresso", 4.5, "texto del botón primario"],
  ["cream", "rose-ink", 4.5, "texto sobre acento oscuro"],
  ["rose-ink", "cream", 4.5, "eyebrow / kicker sobre el fondo base"],
  ["rose-ink", "sand", 4.5, "eyebrow / kicker sobre secciones alternas"],
  ["rose-ink", "cream", 3, "anillo de foco sobre el fondo base (1.4.11)"],
  ["rose-ink", "sand", 3, "anillo de foco sobre secciones alternas (1.4.11)"],
  ["gold-ink", "cream", 3, "estrellas de calificación sobre el fondo base"],
  ["gold-ink", "sand", 3, "estrellas de calificación sobre secciones alternas"],
  // `rose` (#C98B87) queda 2.59:1 sobre cream, así que NO puede llevar texto ni
  // ser un ícono con significado propio. Se reserva para relleno decorativo:
  // fondos de hover, filetes y separadores que no comunican nada por sí solos,
  // donde 1.4.11 no aplica. Los íconos con significado usan `rose-ink`.
  ["rose", "espresso", 3, "relleno decorativo sobre superficies oscuras"],
];

let failed = 0;
console.log("\n  par                                  ratio   umbral  uso");
console.log("  " + "-".repeat(94));

for (const [fg, bg, threshold, use] of checks) {
  const r = ratio(palette[fg], palette[bg]);
  const ok = r >= threshold;
  if (!ok) failed++;
  const pair = `${fg} sobre ${bg}`.padEnd(34);
  const mark = ok ? "PASA" : "FALLA";
  console.log(
    `  ${pair} ${r.toFixed(2).padStart(6)}  ${String(threshold).padStart(5)}   ${mark.padEnd(6)} ${use}`,
  );
}

console.log("  " + "-".repeat(94));

/* ---------------------------------------------------------------------------
   El fondo ambiental (components/Fondo.tsx) no es un color de la paleta: es
   una PILA de capas semitransparentes sobre cream. La tabla de arriba no lo
   veía, así que se podía subir un alfa del aura y que este script siguiera
   diciendo que todo pasa mientras el eyebrow de cada sección dejaba de pasar.
   Estos pares componen la pila y miden el resultado.

   Los alfas tienen que coincidir con el bloque "Fondo ambiental (aura)" de
   app/globals.css. Si se tocan allá, se tocan acá.                          */

const AURA = [
  ["blush", 0.16], // .aura-mancha--blush
  ["rose", 0.07], // .aura-mancha--rose
  ["sand", 0.34], // .aura-mancha--sand
];
/* El bokeh declara rose al 6 %, pero su opacidad llega a 0.5 en el keyframe
   aura-flota: el alfa que de verdad pinta es 0.06 × 0.5. Si alguien le quita
   ese keyframe o lo pone en opacity 1, hay que subirlo acá y volver a correr. */
const BOKEH = ["rose", 0.12 * 0.5];
/* El halo del hero (Hero.tsx) es blush al 40 % encima del aura, y sólo existe
   desde lg: por debajo de ~900 px su núcleo cae sobre el texto del hero, y con
   el aura debajo ni mocha ni gold-ink pasarían (4.46 y 2.93 medidos). La fila de
   hoy del horario era el otro blush al 40 %; ahora usa --color-blush-plano, que
   es el mismo color ya compuesto y opaco, así que el aura no la atraviesa.     */
const BLUSH_40 = ["blush", 0.4];

/* Sin redondear a 8 bits en cada paso: redondear capa por capa da un fondo más
   claro que el real y el script terminaría siendo más OPTIMISTA que la pantalla.
   Aun así queda un poco por encima de lo que mide el compositor —el apilado
   completo da 4.74 acá y 4.66 medido en el navegador con getImageData, porque
   color-mix() convierte a oklab y vuelve— así que abajo se exige un colchón.  */
const aRGB = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const aHex = (rgb) =>
  "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

function over(fgRGB, alpha, bgRGB) {
  return fgRGB.map((v, i) => alpha * v + (1 - alpha) * bgRGB[i]);
}

/** Apila capas [token, alfa] sobre un fondo y devuelve el rgb compuesto. */
function apilar(capas, fondo = aRGB(palette.cream)) {
  return capas.reduce((bg, [token, a]) => over(aRGB(palette[token]), a, bg), fondo);
}

/** Igual que ratio(), pero contra un fondo ya compuesto (rgb en flotante). */
function ratioRGB(fgHex, bgRGB) {
  const L = (rgb) =>
    0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  const [x, y] = [luminance(fgHex), L(bgRGB)].sort((a, b) => b - a);
  return (x + 0.05) / (y + 0.05);
}

/* Colchón sobre el umbral para los apilados. No es celo: la diferencia medida
   entre este cálculo y el compositor del navegador es de ~0.08, y el eyebrow
   rose-ink vive a 0.2 del mínimo. Sin colchón, el script aprobaría estados que
   en pantalla no pasan.                                                      */
const COLCHON = 0.15;

/* La seda del hero (lib/seda.ts): cuatro hebras de gradiente sobre un lienzo
   diminuto. El peor píxel posible es que las cuatro se crucen en el mismo
   punto, así que se apilan todas. Medido en el navegador con getImageData sobre el
   lienzo real la alfa típica es ~0.10; esta cuenta usa el tope teórico de
   0.37, que es que las cuatro se crucen en el mismo píxel. Los alfas tienen que coincidir con HEBRAS en lib/seda.ts.  */
const SEDA = [
  ["sand", 0.22],
  ["sand", 0.22],
  ["blush", 0.16],
  ["rose", 0.08],
];

/* Mientras se ve el hero, --fuerza baja el aura y el bokeh al 30 % y la seda
   sube a 1 (bloque "EL RECORRIDO" de app/globals.css). El orden de apilado es
   el del DOM en Fondo.tsx: manchas, seda, bokeh. */
const FUERZA_HERO = 0.3;
const AURA_HERO = AURA.map(([token, a]) => [token, a * FUERZA_HERO]);
const BOKEH_HERO = [BOKEH[0], BOKEH[1] * FUERZA_HERO];

const AURA_SOLA = apilar(AURA);
const AURA_PEOR = apilar([...AURA, BOKEH]);
const AURA_MAS_BLUSH = apilar([...AURA, BOKEH, BLUSH_40]);
const HERO_PEOR = apilar([...AURA_HERO, ...SEDA, BOKEH_HERO]);

/* Fuera del hero el recorrido sólo RESTA: al final de la página el blush
   queda en 0.2, el rose en 0.35 y el sand en 0.6 de lo que valían antes,
   así que AURA_PEOR —las tres manchas a full— sigue siendo el techo de toda la
   página y no hace falta una fila por sección. Lo que sí hay que mirar es el
   hero, que es donde se suma algo nuevo.                                     */

/* El eyebrow del hero y el de cada sección son espresso desde el 18-9-2026: en
   rose-ink eran el techo de los alfas. Si alguien los devuelve a rose-ink, la
   primera fila de esta tabla es la que va a fallar.                            */
const BLUSH_PLANO = "#f3e1de";

/** [primer plano, fondo compuesto, etiqueta, umbral, para qué] */
const apilados = [
  ["mocha", HERO_PEOR, "hero con seda", 4.5, "bajada del hero y del encabezado: EL TECHO de la seda"],
  ["gold-ink", aRGB(BLUSH_PLANO), "blush plano", 3, "estrellas del hero, ya FUERA del fondo (1.4.11)"],
  ["espresso", HERO_PEOR, "hero con seda", 4.5, "titular y eyebrow del hero sobre la seda"],
  ["rose-ink", HERO_PEOR, "hero con seda", 3, "íconos rose-ink del hero sobre la seda (1.4.11)"],
  ["gold-ink", AURA_PEOR, "aura completa", 3, "estrellas del hero: EL TECHO de los alfas (1.4.11)"],
  ["mocha", AURA_PEOR, "aura completa", 4.5, "texto secundario sobre el fondo ambiental"],
  ["espresso", AURA_PEOR, "aura completa", 4.5, "títulos y eyebrows sobre el fondo ambiental"],
  ["rose-ink", AURA_PEOR, "aura completa", 3, "íconos y chevrons rose-ink sobre el fondo (1.4.11)"],
  ["mocha", AURA_SOLA, "aura sin bokeh", 4.5, "texto secundario sin un punto de bokeh encima"],
  ["mocha", aRGB(BLUSH_PLANO), "blush plano", 4.5, "horas de hoy en la fila del horario (opaca)"],
  ["espresso", aRGB(BLUSH_PLANO), "blush plano", 4.5, "día de hoy en la fila del horario (opaca)"],
  ["rose-ink", aRGB(BLUSH_PLANO), "blush plano", 3, "borde de la fila de hoy (no textual, 1.4.11)"],
];

console.log("");
console.log("  Apilado del fondo ambiental");
console.log(
  "  aura sola " + aHex(AURA_SOLA) + " · con bokeh " + aHex(AURA_PEOR) +
    " · con blush 40% " + aHex(AURA_MAS_BLUSH) + "  (umbral + " + COLCHON + " de colchón)",
);
console.log(
  "  hero (aura al " + Math.round(FUERZA_HERO * 100) + "% + seda + bokeh) " + aHex(HERO_PEOR) +
    "  ·  la seda REEMPLAZA tinte, no lo suma",
);
console.log("  " + "-".repeat(94));

for (const [fg, bgRGB, etiqueta, threshold, use] of apilados) {
  const r = ratioRGB(palette[fg], bgRGB);
  const ok = r >= threshold + COLCHON;
  if (!ok) failed++;
  const pair = `${fg} sobre ${etiqueta}`.padEnd(34);
  const mark = ok ? "PASA" : "FALLA";
  console.log(
    `  ${pair} ${r.toFixed(2).padStart(6)}  ${String(threshold).padStart(5)}   ${mark.padEnd(6)} ${use}`,
  );
}

console.log("  " + "-".repeat(94));
/* El halo del hero no entra en la tabla porque no es un estado del sitio: vive
   en "hidden … lg:block" y a esos anchos no le cae texto encima. Lo que sí
   conviene tener a la vista es lo que pasaría si alguien le quita ese "hidden". */
console.log("  aviso: si el halo del hero (blush 40 %) volviera a verse en móvil,");
console.log(
  "  el texto mocha debajo quedaría en " +
    ratioRGB(palette.mocha, AURA_MAS_BLUSH).toFixed(2) +
    ":1 y las estrellas en " +
    ratioRGB(palette["gold-ink"], AURA_MAS_BLUSH).toFixed(2) +
    ":1. Por eso está en lg.",
);
console.log("");
if (failed > 0) {
  console.error(`\n  ${failed} par(es) NO alcanzan su umbral WCAG.\n`);
  process.exit(1);
}
console.log("\n  Todos los pares pasan su umbral WCAG 2.1.\n");
