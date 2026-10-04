// Escena K — Redes WiFi de alto alcance (2,8 s).
// El router no llega a los dos cuartos del fondo; entra un repetidor, la señal
// los cubre y sus íconos pasan de "sin señal" a señal llena. Cuadro final: toda
// la casa cubierta.
import type { ReactNode } from 'react';
import { C, Fondo, Pista, Pulso, Vineta, type Escena, type Paso } from './comun';

const ROUTER: [number, number] = [205, 300];
const REPETIDOR: [number, number] = [400, 150];
// Centros de los cuartos del fondo, los que no tenían señal.
const SIN_SENAL: Array<[number, number]> = [[595, 150], [595, 305]];

// Nace invisible: mientras espera su turno no tiene que verse un anillo suelto.
const ONDA: Keyframe[] = [
  { opacity: 0, transform: 'scale(0.25)' },
  { opacity: 0.9, transform: 'scale(0.32)', offset: 0.08 },
  { opacity: 0, transform: 'scale(1)' },
];

const pasos: Paso[] = [
  { p: 'wf-onda-router', kf: ONDA, dur: 900, delay: 200, escalon: 220 },
  { p: 'wf-repetidor', kf: [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1)' }], dur: 400, delay: 950 },
  { p: 'wf-onda-rep', kf: ONDA, dur: 1000, delay: 1250, escalon: 220 },
  { p: 'wf-cubre', kf: [{ opacity: 0 }, { opacity: 1 }], dur: 500, delay: 0, delays: [1600, 1800] },
  { p: 'wf-sin', kf: [{ opacity: 1 }, { opacity: 0 }], dur: 250, delay: 0, delays: [1650, 1850] },
  { p: 'wf-con', kf: [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1)' }], dur: 350, delay: 0, delays: [1750, 1950] },
];

// Ícono de wifi centrado en (0, 0): tres arcos y un punto.
function IconoWifi({ color, tachado }: { color: string; tachado?: boolean }): ReactNode {
  return (
    <g fill="none" stroke={color} strokeWidth="5" strokeLinecap="round">
      <path d="M-24 -6A34 34 0 0 1 24 -6" />
      <path d="M-15 3A21 21 0 0 1 15 3" />
      <path d="M-7 11A10 10 0 0 1 7 11" />
      <circle cx="0" cy="19" r="3" fill={color} stroke="none" />
      {tachado && <path d="M-22 -18L22 24" />}
    </g>
  );
}

function Onda({ x, y, r, p }: { x: number; y: number; r: number; p: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle data-p={p} r={r} fill="none" stroke={C.cian} strokeWidth="4" opacity="0" />
    </g>
  );
}

function Dibujo({ uid }: { uid: string }) {
  return (
    <>
      <Fondo uid={uid} cx={400} cy={225} />

      <Pista uid={uid} d="M-10 100H50L75 125H104" via={[25, 100]} />
      <Pulso d="M-10 100H50L75 125H104" hover />

      {/* la casa, vista desde arriba: cuatro cuartos */}
      <rect x="110" y="70" width="580" height="310" rx="10" fill="none" stroke={C.claro} strokeWidth="6" />
      <path d="M300 70V190M300 250V380M500 70V120M500 180V380M500 230H690" stroke={C.claro} strokeWidth="6" strokeLinecap="round" />

      {/* los cuartos del fondo se llenan de señal */}
      <rect data-p="wf-cubre" x="503" y="73" width="184" height="154" fill={C.cian} fillOpacity="0.08" />
      <rect data-p="wf-cubre" x="503" y="233" width="184" height="144" fill={C.cian} fillOpacity="0.08" />

      {/* ondas del router y del repetidor (solo en el recorrido) */}
      {[0, 1, 2].map((k) => (
        <Onda key={`r${k}`} x={ROUTER[0]} y={ROUTER[1]} r={230} p="wf-onda-router" />
      ))}
      {[0, 1, 2].map((k) => (
        <Onda key={`p${k}`} x={REPETIDOR[0]} y={REPETIDOR[1]} r={260} p="wf-onda-rep" />
      ))}

      {/* router */}
      <g>
        <rect x={ROUTER[0] - 44} y={ROUTER[1] - 14} width="88" height="34" rx="8" fill={C.fondo} stroke={C.claro} strokeWidth="6" />
        <path d={`M${ROUTER[0] - 26} ${ROUTER[1] - 14}L${ROUTER[0] - 34} ${ROUTER[1] - 48}M${ROUTER[0] + 26} ${ROUTER[1] - 14}L${ROUTER[0] + 34} ${ROUTER[1] - 48}`} stroke={C.claro} strokeWidth="6" strokeLinecap="round" />
        {[-18, -4, 10].map((dx) => (
          <circle key={dx} cx={ROUTER[0] + dx} cy={ROUTER[1] + 3} r="3.5" fill={C.cian} />
        ))}
      </g>

      {/* repetidor */}
      <g data-p="wf-repetidor">
        <rect x={REPETIDOR[0] - 22} y={REPETIDOR[1] - 26} width="44" height="52" rx="10" fill={C.fondo} stroke={C.claro} strokeWidth="6" />
        <circle cx={REPETIDOR[0]} cy={REPETIDOR[1] + 10} r="4" fill={C.cian} />
        <path d={`M${REPETIDOR[0] - 10} ${REPETIDOR[1] - 10}A14 14 0 0 1 ${REPETIDOR[0] + 10} ${REPETIDOR[1] - 10}`} fill="none" stroke={C.cian} strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* los cuartos del fondo: de "sin señal" a señal llena */}
      {SIN_SENAL.map(([x, y], i) => (
        <g key={i}>
          <g data-p="wf-sin" opacity="0" transform={`translate(${x} ${y})`}>
            <g strokeDasharray="4 6">
              <IconoWifi color={C.pizarra} tachado />
            </g>
          </g>
          <g transform={`translate(${x} ${y})`}>
            <g data-p="wf-con">
              <IconoWifi color={C.cian} />
            </g>
          </g>
        </g>
      ))}

      <Vineta uid={uid} />
    </>
  );
}

export const wifi: Escena = {
  descripcion: 'Ilustración: el router no llega a dos cuartos; entra un repetidor, la señal los cubre y toda la casa queda con WiFi.',
  Dibujo,
  pasos,
};
