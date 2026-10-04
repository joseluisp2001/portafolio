// Escena H — Automatización con n8n (2,6 s).
// Un dato recorre formulario → correo → factura → registro; cada nodo se enciende
// con su visto cuando llega. Cuadro final: el flujo completo, sin trabajo manual.
import { C, CURVA, Fondo, Pista, Pulso, Vineta, recorrido, type Escena, type Paso } from './comun';

const NODOS = [150, 316, 482, 648]; // centros en x
const Y = 215;
const LLEGA = [250, 800, 1350, 1900]; // cuándo el dato llega a cada nodo

const pasos: Paso[] = [
  {
    p: 'n8-dato',
    // viaja de nodo en nodo y se apaga en el último
    kf: recorrido([NODOS[3], Y], [
      { x: NODOS[0], y: Y, escala: 0.6 },
      { x: NODOS[1], y: Y },
      { x: NODOS[2], y: Y },
      { x: NODOS[3], y: Y, escala: 0.6, opacity: 0 },
    ]),
    dur: 1650,
    delay: 250,
    ease: CURVA.lineal,
  },
  { p: 'n8-luz', kf: [{ opacity: 0 }, { opacity: 1 }], dur: 250, delay: 0, delays: LLEGA },
  { p: 'n8-visto', kf: [{ opacity: 0, transform: 'scale(0.5)' }, { opacity: 1, transform: 'scale(1)' }], dur: 300, delay: 0, delays: LLEGA.map((t) => t + 120) },
  { p: 'n8-rayo', kf: [{ opacity: 1 }, { opacity: 0.3, offset: 0.5 }, { opacity: 1 }], dur: 300, delay: 100 },
];

// Íconos de los nodos, centrados en (0, 0), 44 × 44.
const ICONOS = [
  // formulario
  <g key="f">
    <rect x="-16" y="-20" width="32" height="40" rx="4" />
    <path d="M-8 -8H8M-8 0H8M-8 8H2" />
  </g>,
  // correo
  <g key="c">
    <rect x="-20" y="-14" width="40" height="28" rx="4" />
    <path d="M-20 -12L0 3L20 -12" />
  </g>,
  // factura
  <g key="r">
    <path d="M-15 -20H15V20L10 16L5 20L0 16L-5 20L-10 16L-15 20Z" />
    <path d="M-8 -9H8M-8 -1H8M-8 7H3" />
  </g>,
  // registro (una tabla)
  <g key="t">
    <rect x="-20" y="-16" width="40" height="32" rx="4" />
    <path d="M-20 -5H20M-20 6H20M-5 -16V16" />
  </g>,
];

function Dibujo({ uid }: { uid: string }) {
  const trazo = { fill: 'none', strokeWidth: 3.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <>
      <Fondo uid={uid} cx={400} cy={215} />

      <Pista uid={uid} d="M-10 360H120L150 330H400" via={[60, 360]} />
      <Pulso d="M-10 360H120L150 330H400" hover />

      {/* conexiones entre nodos, curvas como en n8n */}
      {NODOS.slice(0, 3).map((x, i) => (
        <path key={x} d={`M${x + 44} ${Y}C${x + 83} ${Y} ${NODOS[i + 1] - 83} ${Y} ${NODOS[i + 1] - 44} ${Y}`} fill="none" stroke={C.cobre} strokeWidth="4" />
      ))}

      {/* el disparador: un rayo sobre el primer nodo */}
      <path data-p="n8-rayo" d={`M${NODOS[0] + 4} 128L${NODOS[0] - 8} 150H${NODOS[0] + 4}L${NODOS[0] - 6} 170`} {...trazo} stroke={C.cian} strokeWidth="4" />

      {NODOS.map((x, i) => (
        <g key={x}>
          <rect x={x - 44} y={Y - 44} width="88" height="88" rx="18" fill={C.fondo} stroke={C.claro} strokeWidth="6" />
          <rect data-p="n8-luz" x={x - 44} y={Y - 44} width="88" height="88" rx="18" fill="none" stroke={C.cian} strokeWidth="6" />
          <g transform={`translate(${x} ${Y})`} {...trazo} stroke={C.claro}>
            {ICONOS[i]}
          </g>
          {/* visto del nodo */}
          <g data-p="n8-visto">
            <circle cx={x + 40} cy={Y - 40} r="15" fill={C.cian} />
            <path d={`M${x + 33} ${Y - 40}L${x + 38} ${Y - 35}L${x + 47} ${Y - 45}`} fill="none" stroke={C.fondo} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      ))}

      {/* el dato que viaja (en el cuadro final ya llegó) */}
      <g transform={`translate(${NODOS[3]} ${Y})`}>
        <g data-p="n8-dato" opacity="0">
          <circle r="16" fill={C.cian} fillOpacity="0.3" />
          <circle r="8" fill={C.cian} />
        </g>
      </g>

      <Vineta uid={uid} />
    </>
  );
}

export const n8n: Escena = {
  descripcion: 'Ilustración: un dato pasa solo del formulario al correo, a la factura y al registro, y cada paso queda marcado como hecho.',
  Dibujo,
  pasos,
};
