// Escena C — Rescate de información (2,8 s).
// El plato gira, el brazo lector barre y los sectores rotos se vuelven sanos; una
// foto y un documento viajan a una carpeta. Cuadro final: disco sano, archivos a salvo.
import { C, CURVA, Documento, Foto, Fondo, Pista, Pulso, Vineta, arco, recorrido, type Escena, type Paso } from './comun';

type Punto = [number, number];
const PX = 415;
const PY = 200;
const ROTOS = [1, 4, 6, 9, 10];
const SECTORES = Array.from({ length: 12 }, (_, k) => {
  const a0 = -90 + k * 30 + 3;
  return { d: arco(PX, PY, 70, a0, a0 + 24), roto: ROTOS.includes(k) };
});

// Centro final de la foto y del documento, asomados en la carpeta.
const FINAL: Punto[] = [[676, 164], [720, 162]];

// Salen del plato, suben por encima del disco y caen dentro de la carpeta.
function viaje(i: number): Keyframe[] {
  return recorrido(FINAL[i], [
    { x: PX, y: PY, escala: 0.4, opacity: 0 },
    { x: 425 + i * 14, y: 135, escala: 0.8 },
    { x: 540 + i * 14, y: 62, escala: 0.9 },
    { x: 650 + i * 22, y: 76 },
    { x: FINAL[i][0], y: FINAL[i][1] },
  ]);
}

const pasos: Paso[] = [
  { p: 'rs-giro', kf: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(720deg)' }], dur: 1500, delay: 200, ease: CURVA.inOut },
  {
    p: 'rs-brazo',
    // dos movimientos, cada uno con su curva
    kf: [{ transform: 'rotate(-14deg)', easing: CURVA.inOut }, { transform: 'rotate(22deg)', offset: 0.55, easing: CURVA.inOut }, { transform: 'rotate(0deg)' }],
    dur: 1400,
    delay: 200,
    ease: CURVA.lineal,
  },
  { p: 'rs-sector', kf: [{ opacity: 0 }, { opacity: 1, offset: 0.6 }, { opacity: 0.9 }], dur: 260, delay: 450, escalon: 110 },
  { p: 'rs-archivo', kf: viaje, dur: 1000, delay: 1400, escalon: 150, ease: CURVA.inOut },
  { p: 'rs-carpeta-luz', kf: [{ opacity: 0 }, { opacity: 1, offset: 0.35 }, { opacity: 0 }], dur: 450, delay: 2330 },
];

const CARPETA = 'M640 170H685L700 186H760Q768 186 768 194V268Q768 276 760 276H648Q640 276 640 268Z';

function Dibujo({ uid }: { uid: string }) {
  return (
    <>
      <Fondo uid={uid} cx={430} cy={215} />

      <Pista uid={uid} d="M-10 150H150L180 120H288" via={[70, 150]} pad={[288, 120]} />
      <Pista uid={uid} d="M-10 270H288" via={[90, 270]} pad={[288, 270]} />
      <Pulso d="M-10 270H288" hover />

      {/* cuerpo del disco con su halo quieto */}
      <rect x="300" y="85" width="260" height="260" rx="22" fill="none" stroke={C.cian} strokeWidth="10" opacity="0.45" filter={`url(#${uid}-halo)`} />
      <rect x="300" y="85" width="260" height="260" rx="22" fill={C.fondo} stroke={C.claro} strokeWidth="9" />
      <circle cx={PX} cy={PY} r="95" fill={C.fondo} stroke={C.claro} strokeWidth="5" />

      {/* el plato gira: un reflejo y un anillo interior */}
      <g transform={`translate(${PX} ${PY})`}>
        <g data-p="rs-giro">
          <circle r="95" fill="none" stroke="none" />
          <circle r="40" fill="none" stroke={C.borde} strokeWidth="2" />
          <path d="M0 -44V-90" stroke={C.borde} strokeWidth="6" strokeLinecap="round" />
        </g>
      </g>

      {/* sectores: los rotos quedan punteados debajo y se encienden al pasar el brazo */}
      {SECTORES.map((s, k) => (
        <path key={`b${k}`} d={s.d} fill="none" stroke={s.roto ? C.pizarra : C.borde} strokeWidth="12" strokeDasharray={s.roto ? '3 5' : undefined} />
      ))}
      {SECTORES.map((s, k) => (
        <path key={`s${k}`} data-p={s.roto ? 'rs-sector' : undefined} d={s.d} fill="none" stroke={C.cian} strokeOpacity="0.9" strokeWidth="12" />
      ))}
      <circle cx={PX} cy={PY} r="14" fill={C.fondo} stroke={C.claro} strokeWidth="5" />

      {/* brazo lector: gira sobre su eje (el círculo invisible centra la caja en el eje) */}
      <g transform="translate(525 305)">
        <g data-p="rs-brazo">
          <circle r="152" fill="none" stroke="none" />
          <path d="M0 0L-62 -118" stroke={C.claro} strokeWidth="8" strokeLinecap="round" />
          <rect x="-74" y="-136" width="22" height="16" rx="4" transform="rotate(28 -63 -128)" fill={C.fondo} stroke={C.claro} strokeWidth="5" />
          <circle r="16" fill={C.fondo} stroke={C.claro} strokeWidth="6" />
        </g>
      </g>

      {/* foto y documento: detrás del frente de la carpeta, asomados */}
      <g transform={`translate(${FINAL[0][0] - 18} ${FINAL[0][1] - 15})`}>
        <g data-p="rs-archivo">
          <Foto />
        </g>
      </g>
      <g transform={`translate(${FINAL[1][0] - 14} ${FINAL[1][1] - 17})`}>
        <g data-p="rs-archivo">
          <Documento />
        </g>
      </g>
      <path d={CARPETA} fill={C.fondo} stroke={C.claro} strokeWidth="8" strokeLinejoin="round" />
      <path data-p="rs-carpeta-luz" opacity="0" d={CARPETA} fill="none" stroke={C.cian} strokeOpacity="0.45" strokeWidth="16" strokeLinejoin="round" />

      <Vineta uid={uid} />
    </>
  );
}

export const rescate: Escena = {
  descripcion: 'Ilustración: el disco se lee sector por sector, los dañados se recuperan y una foto y un documento pasan a una carpeta.',
  Dibujo,
  pasos,
};
