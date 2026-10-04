import type { CSSProperties } from 'react';
import {
  LOGO_CARCASA,
  LOGO_COLORES,
  LOGO_PINES,
  LOGO_PIN_ACTIVO,
  LOGO_RADIO_PIN,
  LOGO_TRAZO,
  LOGO_ONDAS_RADIOS,
  ondaPath,
} from '@/lib/logo';

/**
 * Carga inicial en forma de circuito: cinco pistas con sus vías se dibujan
 * desde la izquierda, un pulso cian las recorre hasta el conector del logo,
 * se encienden los pines y el pin activo manda la señal WiFi. Cable que entra,
 * señal que sale: lo que hace el negocio. Dura ~1,7 s.
 *
 * Por qué así:
 * - Solo CSS. Corre aunque la página todavía esté cargando JavaScript, y si JS
 *   no carga nunca, igual se va sola.
 * - `pointer-events: none` todo el tiempo: nunca bloquea un clic.
 * - Una vez por sesión: el script de `app/layout.tsx` marca
 *   `<html data-intro="visto">` y el CSS la oculta sin dibujarla.
 * - Con movimiento reducido no aparece.
 *
 * La animación está en globals.css (`.intro*`).
 */

/** El logo (grilla de 32) va a escala 2 y corrido a este punto del lienzo. */
const LOGO_X = 88;
const LOGO_Y = 38;

/**
 * Pistas en ángulos de 45°, como en una placa. Todas terminan en el borde
 * izquierdo de la carcasa (x = 100 en el lienzo), repartidas a lo alto.
 * Simétricas respecto de la del medio.
 */
const PISTAS = [
  { d: 'M18 26H50L66 42H82L94 54H100', via: [18, 26] },
  { d: 'M10 50H56L68 62H100', via: [10, 50] },
  { d: 'M4 70H100', via: [4, 70] },
  { d: 'M10 90H56L68 78H100', via: [10, 90] },
  { d: 'M18 114H50L66 98H82L94 86H100', via: [18, 114] },
] as const;

const COBRE = '#334155'; // --color-border-dark: la pista apagada
const VIA = '#475569';

export function Intro() {
  return (
    <div className="intro" aria-hidden="true">
      <div className="intro-contenido">
        <svg viewBox="0 16 180 108" className="intro-circuito" focusable="false">
          <defs>
            {/* Brillo del cobre con corriente: el trazo más un halo difuso. */}
            <filter id="intro-brillo" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.6" result="halo" />
              <feMerge>
                <feMergeNode in="halo" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {PISTAS.map((p, i) => (
            <g key={p.d} style={{ '--i': i } as CSSProperties}>
              <path className="intro-pista" d={p.d} pathLength={1} fill="none" stroke={COBRE} strokeWidth={1.6} strokeLinejoin="round" />
              <path className="intro-pulso" d={p.d} pathLength={1} fill="none" stroke={LOGO_COLORES.cian} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" filter="url(#intro-brillo)" />
              <circle className="intro-via" cx={p.via[0]} cy={p.via[1]} r={2.6} fill={LOGO_COLORES.oscuro} stroke={VIA} strokeWidth={1.4} />
              {/* La vía se enciende cuando sale el pulso y queda tibia. */}
              <circle className="intro-via-luz" cx={p.via[0]} cy={p.via[1]} r={2.6} fill="none" stroke={LOGO_COLORES.cian} strokeWidth={1.4} filter="url(#intro-brillo)" />
            </g>
          ))}

          {/* Un componente SMD sobre la pista del medio: el pulso pasa por debajo. */}
          <g className="intro-chip">
            <rect x={36} y={66.5} width={13} height={7} rx={1} fill={LOGO_COLORES.oscuro} stroke={VIA} strokeWidth={1.2} />
            <rect x={36.6} y={67.1} width={2.4} height={5.8} fill={VIA} />
            <rect x={46} y={67.1} width={2.4} height={5.8} fill={VIA} />
          </g>

          <g transform={`translate(${LOGO_X} ${LOGO_Y}) scale(2)`}>
            <path
              className="intro-carcasa"
              d={LOGO_CARCASA}
              pathLength={1}
              fill="none"
              stroke={LOGO_COLORES.claro}
              strokeWidth={LOGO_TRAZO}
              strokeLinejoin="round"
            />
            {LOGO_PINES.map((p, i) => (
              <circle
                key={`${p.x}-${p.y}`}
                className="intro-pin"
                style={{ '--i': i } as CSSProperties}
                cx={p.x}
                cy={p.y}
                r={LOGO_RADIO_PIN}
                fill={LOGO_COLORES.claro}
              />
            ))}
            <circle
              className="intro-pin intro-pin-activo"
              style={{ '--i': LOGO_PINES.length } as CSSProperties}
              cx={LOGO_PIN_ACTIVO.x}
              cy={LOGO_PIN_ACTIVO.y}
              r={LOGO_RADIO_PIN}
              fill={LOGO_COLORES.cian}
              filter="url(#intro-brillo)"
            />
            {LOGO_ONDAS_RADIOS.map((r, i) => (
              <path
                key={r}
                className="intro-onda"
                style={{ '--i': i } as CSSProperties}
                d={ondaPath(r)}
                fill="none"
                stroke={LOGO_COLORES.cian}
                strokeWidth={1.8}
                strokeLinecap="round"
                filter="url(#intro-brillo)"
              />
            ))}
          </g>
        </svg>

        {/* El nombre, con la misma forma que en el encabezado. */}
        <div className="intro-marca">
          <span className="intro-marca-nombre">Desamparados</span>
          <span className="intro-marca-tech">
            Tech
            <span className="intro-marca-linea" />
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Corre antes de pintar. La primera vez en la sesión guarda la marca y pone
 * `data-intro="mostrando"` (el hero lo lee para esperar a que la carga se
 * vaya); las siguientes pone `data-intro="visto"` y la carga no se muestra.
 * Dentro de try: con almacenamiento bloqueado (modo privado estricto) la
 * entrada simplemente se muestra.
 */
export const INTRO_SCRIPT =
  "try{if(sessionStorage.getItem('dt-intro')){document.documentElement.dataset.intro='visto'}else{sessionStorage.setItem('dt-intro','1');document.documentElement.dataset.intro='mostrando'}}catch(e){}";
