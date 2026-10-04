// Escena D — Armado de PC a medida (2,8 s).
// Procesador, memorias, tarjeta de video y SSD entran a sus zócalos, se prende el
// LED y el ventilador de la tarjeta da una vuelta. Cuadro final: la placa armada.
import { C, CURVA, Fondo, Pista, Pulso, Vineta, type Escena, type Paso } from './comun';

// Dónde flota cada pieza antes de entrar (relativo a su lugar) y cuándo entra.
const PIEZAS = [
  { p: 'ar-cpu', desde: 'translate(-230px, -40px) rotate(-14deg)', delay: 200 },
  { p: 'ar-ram', desde: 'translate(190px, -70px) rotate(12deg)', delay: 380 },
  { p: 'ar-ram2', desde: 'translate(228px, -30px) rotate(8deg)', delay: 470 },
  { p: 'ar-gpu', desde: 'translate(-60px, 130px) rotate(-7deg)', delay: 650 },
  { p: 'ar-ssd', desde: 'translate(-262px, 40px) rotate(10deg)', delay: 830 },
];
const VUELO = 600;

const pasos: Paso[] = [
  ...PIEZAS.map<Paso>(({ p, desde, delay }) => ({
    p,
    kf: [{ transform: desde }, { transform: 'translate(0px, 0px) rotate(0deg)' }],
    dur: VUELO,
    delay,
  })),
  // destello en cada zócalo cuando la pieza encaja
  ...PIEZAS.map<Paso>(({ p, delay }) => ({
    p: `${p}-destello`,
    kf: [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }],
    dur: 450,
    delay: delay + VUELO - 80,
  })),
  { p: 'ar-led', kf: [{ opacity: 0 }, { opacity: 1 }], dur: 250, delay: 1900 },
  { p: 'ar-led-luz', kf: [{ opacity: 0 }, { opacity: 1 }], dur: 500, delay: 1900 },
  { p: 'ar-pulso', kf: [{ strokeDashoffset: 14 }, { strokeDashoffset: -104 }], dur: 650, delay: 1950, escalon: 100, ease: CURVA.inOut },
  { p: 'ar-ventilador', kf: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], dur: 550, delay: 2250, ease: CURVA.inOut },
];

const ZOCALOS = {
  cpu: <rect x="340" y="95" width="100" height="100" rx="8" />,
  ram: <rect x="470" y="90" width="22" height="140" rx="4" />,
  ram2: <rect x="505" y="90" width="22" height="140" rx="4" />,
  gpu: <rect x="330" y="262" width="210" height="18" rx="4" />,
  ssd: <rect x="345" y="330" width="120" height="22" rx="4" />,
};

function Memoria({ x }: { x: number }) {
  return (
    <>
      <rect x={x} y="94" width="18" height="132" rx="3" fill={C.panel} stroke={C.claro} strokeWidth="4" />
      {[104, 134, 164, 194].map((y) => (
        <rect key={y} x={x + 4} y={y} width="10" height="18" rx="1.5" fill={C.via} />
      ))}
    </>
  );
}

function Ventilador({ cx }: { cx: number }) {
  return (
    <g transform={`translate(${cx} 279)`}>
      <circle r="20" fill={C.fondo} stroke={C.claro} strokeWidth="4" />
      <g data-p="ar-ventilador">
        <circle r="20" fill="none" stroke="none" />
        {[0, 120, 240].map((g) => (
          <path key={g} d="M0 -3C-6 -10 -3 -17 4 -17C3 -11 3 -7 3 -3Z" transform={`rotate(${g})`} fill={C.claro} />
        ))}
      </g>
    </g>
  );
}

function Dibujo({ uid }: { uid: string }) {
  const borde = { fill: 'none', stroke: C.via, strokeWidth: 3, strokeDasharray: '6 6' } as const;
  const destello = { fill: 'none', stroke: C.cian, strokeWidth: 5 } as const;
  return (
    <>
      <Fondo uid={uid} cx={450} cy={225} />

      <Pista uid={uid} d="M292 160H150L120 130H-10" via={[60, 130]} />
      <Pista uid={uid} d="M608 300H700L730 270H810" via={[760, 270]} />
      <Pista uid={uid} d="M292 330H-10" via={[110, 330]} />
      <Pulso d="M292 160H150L120 130H-10" p="ar-pulso" />
      <Pulso d="M608 300H700L730 270H810" p="ar-pulso" />
      <Pulso d="M-10 330H292" hover />

      {/* la placa con su halo quieto */}
      <rect x="300" y="65" width="300" height="320" rx="16" fill="none" stroke={C.cian} strokeWidth="10" opacity="0.45" filter={`url(#${uid}-halo)`} />
      <rect x="300" y="65" width="300" height="320" rx="16" fill={C.fondo} stroke={C.claro} strokeWidth="8" />
      <path d="M320 240H388M580 90V240H548M470 240V252M560 330H580V300" fill="none" stroke={C.cobre} strokeWidth="3" strokeLinejoin="round" />

      {/* zócalos vacíos, punteados */}
      <g {...borde}>
        {ZOCALOS.cpu}
        {ZOCALOS.ram}
        {ZOCALOS.ram2}
        {ZOCALOS.gpu}
        {ZOCALOS.ssd}
      </g>

      {/* LED de encendido */}
      <circle cx="570" cy="355" r="22" fill={`url(#${uid}-luz)`} data-p="ar-led-luz" />
      <circle cx="570" cy="355" r="7" fill={C.via} />
      <circle cx="570" cy="355" r="7" fill={C.cian} data-p="ar-led" />

      {/* las piezas, en su lugar final */}
      <g data-p="ar-cpu">
        <rect x="348" y="103" width="84" height="84" rx="8" fill={C.panel} stroke={C.claro} strokeWidth="6" />
        <rect x="368" y="123" width="44" height="44" rx="4" fill="none" stroke={C.claro} strokeWidth="4" />
        <path d="M362 103V93M390 103V93M418 103V93M362 187V197M390 187V197M418 187V197M348 117H338M348 145H338M348 173H338M432 117H442M432 145H442M432 173H442" stroke={C.claro} strokeWidth="4" strokeLinecap="round" />
      </g>
      <g data-p="ar-ram">
        <Memoria x={472} />
      </g>
      <g data-p="ar-ram2">
        <Memoria x={507} />
      </g>
      <g data-p="ar-gpu">
        <rect x="316" y="246" width="8" height="66" rx="2" fill={C.panel} stroke={C.claro} strokeWidth="3" />
        <rect x="322" y="250" width="226" height="58" rx="8" fill={C.panel} stroke={C.claro} strokeWidth="6" />
        <Ventilador cx={380} />
        <Ventilador cx={450} />
        <path d="M494 266H532M494 279H532M494 292H520" stroke={C.via} strokeWidth="3" strokeLinecap="round" />
      </g>
      <g data-p="ar-ssd">
        <rect x="347" y="332" width="116" height="18" rx="3" fill={C.panel} stroke={C.claro} strokeWidth="4" />
        <rect x="360" y="337" width="40" height="8" rx="1.5" fill={C.via} />
      </g>

      {/* destellos al encajar (en el cuadro final ya se apagaron) */}
      <g data-p="ar-cpu-destello" opacity="0" {...destello}>{ZOCALOS.cpu}</g>
      <g data-p="ar-ram-destello" opacity="0" {...destello}>{ZOCALOS.ram}</g>
      <g data-p="ar-ram2-destello" opacity="0" {...destello}>{ZOCALOS.ram2}</g>
      <g data-p="ar-gpu-destello" opacity="0" {...destello}><rect x="322" y="250" width="226" height="58" rx="8" /></g>
      <g data-p="ar-ssd-destello" opacity="0" {...destello}><rect x="347" y="332" width="116" height="18" rx="3" /></g>

      <Vineta uid={uid} />
    </>
  );
}

export const armado: Escena = {
  descripcion: 'Ilustración: el procesador, las memorias, la tarjeta de video y el disco encajan en la placa y se prende la luz de encendido.',
  Dibujo,
  pasos,
};
