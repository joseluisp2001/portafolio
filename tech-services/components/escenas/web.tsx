// Escena G — Diseño de página web (2,7 s).
// La página se arma bloque por bloque sobre su esqueleto, el cursor pulsa el
// botón y aparece la versión de teléfono. Cuadro final: el sitio listo en las dos.
import { C, CURVA, Fondo, Pista, Pulso, Vineta, recorrido, type Escena, type Paso } from './comun';

// Punta del cursor al final (sobre el botón) y de dónde viene.
const CURSOR_FIN: [number, number] = [340, 176];

const pasos: Paso[] = [
  {
    p: 'wb-bloque',
    kf: [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0px)' }],
    dur: 400,
    delay: 250,
    escalon: 150,
  },
  {
    p: 'wb-cursor',
    kf: recorrido(CURSOR_FIN, [{ x: 560, y: 330, opacity: 0 }, { x: 520, y: 300 }, { x: CURSOR_FIN[0], y: CURSOR_FIN[1] }]),
    dur: 650,
    delay: 1250,
    ease: CURVA.inOut,
  },
  { p: 'wb-boton', kf: [{ transform: 'scale(1)' }, { transform: 'scale(0.92)', offset: 0.4 }, { transform: 'scale(1)' }], dur: 260, delay: 1950 },
  // Nace invisible: con el relleno hacia atrás se veía suelto desde el cuadro 0.
  { p: 'wb-onda', kf: [{ opacity: 0, transform: 'scale(0.4)' }, { opacity: 0.9, transform: 'scale(0.5)', offset: 0.08 }, { opacity: 0, transform: 'scale(1.8)' }], dur: 500, delay: 1980 },
  { p: 'wb-telefono', kf: [{ opacity: 0, transform: 'translateX(24px)' }, { opacity: 1, transform: 'translateX(0px)' }], dur: 450, delay: 2200 },
];

function Dibujo({ uid }: { uid: string }) {
  // Esqueleto punteado: se ve debajo mientras los bloques no llegan.
  const huecos: Array<[number, number, number, number]> = [
    [290, 116, 280, 70],
    [290, 196, 88, 70],
    [386, 196, 88, 70],
    [482, 196, 88, 70],
    [290, 276, 280, 26],
  ];
  return (
    <>
      <Fondo uid={uid} cx={430} cy={210} />

      <Pista uid={uid} d="M-10 140H150L180 170H258" via={[70, 140]} pad={[258, 170]} />
      <Pista uid={uid} d="M-10 300H258" via={[100, 300]} pad={[258, 300]} />
      <Pulso d="M-10 300H258" hover />

      {/* el navegador con su halo quieto */}
      <rect x="270" y="66" width="320" height="252" rx="14" fill="none" stroke={C.cian} strokeWidth="10" opacity="0.45" filter={`url(#${uid}-halo)`} />
      <rect x="270" y="66" width="320" height="252" rx="14" fill={C.fondo} stroke={C.claro} strokeWidth="8" />
      <path d="M270 100H590" stroke={C.claro} strokeWidth="4" />
      {[290, 306, 322].map((x) => (
        <circle key={x} cx={x} cy="83" r="4.5" fill={C.pizarra} />
      ))}
      <rect x="345" y="76" width="180" height="14" rx="7" fill={C.panel} />

      {huecos.map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx="8" fill="none" stroke={C.via} strokeWidth="2.5" strokeDasharray="6 6" />
      ))}

      {/* portada: titular, bajada, botón e imagen */}
      <g data-p="wb-bloque">
        <rect x="290" y="116" width="280" height="70" rx="8" fill={C.panel} />
        <rect x="304" y="130" width="140" height="11" rx="5.5" fill={C.claro} />
        <rect x="304" y="148" width="100" height="7" rx="3.5" fill={C.pizarra} />
        <g transform="translate(333 170)">
          <rect data-p="wb-boton" x="-29" y="-7" width="58" height="14" rx="7" fill={C.cian} />
        </g>
        <rect x="482" y="124" width="76" height="54" rx="6" fill={C.fondo} stroke={C.pizarra} strokeWidth="2.5" />
        <path d="M488 172L505 154L517 166L525 158L552 172" fill="none" stroke={C.pizarra} strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="541" cy="138" r="5" fill={C.pizarra} />
      </g>
      {/* tres tarjetas */}
      {[290, 386, 482].map((x) => (
        <g key={x} data-p="wb-bloque">
          <rect x={x} y="196" width="88" height="70" rx="8" fill={C.panel} />
          <circle cx={x + 18} cy="216" r="8" fill="none" stroke={C.cian} strokeWidth="3" />
          <rect x={x + 10} y="234" width="64" height="6" rx="3" fill={C.pizarra} />
          <rect x={x + 10} y="246" width="44" height="6" rx="3" fill={C.borde} />
        </g>
      ))}
      <g data-p="wb-bloque">
        <rect x="290" y="276" width="280" height="26" rx="6" fill={C.panel} />
        <rect x="302" y="286" width="60" height="6" rx="3" fill={C.pizarra} />
      </g>

      {/* el clic */}
      <circle data-p="wb-onda" cx="333" cy="170" r="22" fill="none" stroke={C.cian} strokeWidth="3" opacity="0" />
      <g transform={`translate(${CURSOR_FIN[0]} ${CURSOR_FIN[1]})`}>
        <path data-p="wb-cursor" d="M0 0L0 26L7 19L12 30L17 28L12 17L22 17Z" fill={C.claro} stroke={C.fondo} strokeWidth="2.5" strokeLinejoin="round" />
      </g>

      {/* la misma página en el teléfono */}
      <g data-p="wb-telefono">
        <rect x="620" y="120" width="92" height="170" rx="16" fill={C.fondo} stroke={C.claro} strokeWidth="6" />
        <rect x="632" y="140" width="68" height="36" rx="5" fill={C.panel} />
        <rect x="638" y="148" width="40" height="6" rx="3" fill={C.claro} />
        <rect x="638" y="162" width="22" height="8" rx="4" fill={C.cian} />
        <rect x="632" y="184" width="68" height="26" rx="5" fill={C.panel} />
        <rect x="632" y="216" width="68" height="26" rx="5" fill={C.panel} />
        <rect x="632" y="248" width="68" height="26" rx="5" fill={C.panel} />
      </g>

      <Vineta uid={uid} />
    </>
  );
}

export const web: Escena = {
  descripcion: 'Ilustración: la página web se arma bloque por bloque, el cursor pulsa el botón y aparece la misma página en el teléfono.',
  Dibujo,
  pasos,
};
