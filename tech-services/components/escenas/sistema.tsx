// Escena M — Sistemas a medida (2,8 s).
// Los módulos del panel entran y encajan en sus huecos mientras un engranaje gira
// (se ajusta al negocio); después las barras crecen y la tabla se llena.
// Cuadro final: el panel completo, hecho a la medida.
import { C, CURVA, Fondo, Pista, Pulso, Vineta, type Escena, type Paso } from './comun';

// Engranaje de 8 dientes centrado en (0, 0).
const ENGRANAJE = (() => {
  const puntos: string[] = [];
  const n = 8;
  for (let i = 0; i < n * 4; i++) {
    const a = (i / (n * 4)) * Math.PI * 2;
    const r = i % 4 === 1 || i % 4 === 2 ? 36 : 27;
    puntos.push(`${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`);
  }
  return `M${puntos.join('L')}Z`;
})();

const MODULOS = [
  { p: 'st-kpi', desde: 'translate(0px, -90px) rotate(-4deg)', delay: 250 },
  { p: 'st-grafico', desde: 'translate(-150px, 30px) rotate(5deg)', delay: 450 },
  { p: 'st-tabla', desde: 'translate(170px, 20px) rotate(-5deg)', delay: 650 },
];
const BARRAS = [44, 66, 52, 84, 70];

const pasos: Paso[] = [
  ...MODULOS.map<Paso>(({ p, desde, delay }) => ({ p, kf: [{ transform: desde, opacity: 0.4 }, { transform: 'translate(0px, 0px) rotate(0deg)', opacity: 1 }], dur: 600, delay })),
  { p: 'st-engranaje', kf: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(135deg)' }], dur: 1300, delay: 200, ease: CURVA.inOut },
  { p: 'st-barra', kf: [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], dur: 450, delay: 1350, escalon: 90, origen: '50% 100%' },
  { p: 'st-fila', kf: [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], dur: 350, delay: 1500, escalon: 90, origen: '0 50%' },
  { p: 'st-linea', kf: [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], dur: 500, delay: 1900, escalon: 120, ease: CURVA.inOut },
];

function Dibujo({ uid }: { uid: string }) {
  const hueco = { fill: 'none', stroke: C.via, strokeWidth: 2.5, strokeDasharray: '6 6' } as const;
  return (
    <>
      <Fondo uid={uid} cx={410} cy={215} />

      <Pista uid={uid} d="M-10 330H120L150 300H198" via={[50, 330]} pad={[198, 300]} />
      <Pulso d="M-10 330H120L150 300H198" hover />

      {/* el engranaje: el sistema se ajusta al negocio */}
      <g transform="translate(690 110)">
        <g data-p="st-engranaje">
          <path d={ENGRANAJE} fill={C.fondo} stroke={C.claro} strokeWidth="6" strokeLinejoin="round" />
          <circle r="10" fill="none" stroke={C.claro} strokeWidth="6" />
        </g>
      </g>
      <path d="M654 140L614 166" stroke={C.cobre} strokeWidth="3.5" strokeLinecap="round" />

      {/* el panel con su halo quieto */}
      <rect x="210" y="55" width="400" height="320" rx="14" fill="none" stroke={C.cian} strokeWidth="10" opacity="0.45" filter={`url(#${uid}-halo)`} />
      <rect x="210" y="55" width="400" height="320" rx="14" fill={C.fondo} stroke={C.claro} strokeWidth="7" />
      <path d="M210 92H610M270 92V375" stroke={C.claro} strokeWidth="4" />
      <rect x="300" y="66" width="140" height="14" rx="7" fill={C.panel} />
      {[112, 146, 180, 214].map((y, i) => (
        <rect key={y} x="228" y={y} width="24" height="20" rx="5" fill={i === 0 ? C.cian : 'none'} stroke={i === 0 ? 'none' : C.pizarra} strokeWidth="3" />
      ))}

      {/* huecos punteados donde encaja cada módulo */}
      <rect x="286" y="106" width="308" height="50" rx="8" {...hueco} />
      <rect x="286" y="166" width="180" height="194" rx="8" {...hueco} />
      <rect x="476" y="166" width="118" height="194" rx="8" {...hueco} />

      {/* módulo: indicadores */}
      <g data-p="st-kpi">
        {[286, 390, 494].map((x) => (
          <g key={x}>
            <rect x={x} y="106" width="100" height="50" rx="8" fill={C.panel} />
            <rect x={x + 10} y="116" width="36" height="8" rx="4" fill={C.claro} />
            <path data-p="st-linea" d={`M${x + 10} 146L${x + 32} 136L${x + 52} 141L${x + 88} 124`} pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: 0 }} fill="none" stroke={C.cian} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
      </g>

      {/* módulo: gráfico de barras */}
      <g data-p="st-grafico">
        <rect x="286" y="166" width="180" height="194" rx="8" fill={C.panel} />
        <path d="M300 336H452" stroke={C.borde} strokeWidth="2" />
        {BARRAS.map((h, k) => (
          <rect key={k} data-p="st-barra" x={304 + k * 30} y={336 - h * 1.8} width="20" height={h * 1.8} rx="4" fill={k === 3 ? C.claro : C.cian} />
        ))}
      </g>

      {/* módulo: tabla */}
      <g data-p="st-tabla">
        <rect x="476" y="166" width="118" height="194" rx="8" fill={C.panel} />
        {[184, 218, 252, 286, 320].map((y) => (
          <g key={y}>
            <circle cx="492" cy={y} r="6" fill="none" stroke={C.pizarra} strokeWidth="2.5" />
            <rect data-p="st-fila" x="506" y={y - 4} width="74" height="8" rx="4" fill={C.pizarra} />
          </g>
        ))}
      </g>

      <Vineta uid={uid} />
    </>
  );
}

export const sistema: Escena = {
  descripcion: 'Ilustración: los módulos del sistema encajan en el panel mientras un engranaje gira, y después se llenan el gráfico y la tabla.',
  Dibujo,
  pasos,
};
