// Escena E — Diagnóstico honesto (2,6 s).
// Una línea de escaneo recorre el equipo por partes; se marcan tres vistos y una
// alerta, y la pieza que falla queda señalada. Cuadro final: "te decimos qué falla".
import type { ReactNode } from 'react';
import { C, CURVA, Fondo, Pista, Pulso, Vineta, type Escena, type Paso } from './comun';

// Filas del reporte: y del centro. La tercera (el chip) es la que falla.
// Subidas para que el botón "Ver otra vez" (abajo a la derecha) no tape la última.
const FILAS = [100, 158, 216, 274];
const FALLA = 2;

// Cuándo pasa la línea de escaneo por cada zona (baja de y 85 a 365 en 1 s).
const ESCANEO_DELAY = 200;
// El destello llega a su pico al 30 % de sus 450 ms: arranca 135 ms antes que la línea.
const cuando = (y: number) => Math.round(ESCANEO_DELAY + ((y - 85) / 280) * 1000) - 135;

const pasos: Paso[] = [
  {
    p: 'dg-escaneo',
    kf: [{ transform: 'translateY(0px)', opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 1, offset: 0.92 }, { transform: 'translateY(280px)', opacity: 0 }],
    dur: 1000,
    delay: ESCANEO_DELAY,
    ease: CURVA.lineal, // un escáner va parejo; así los destellos coinciden con la línea
  },
  { p: 'dg-zona', kf: [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }], dur: 450, delay: 0, delays: [cuando(119), cuando(185), cuando(335)] },
  { p: 'dg-barra', kf: [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], dur: 300, delay: 0, delays: [1100, 1250, 1400, 1550], origen: '0 50%' },
  { p: 'dg-visto', kf: [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], dur: 300, delay: 0, delays: [1250, 1400, 1700], ease: CURVA.inOut },
  { p: 'dg-alerta', kf: [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1)' }], dur: 350, delay: 1550 },
  { p: 'dg-zona-mal', kf: [{ opacity: 0 }, { opacity: 1 }], dur: 300, delay: 1850 },
  { p: 'dg-anillo', kf: [{ opacity: 0, transform: 'scale(1.3)' }, { opacity: 1, transform: 'scale(1)' }], dur: 500, delay: 1850 },
  { p: 'dg-conector', kf: [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], dur: 450, delay: 2150, ease: CURVA.inOut },
];

// Las cuatro zonas del equipo, dibujadas con el trazo que se pida.
const ZONAS: Array<(t: { stroke: string }) => ReactNode> = [
  // disco
  ({ stroke }) => (
    <g fill="none" stroke={stroke} strokeWidth="4">
      <rect x="330" y="100" width="110" height="38" rx="6" />
      <circle cx="346" cy="119" r="3" fill={stroke} stroke="none" />
      <circle cx="358" cy="119" r="3" fill={stroke} stroke="none" />
    </g>
  ),
  // memorias
  ({ stroke }) => (
    <g fill="none" stroke={stroke} strokeWidth="4">
      {[335, 362, 389, 416].map((x) => (
        <rect key={x} x={x} y="160" width="14" height="50" rx="2" />
      ))}
    </g>
  ),
  // chip (la pieza que falla)
  ({ stroke }) => (
    <g fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round">
      <rect x="355" y="232" width="60" height="60" rx="6" />
      <rect x="370" y="247" width="30" height="30" rx="3" />
      <path d="M370 232V224M385 232V224M400 232V224M370 292V300M385 292V300M400 292V300M355 247H347M355 262H347M355 277H347M415 247H423M415 262H423M415 277H423" />
    </g>
  ),
  // ventilador
  ({ stroke }) => (
    <g fill="none" stroke={stroke} strokeWidth="4" strokeLinejoin="round">
      <circle cx="372" cy="335" r="24" />
      {[0, 120, 240].map((g) => (
        <path key={g} d="M372 331C366 322 369 315 377 315C376 322 376 327 375 331Z" transform={`rotate(${g} 372 335)`} />
      ))}
    </g>
  ),
];

// Íconos del reporte, uno por zona (30 × 30, centrados en x 540): legibles en el teléfono.
function Mini({ k, y }: { k: number; y: number }) {
  const s = { fill: 'none', stroke: C.pizarra, strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  if (k === 0) return <rect x="524" y={y - 10} width="33" height="21" rx="4" {...s} />;
  if (k === 1) return <path d={`M528 ${y - 15}V${y + 15}M540 ${y - 15}V${y + 15}M552 ${y - 15}V${y + 15}`} {...s} />;
  if (k === 2) return <rect x="525" y={y - 15} width="30" height="30" rx="4" {...s} />;
  return <circle cx="540" cy={y} r="15" {...s} />;
}

function Dibujo({ uid }: { uid: string }) {
  const zonaFalla = ZONAS[FALLA];
  return (
    <>
      <Fondo uid={uid} cx={430} cy={225} />

      <Pista uid={uid} d="M-10 140H140L170 170H292" via={[70, 140]} pad={[292, 170]} />
      <Pista uid={uid} d="M-10 300H292" via={[100, 300]} pad={[292, 300]} />
      <Pulso d="M-10 300H292" hover />

      {/* el equipo, con su halo quieto */}
      <rect x="305" y="75" width="160" height="300" rx="16" fill="none" stroke={C.cian} strokeWidth="10" opacity="0.45" filter={`url(#${uid}-halo)`} />
      <rect x="305" y="75" width="160" height="300" rx="16" fill={C.fondo} stroke={C.claro} strokeWidth="8" />
      <circle cx="437" cy="352" r="8" fill="none" stroke={C.claro} strokeWidth="3" />

      {/* zonas en pizarra; destello cian al pasar la línea (la que falla, aparte) */}
      {ZONAS.map((Zona, k) => (
        <Zona key={`z${k}`} stroke={C.pizarra} />
      ))}
      {ZONAS.map((Zona, k) =>
        k === FALLA ? null : (
          <g key={`zl${k}`} data-p="dg-zona" opacity="0">
            <Zona stroke={C.cian} />
          </g>
        ),
      )}
      <g data-p="dg-zona-mal">{zonaFalla({ stroke: C.claro })}</g>

      {/* la línea de escaneo */}
      <g data-p="dg-escaneo" opacity="0">
        <path d="M312 85H458" stroke={C.cian} strokeOpacity="0.3" strokeWidth="12" strokeLinecap="round" />
        <path d="M312 85H458" stroke={C.cian} strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* el anillo que señala la falla y la línea que la une a su fila */}
      <circle data-p="dg-anillo" cx="385" cy="262" r="52" fill="none" stroke={C.claro} strokeWidth="4" strokeDasharray="6 7" />
      <path data-p="dg-conector" d="M437 262H466L512 216H518" pathLength={1} strokeDasharray="1" fill="none" stroke={C.claro} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDashoffset: 0 }} />

      {/* el reporte */}
      {FILAS.map((y, k) => (
        <g key={y}>
          <Mini k={k} y={y} />
          <rect x="572" y={y - 7} width="90" height="14" rx="7" fill={C.panel} />
          <rect data-p="dg-barra" x="572" y={y - 7} width={k === FALLA ? 72 : 90} height="14" rx="7" fill={C.borde} />
          <circle cx="705" cy={y} r="20" fill="none" stroke={C.via} strokeWidth="3" />
          {k === FALLA ? (
            <g data-p="dg-alerta">
              <circle cx="705" cy={y} r="20" fill="none" stroke={C.claro} strokeWidth="3.5" />
              <path d={`M705 ${y - 11}V${y + 2}`} stroke={C.claro} strokeWidth="6" strokeLinecap="round" />
              <circle cx="705" cy={y + 10} r="3.5" fill={C.claro} />
            </g>
          ) : (
            <path
              data-p="dg-visto"
              d={`M694 ${y}L702 ${y + 8}L717 ${y - 8}`}
              pathLength={1}
              strokeDasharray="1"
              style={{ strokeDashoffset: 0 }}
              fill="none"
              stroke={C.cian}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </g>
      ))}

      <Vineta uid={uid} />
    </>
  );
}

export const diagnostico: Escena = {
  descripcion: 'Ilustración: se revisa el equipo por partes; tres están bien y la que tiene la falla queda señalada.',
  Dibujo,
  pasos,
};
