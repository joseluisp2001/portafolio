// Escena B — Mantenimiento profundo (2,6 s).
// El ventilador acelera y suelta el polvo, el termómetro baja y un pulso recorre
// las pistas. Cuadro final: ventilador limpio, temperatura baja.
import { C, CURVA, Fondo, Pista, Pulso, Vineta, type Escena, type Paso } from './comun';

const CX = 430;
const CY = 225;

// Motas de polvo sobre las aspas: posición fija y hacia dónde salen despedidas.
const POLVO = Array.from({ length: 14 }, (_, k) => {
  const ang = ((k * 360) / 14 + 10) * (Math.PI / 180);
  const r = 34 + ((k * 17) % 46);
  const lejos = 70 + (k % 4) * 22;
  return {
    x: Math.round(CX + r * Math.cos(ang)),
    y: Math.round(CY + r * Math.sin(ang)),
    r: 5 + (k % 4),
    dx: Math.round(Math.cos(ang) * lejos),
    dy: Math.round(Math.sin(ang) * lejos),
  };
});

// Termómetro: la columna final llega al 35 %; al empezar, al 90 %.
const TUBO_ABAJO = 270;
const TUBO_ALTO = 140;
const NIVEL_FINAL = 0.35;
const NIVEL_INICIO = 0.9;
const COL_Y = TUBO_ABAJO - TUBO_ALTO * NIVEL_FINAL;
const COL_ALTO = 290 - COL_Y;
const ESCALA_INICIO = (290 - (TUBO_ABAJO - TUBO_ALTO * NIVEL_INICIO)) / COL_ALTO;

const pasos: Paso[] = [
  { p: 'lp-aspas', kf: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(576deg)' }], dur: 1500, delay: 200, ease: CURVA.inOut },
  {
    p: 'lp-polvo',
    kf: (i) => [
      { transform: 'translate(0px, 0px)', opacity: 1 },
      { transform: `translate(${POLVO[i].dx}px, ${POLVO[i].dy}px)`, opacity: 0 },
    ],
    dur: 700,
    delay: 450,
    // 25 ms entre motas, sin tope: una ráfaga pareja y no un golpe al final
    delays: POLVO.map((_, k) => 450 + k * 25),
  },
  { p: 'lp-columna', kf: [{ transform: `scaleY(${ESCALA_INICIO})` }, { transform: 'scaleY(1)' }], dur: 1000, delay: 800, origen: '50% 100%' },
  {
    p: 'lp-columna-blanca',
    kf: [{ transform: `scaleY(${ESCALA_INICIO})`, opacity: 1 }, { transform: 'scaleY(1)', opacity: 0 }],
    dur: 1000,
    delay: 800,
    origen: '50% 100%',
  },
  { p: 'lp-bulbo-blanco', kf: [{ opacity: 1 }, { opacity: 0 }], dur: 1000, delay: 800 },
  { p: 'lp-pulso', kf: [{ strokeDashoffset: 14 }, { strokeDashoffset: -104 }], dur: 700, delay: 1800, escalon: 120, ease: CURVA.inOut },
];

// Un aspa apuntando hacia arriba, en coordenadas locales del ventilador.
const ASPA = 'M-9 -22C-34 -58 -6 -88 26 -82C18 -60 14 -40 9 -22Z';

function Dibujo({ uid }: { uid: string }) {
  return (
    <>
      <Fondo uid={uid} cx={CX} cy={CY} />

      <Pista uid={uid} d="M-10 140H150L175 165H305" via={[60, 140]} pad={[305, 165]} />
      <Pista uid={uid} d="M-10 225H305" pad={[305, 225]} />
      <Pista uid={uid} d="M-10 310H140L165 285H305" via={[60, 310]} pad={[305, 285]} />
      <Pulso d="M-10 225H305" hover />
      <Pulso d="M305 165H175L150 140H-10" p="lp-pulso" />
      <Pulso d="M305 285H165L140 310H-10" p="lp-pulso" />

      {/* carcasa con su halo quieto */}
      <rect x="318" y="113" width="224" height="224" rx="28" fill="none" stroke={C.cian} strokeWidth="10" opacity="0.45" filter={`url(#${uid}-halo)`} />
      <rect x="318" y="113" width="224" height="224" rx="28" fill={C.fondo} stroke={C.claro} strokeWidth="9" />
      {[[345, 140], [515, 140], [345, 310], [515, 310]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill="none" stroke={C.via} strokeWidth="3" />
      ))}
      <circle cx={CX} cy={CY} r="92" fill="none" stroke={C.via} strokeWidth="3" />

      {/* aspas: giran alrededor del centro (el círculo invisible centra la caja) */}
      <g transform={`translate(${CX} ${CY})`}>
        <g data-p="lp-aspas">
          <circle r="95" fill="none" stroke="none" />
          {[0, 72, 144, 216, 288].map((g) => (
            <path key={g} d={ASPA} transform={`rotate(${g})`} fill={C.fondo} stroke={C.claro} strokeWidth="6" strokeLinejoin="round" />
          ))}
          <circle r="18" fill={C.fondo} stroke={C.claro} strokeWidth="6" />
        </g>
      </g>

      {/* polvo (en el cuadro final ya no está) */}
      {POLVO.map((m, i) => (
        <circle key={i} data-p="lp-polvo" opacity="0" cx={m.x} cy={m.y} r={m.r} fill={C.pizarra} />
      ))}

      {/* termómetro */}
      <rect x="645" y="120" width="30" height="160" rx="15" fill={C.fondo} stroke={C.claro} strokeWidth="7" />
      <rect data-p="lp-columna" x="653" y={COL_Y} width="14" height={COL_ALTO} rx="7" fill={C.cian} />
      <rect data-p="lp-columna-blanca" opacity="0" x="653" y={COL_Y} width="14" height={COL_ALTO} rx="7" fill={C.claro} />
      <circle cx="660" cy="290" r="24" fill={C.fondo} stroke={C.claro} strokeWidth="7" />
      <circle cx="660" cy="290" r="14" fill={C.cian} />
      <circle data-p="lp-bulbo-blanco" opacity="0" cx="660" cy="290" r="14" fill={C.claro} />
      {[160, 200, 240].map((y) => (
        <path key={y} d={`M686 ${y}H698`} stroke={C.via} strokeWidth="3" strokeLinecap="round" />
      ))}

      <Vineta uid={uid} />
    </>
  );
}

export const limpieza: Escena = {
  descripcion: 'Ilustración: el ventilador se limpia, el polvo sale despedido y la temperatura baja.',
  Dibujo,
  pasos,
};
