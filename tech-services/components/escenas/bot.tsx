// Escena F — Bot de WhatsApp con IA (2,6 s).
// De noche llega un mensaje; el bot escribe y contesta agendando, cotizando y
// cerrando; el calendario marca la cita. Cuadro final: la conversación completa.
import { C, CURVA, Fondo, Pista, Pulso, Vineta, type Escena, type Paso } from './comun';

const APARECE: Keyframe[] = [
  { opacity: 0, transform: 'translateY(10px) scale(0.92)' },
  { opacity: 1, transform: 'translateY(0px) scale(1)' },
];

const pasos: Paso[] = [
  { p: 'bt-cliente', kf: APARECE, dur: 350, delay: 0, delays: [200, 1600] },
  { p: 'bt-escribe', kf: [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], dur: 800, delay: 500 },
  {
    p: 'bt-punto',
    kf: [
      { transform: 'translateY(0px)' },
      { transform: 'translateY(-5px)', offset: 0.25 },
      { transform: 'translateY(0px)', offset: 0.5 },
      { transform: 'translateY(-5px)', offset: 0.75 },
      { transform: 'translateY(0px)' },
    ],
    dur: 700,
    delay: 550,
    escalon: 110,
  },
  { p: 'bt-bot', kf: APARECE, dur: 350, delay: 0, delays: [1250, 1900, 2200] },
  { p: 'bt-pulso', kf: [{ strokeDashoffset: 14 }, { strokeDashoffset: -104 }], dur: 450, delay: 1300, ease: CURVA.inOut },
  { p: 'bt-dia', kf: [{ opacity: 0, transform: 'scale(0.5)' }, { opacity: 1, transform: 'scale(1)' }], dur: 350, delay: 1650 },
  { p: 'bt-visto', kf: [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], dur: 300, delay: 1850, ease: CURVA.inOut },
];

// Burbuja con un renglón gris (lo que escribe la clienta).
function Cliente({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <g data-p="bt-cliente">
      <rect x={x} y={y} width={w} height="26" rx="10" fill={C.borde} />
      <rect x={x + 9} y={y + 10} width={w - 22} height="6" rx="3" fill={C.pizarra} />
    </g>
  );
}

function Dibujo({ uid }: { uid: string }) {
  const icono = { fill: 'none', stroke: C.fondo, strokeWidth: 3.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <>
      <Fondo uid={uid} cx={430} cy={225} />

      <Pista uid={uid} d="M-10 150H150L180 180H330" via={[70, 150]} pad={[330, 180]} />
      <Pista uid={uid} d="M-10 330H330" via={[90, 330]} pad={[330, 330]} />
      <Pulso d="M-10 330H330" hover />
      {/* del teléfono al calendario */}
      <Pista uid={uid} d="M530 205H585" />
      <Pulso d="M530 205H585" p="bt-pulso" />

      {/* la noche: luna y estrellas (atiende a cualquier hora) */}
      <path d="M252 84A42 42 0 1 0 296 138A34 34 0 1 1 252 84Z" fill={C.fondo} stroke={C.claro} strokeWidth="6" strokeLinejoin="round" />
      {[[208, 150, 4], [300, 92, 3], [238, 196, 3]].map(([x, y, r]) => (
        <path key={`${x}-${y}`} d={`M${x} ${y - r * 2}V${y + r * 2}M${x - r * 2} ${y}H${x + r * 2}`} stroke={C.claro} strokeOpacity="0.8" strokeWidth="2.5" strokeLinecap="round" />
      ))}

      {/* el teléfono con su halo quieto */}
      <rect x="345" y="35" width="170" height="380" rx="26" fill="none" stroke={C.cian} strokeWidth="10" opacity="0.45" filter={`url(#${uid}-halo)`} />
      <rect x="345" y="35" width="170" height="380" rx="26" fill={C.fondo} stroke={C.claro} strokeWidth="8" />
      <path d="M412 52H448" stroke={C.claro} strokeWidth="4" strokeLinecap="round" />
      {/* encabezado del chat: el bot */}
      <circle cx="382" cy="90" r="13" fill="none" stroke={C.cian} strokeWidth="3" />
      <circle cx="377" cy="89" r="2.2" fill={C.cian} />
      <circle cx="387" cy="89" r="2.2" fill={C.cian} />
      <rect x="402" y="86" width="62" height="8" rx="4" fill={C.borde} />
      <path d="M360 110H500" stroke={C.borde} strokeWidth="2" />

      <Cliente x={368} y={122} w={86} />

      {/* "escribiendo…" (en el cuadro final ya no está) */}
      <g data-p="bt-escribe" opacity="0">
        <rect x="440" y="158" width="52" height="24" rx="10" fill={C.fondo} stroke={C.cian} strokeWidth="2" />
        {[454, 466, 478].map((x) => (
          <circle key={x} data-p="bt-punto" cx={x} cy="170" r="3.5" fill={C.cian} />
        ))}
      </g>

      {/* respuesta 1: agenda */}
      <g data-p="bt-bot">
        <rect x="410" y="158" width="82" height="40" rx="10" fill={C.cian} />
        <g {...icono}>
          <rect x="440" y="166" width="22" height="22" rx="3" />
          <path d="M440 173H462M446 163V169M456 163V169" />
        </g>
      </g>

      <Cliente x={368} y={210} w={72} />

      {/* respuesta 2: cotiza (una etiqueta de precio) */}
      <g data-p="bt-bot">
        <rect x="420" y="248" width="72" height="40" rx="10" fill={C.cian} />
        <g {...icono}>
          <path d="M444 258H458L468 268L458 278H444Z" />
          <circle cx="450" cy="268" r="2" fill={C.fondo} stroke="none" />
        </g>
      </g>

      {/* respuesta 3: listo */}
      <g data-p="bt-bot">
        <rect x="432" y="298" width="60" height="32" rx="10" fill={C.cian} />
        <path d="M451 314L458 321L472 307" {...icono} />
      </g>

      {/* el calendario: se marca la cita */}
      <rect x="585" y="150" width="110" height="100" rx="10" fill={C.fondo} stroke={C.claro} strokeWidth="6" />
      <path d="M585 176H695M608 142V158M672 142V158" stroke={C.claro} strokeWidth="6" strokeLinecap="round" />
      {[0, 1, 2].map((c) =>
        [0, 1].map((f) => <rect key={`${c}-${f}`} x={600 + c * 28} y={188 + f * 26} width="22" height="18" rx="3" fill={C.panel} />),
      )}
      <rect data-p="bt-dia" x="628" y="214" width="22" height="18" rx="3" fill={C.cian} />
      <path data-p="bt-visto" d="M620 262L632 274L656 250" pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: 0 }} fill="none" stroke={C.cian} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

      <Vineta uid={uid} />
    </>
  );
}

export const bot: Escena = {
  descripcion: 'Ilustración: de noche llega un mensaje y el bot contesta solo: agenda, cotiza y cierra, y la cita queda marcada en el calendario.',
  Dibujo,
  pasos,
};
