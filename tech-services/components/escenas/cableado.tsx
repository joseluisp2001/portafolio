// Escena I — Cableado de red estructurado (2,8 s).
// El enredo de cables desaparece; cables prolijos salen del switch a la toma de
// cada cuarto y se prenden sus puertos. Cuadro final: todo ordenado y conectado.
import { C, CURVA, Fondo, Pista, Pulso, Vineta, type Escena, type Paso } from './comun';

// Cable de cada puerto (y) a la toma de su cuarto, con curvas prolijas.
const CABLES = [
  { d: 'M246 186H292Q300 186 300 178V108Q300 100 308 100H366', toma: [380, 100] },
  { d: 'M246 202H300Q308 202 308 194V124Q308 116 316 116H510Q518 116 518 108V100H676', toma: [690, 100] },
  { d: 'M246 218H292Q300 218 300 226V342Q300 350 308 350H356', toma: [370, 350] },
  // La del cuarto 4 va arriba a la izquierda del cuarto: abajo a la derecha la tapa el botón Repetir.
  { d: 'M246 234H284Q292 234 292 242V358Q292 366 300 366H610Q618 366 618 358V298Q618 290 626 290H636', toma: [650, 290] },
];
const EMPIEZA = 500;
const ENTRE = 260;
const TIRA = 650;

const pasos: Paso[] = [
  { p: 'cb-enredo', kf: [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.85)' }], dur: 400, delay: 200 },
  {
    p: 'cb-cable',
    kf: [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
    dur: TIRA,
    delay: EMPIEZA,
    escalon: ENTRE,
    ease: CURVA.inOut,
  },
  { p: 'cb-led', kf: [{ opacity: 0 }, { opacity: 1 }], dur: 200, delay: 0, delays: CABLES.map((_, i) => EMPIEZA + i * ENTRE + TIRA - 60) },
  { p: 'cb-toma', kf: [{ opacity: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 0.85 }], dur: 350, delay: 0, delays: CABLES.map((_, i) => EMPIEZA + i * ENTRE + TIRA - 60) },
];

function Dibujo({ uid }: { uid: string }) {
  return (
    <>
      <Fondo uid={uid} cx={420} cy={225} />

      <Pista uid={uid} d="M-10 110H40L60 130H90" via={[20, 110]} />
      <Pulso d="M-10 110H40L60 130H90" hover />

      {/* planta: cuatro cuartos */}
      <rect x="320" y="60" width="420" height="330" rx="8" fill="none" stroke={C.claro} strokeWidth="6" />
      <path d="M520 60V200M320 230H470M530 230H740M600 260V390" stroke={C.claro} strokeWidth="6" strokeLinecap="round" />

      {/* el switch con su halo quieto */}
      <rect x="90" y="150" width="156" height="120" rx="12" fill="none" stroke={C.cian} strokeWidth="10" opacity="0.45" filter={`url(#${uid}-halo)`} />
      <rect x="90" y="150" width="156" height="120" rx="12" fill={C.fondo} stroke={C.claro} strokeWidth="7" />
      {/* puertos: cuatro en uso (a la derecha) y cuatro libres */}
      {[0, 1, 2, 3].map((k) => (
        <g key={k}>
          <rect x="108" y={177 + k * 16} width="20" height="12" rx="2" fill="none" stroke={C.via} strokeWidth="2.5" />
          <rect x="206" y={180 + k * 16} width="20" height="12" rx="2" fill={C.panel} stroke={C.claro} strokeWidth="2.5" />
          <circle cx="146" cy={183 + k * 16} r="3.5" fill={C.via} />
          <circle data-p="cb-led" cx="146" cy={183 + k * 16} r="3.5" fill={C.cian} />
        </g>
      ))}

      {/* el enredo de antes (en el cuadro final ya no está) */}
      <path
        data-p="cb-enredo"
        opacity="0"
        d="M250 190C300 140 280 260 330 210S300 120 360 170S330 300 290 250S380 230 350 300S250 330 300 280"
        fill="none"
        stroke={C.pizarra}
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* los cables prolijos, que se tienden */}
      {CABLES.map((c, i) => (
        <path key={i} data-p="cb-cable" d={c.d} pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: 0 }} fill="none" stroke={C.cian} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      ))}

      {/* tomas de pared en cada cuarto */}
      {CABLES.map(({ toma: [x, y] }, i) => (
        <g key={i}>
          <rect x={x - 14} y={y - 12} width="28" height="24" rx="4" fill={C.fondo} stroke={C.claro} strokeWidth="4" />
          <rect x={x - 6} y={y - 4} width="12" height="9" rx="1.5" fill={C.via} />
          <circle data-p="cb-toma" cx={x} cy={y} r="22" fill={`url(#${uid}-luz)`} opacity="0.85" />
        </g>
      ))}

      <Vineta uid={uid} />
    </>
  );
}

export const cableado: Escena = {
  descripcion: 'Ilustración: el enredo de cables desaparece y cables prolijos salen del switch a la toma de cada cuarto, que queda conectada.',
  Dibujo,
  pasos,
};
