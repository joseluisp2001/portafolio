// Escena A — Formateo sin perder datos (2,6 s).
// Los archivos salen de la pantalla desordenada a un respaldo, la pantalla se
// limpia y los archivos vuelven en fila. Cuadro final: laptop limpia con sus archivos.
import { C, CURVA, Documento, Fondo, Pista, Pulso, Vineta, Chip, recorrido, type Escena, type Paso } from './comun';

type Punto = [number, number];
// Centro final de cada archivo (en fila sobre el escritorio limpio) y dónde empieza (desordenado).
const FINAL: Punto[] = [[466, 167], [505, 167], [544, 167]];
const INICIO: Punto[] = [[472, 150], [548, 200], [452, 214]];
const CAJA: Punto = [170, 222];
// Recorrido de cada archivo por su pista, desde la pantalla hasta la caja.
const PISTAS: Punto[][] = [
  [[398, 150], [330, 150], [304, 176], [226, 176]],
  [[398, 208], [226, 208]],
  [[398, 240], [226, 240]],
];

// Ida: de la pantalla desordenada, por su pista, hasta perderse en la caja.
function ida(i: number): Keyframe[] {
  return recorrido(FINAL[i], [
    { x: INICIO[i][0], y: INICIO[i][1] },
    ...PISTAS[i].map(([x, y]) => ({ x, y })),
    { x: CAJA[0], y: CAJA[1], escala: 0.5, opacity: 0 },
  ]);
}
// Vuelta: sale de la caja, desanda la pista y se acomoda en la fila.
function vuelta(i: number): Keyframe[] {
  return recorrido(FINAL[i], [
    { x: CAJA[0], y: CAJA[1], escala: 0.5, opacity: 0 },
    ...[...PISTAS[i]].reverse().map(([x, y]) => ({ x, y })),
    { x: FINAL[i][0], y: FINAL[i][1] },
  ]);
}

const pasos: Paso[] = [
  // Dos copias de cada archivo, una animación cada una: dos animaciones de transform
  // sobre el mismo elemento se dibujaban mal (se veía solo la vuelta).
  // La copia de ida sale de la pantalla y se pierde en la caja; la de vuelta espera
  // escondida en la caja y regresa a la fila (es la que queda en el cuadro final).
  { p: 'fm-archivo-ida', kf: ida, dur: 950, delay: 200, escalon: 90, ease: CURVA.inOut },
  { p: 'fm-archivo', kf: vuelta, dur: 800, delay: 1500, escalon: 90, ease: CURVA.inOut },
  { p: 'fm-caja-luz', kf: [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], dur: 1200, delay: 650 },
  {
    p: 'fm-barrido',
    kf: [{ transform: 'translateY(0px)', opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.88 }, { transform: 'translateY(106px)', opacity: 0 }],
    dur: 650,
    delay: 850,
    ease: CURVA.inOut,
  },
  { p: 'fm-desorden', kf: [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.9)' }], dur: 300, delay: 900, escalon: 120 },
  { p: 'fm-barra-marco', kf: [{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], dur: 950, delay: 800, ease: CURVA.lineal },
  {
    p: 'fm-barra',
    kf: [{ transform: 'scaleX(0)', opacity: 1 }, { transform: 'scaleX(1)', opacity: 1, offset: 0.8 }, { transform: 'scaleX(1)', opacity: 0 }],
    dur: 950,
    delay: 800,
    ease: CURVA.lineal,
    origen: '0 50%',
  },
  { p: 'fm-listo', kf: [{ opacity: 0 }, { opacity: 1, offset: 0.35 }, { opacity: 0 }], dur: 450, delay: 2150 },
];

function Dibujo({ uid }: { uid: string }) {
  const ventanas: Array<[number, number, number, number, number]> = [
    // x, y, ancho, alto, giro
    [438, 138, 66, 42, -9],
    [498, 172, 70, 46, 7],
    [440, 190, 58, 36, 14],
  ];
  return (
    <>
      <Fondo uid={uid} cx={505} cy={210} />

      {/* pistas que entran por la derecha */}
      <Pista uid={uid} d="M810 150H716L686 180H614" via={[760, 150]} pad={[614, 180]} />
      <Pista uid={uid} d="M810 330H690L660 300H646" via={[756, 330]} pad={[646, 300]} />
      <Pulso d="M810 150H716L686 180H614" hover />

      {/* pistas entre la laptop y el respaldo */}
      <Pista uid={uid} d="M398 150H330L304 176H226" pad={[398, 150]} />
      <Pista uid={uid} d="M398 208H226" via={[270, 208]} pad={[398, 208]} />
      <Pista uid={uid} d="M398 240H226" pad={[398, 240]} />
      <Chip x={250} y={292} />

      {/* respaldo: vacío y punteado; se enciende mientras guarda los archivos */}
      <g fill="none" stroke={C.via} strokeWidth="5" strokeDasharray="10 8" strokeLinejoin="round" strokeLinecap="round">
        <rect x="118" y="170" width="104" height="24" rx="5" />
        <path d="M126 194V246Q126 254 134 254H206Q214 254 214 246V194" />
        <path d="M152 214H188" strokeDasharray="none" />
      </g>
      <g data-p="fm-caja-luz" opacity="0" fill="none" stroke={C.claro} strokeWidth="6" strokeLinejoin="round" strokeLinecap="round">
        <rect x="118" y="170" width="104" height="24" rx="5" />
        <path d="M126 194V246Q126 254 134 254H206Q214 254 214 246V194" />
        <path d="M152 214H188" />
      </g>

      {/* laptop, con su halo quieto */}
      <g filter={`url(#${uid}-halo)`} opacity="0.5" fill="none" stroke={C.cian} strokeWidth="10" strokeLinejoin="round">
        <rect x="410" y="110" width="190" height="140" rx="12" />
        <path d="M392 262H618L642 298Q645 304 638 304H372Q365 304 368 298Z" />
      </g>
      <rect x="410" y="110" width="190" height="140" rx="12" fill={C.fondo} stroke={C.claro} strokeWidth="10" />
      <path d="M392 262H618L642 298Q645 304 638 304H372Q365 304 368 298Z" fill={C.fondo} stroke={C.claro} strokeWidth="10" strokeLinejoin="round" />

      {/* escritorio limpio: la barra de tareas */}
      <path d="M428 230H582" stroke={C.borde} strokeWidth="3" strokeLinecap="round" />

      {/* ventanas desordenadas (en el cuadro final ya no están) */}
      {ventanas.map(([x, y, w, h, g], i) => (
        <g key={i} transform={`rotate(${g} ${x + w / 2} ${y + h / 2})`}>
          <g data-p="fm-desorden" opacity="0">
            <rect x={x} y={y} width={w} height={h} rx="5" fill={C.panel} stroke={C.pizarra} strokeWidth="3" />
            <path d={`M${x + 6} ${y + 10}H${x + w - 6}`} stroke={C.pizarra} strokeWidth="3" strokeLinecap="round" />
          </g>
        </g>
      ))}

      {/* barrido y barra de progreso */}
      <g data-p="fm-barrido" opacity="0">
        <path d="M424 127H586" stroke={C.cian} strokeOpacity="0.3" strokeWidth="10" strokeLinecap="round" />
        <path d="M424 127H586" stroke={C.cian} strokeWidth="3" strokeLinecap="round" />
      </g>
      <rect data-p="fm-barra-marco" opacity="0" x="445" y="206" width="120" height="12" rx="6" fill="none" stroke={C.via} strokeWidth="3" />
      <rect data-p="fm-barra" opacity="0" x="448" y="209" width="114" height="6" rx="3" fill={C.cian} />

      {/* los archivos: la copia de ida (oculta en el cuadro final) y la definitiva */}
      {FINAL.map(([cx, cy], i) => (
        <g key={i} transform={`translate(${cx - 14} ${cy - 17})`}>
          <g data-p="fm-archivo-ida" opacity="0">
            <Documento />
          </g>
          <g data-p="fm-archivo">
            <Documento />
          </g>
        </g>
      ))}

      {/* un pulso en la pantalla al terminar */}
      <rect data-p="fm-listo" opacity="0" x="410" y="110" width="190" height="140" rx="12" fill="none" stroke={C.cian} strokeOpacity="0.45" strokeWidth="18" />

      <Vineta uid={uid} />
    </>
  );
}

export const formateo: Escena = {
  descripcion: 'Ilustración: los archivos de la laptop pasan a un respaldo, la pantalla se limpia y los archivos vuelven en orden.',
  Dibujo,
  pasos,
};
