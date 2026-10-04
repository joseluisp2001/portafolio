// Escena J — Cámaras de seguridad CCTV (2,8 s).
// La cámara barre la casa, alguien entra al campo de visión y llega el aviso al
// teléfono. Cuadro final: la cámara vigilando y el aviso en el teléfono.
import { C, CURVA, Fondo, Pista, Pulso, Vineta, recorrido, type Escena, type Paso } from './comun';

// Pivote de la cámara (el lente) y la persona que entra.
const LENTE: [number, number] = [392, 200];
const PERSONA: [number, number] = [262, 318];

const pasos: Paso[] = [
  {
    p: 'cm-barrido',
    kf: [{ transform: 'rotate(18deg)', easing: CURVA.inOut }, { transform: 'rotate(-14deg)', offset: 0.55, easing: CURVA.inOut }, { transform: 'rotate(0deg)' }],
    dur: 1500,
    delay: 200,
    ease: CURVA.lineal,
  },
  { p: 'cm-persona', kf: recorrido(PERSONA, [{ x: 120, y: 318, opacity: 0 }, { x: 170, y: 318 }, { x: PERSONA[0], y: PERSONA[1] }]), dur: 800, delay: 800, ease: CURVA.inOut },
  { p: 'cm-alerta', kf: [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0.35, offset: 0.6 }, { opacity: 1 }], dur: 500, delay: 1650 },
  { p: 'cm-onda', kf: [{ opacity: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 0 }], dur: 450, delay: 1750, escalon: 110 },
  { p: 'cm-aviso', kf: [{ opacity: 0, transform: 'translateY(-16px)' }, { opacity: 1, transform: 'translateY(0px)' }], dur: 400, delay: 2150 },
  { p: 'cm-vivo', kf: [{ opacity: 1 }, { opacity: 0.2, offset: 0.25 }, { opacity: 1, offset: 0.5 }, { opacity: 0.2, offset: 0.75 }, { opacity: 1 }], dur: 1200, delay: 400 },
];

function Persona() {
  return (
    <g fill="none" stroke={C.claro} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="0" cy="-34" r="10" fill={C.fondo} />
      <path d="M0 -22V6M0 6L-10 28M0 6L10 28M-14 -10L14 -10" />
    </g>
  );
}

function Dibujo({ uid }: { uid: string }) {
  return (
    <>
      <Fondo uid={uid} cx={330} cy={240} />

      <Pista uid={uid} d="M-10 90H60L80 110H120" via={[25, 90]} />
      <Pulso d="M-10 90H60L80 110H120" hover />

      {/* la casa */}
      <path d="M110 220L240 130L370 220V380H110Z" fill={C.fondo} stroke={C.claro} strokeWidth="7" strokeLinejoin="round" />
      <rect x="214" y="300" width="52" height="80" rx="4" fill="none" stroke={C.claro} strokeWidth="5" />
      <rect x="140" y="245" width="50" height="40" rx="4" fill="none" stroke={C.pizarra} strokeWidth="4" />
      <rect x="290" y="245" width="50" height="40" rx="4" fill="none" stroke={C.pizarra} strokeWidth="4" />

      {/* la cámara y su campo de visión, que barre (gira sobre el lente) */}
      <g transform={`translate(${LENTE[0]} ${LENTE[1]})`}>
        <g data-p="cm-barrido">
          <circle r="250" fill="none" stroke="none" />
          <path d="M0 0L-215 170L-100 235Z" fill={C.cian} fillOpacity="0.1" stroke={C.cian} strokeOpacity="0.45" strokeWidth="2" strokeLinejoin="round" />
          <path data-p="cm-alerta" d="M0 0L-215 170L-100 235Z" fill={C.cian} fillOpacity="0.16" stroke="none" />
        </g>
      </g>
      {/* poste: la cámara mira hacia la puerta */}
      <path d={`M${LENTE[0] + 31} ${LENTE[1] - 39}V380`} stroke={C.claro} strokeWidth="6" strokeLinecap="round" />
      <g transform={`rotate(-52 ${LENTE[0]} ${LENTE[1]})`}>
        <rect x={LENTE[0] - 4} y={LENTE[1] - 16} width="54" height="30" rx="8" fill={C.fondo} stroke={C.claro} strokeWidth="6" />
        <circle cx={LENTE[0] + 4} cy={LENTE[1] - 1} r="6" fill={C.cian} />
      </g>

      {/* la persona que entra al campo */}
      <g transform={`translate(${PERSONA[0]} ${PERSONA[1]})`}>
        <g data-p="cm-persona">
          <Persona />
        </g>
      </g>

      {/* señal hacia el teléfono */}
      {[0, 1, 2].map((k) => (
        <path key={k} data-p="cm-onda" d={`M${470 + k * 16} ${170 - k * 14}A${30 + k * 20} ${30 + k * 20} 0 0 1 ${470 + k * 16} ${230 + k * 14}`} fill="none" stroke={C.cian} strokeWidth="4" strokeLinecap="round" opacity="0" />
      ))}

      {/* el teléfono con la vista en vivo */}
      <rect x="560" y="70" width="160" height="300" rx="24" fill="none" stroke={C.cian} strokeWidth="10" opacity="0.45" filter={`url(#${uid}-halo)`} />
      <rect x="560" y="70" width="160" height="300" rx="24" fill={C.fondo} stroke={C.claro} strokeWidth="7" />
      <rect x="576" y="150" width="128" height="96" rx="6" fill={C.panel} />
      <path d="M592 222L630 192L668 222V240H592Z" fill="none" stroke={C.pizarra} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="618" cy="222" r="5" fill={C.claro} />
      <circle data-p="cm-vivo" cx="690" cy="162" r="5" fill={C.cian} />
      <rect x="576" y="258" width="128" height="10" rx="5" fill={C.borde} />
      <rect x="576" y="276" width="90" height="10" rx="5" fill={C.borde} />

      {/* el aviso */}
      <g data-p="cm-aviso">
        <rect x="572" y="92" width="136" height="44" rx="10" fill={C.cian} />
        <path d="M594 124V112A10 10 0 0 1 614 112V124L618 128H590Z" fill="none" stroke={C.fondo} strokeWidth="3.5" strokeLinejoin="round" />
        <rect x="626" y="104" width="66" height="7" rx="3.5" fill={C.fondo} />
        <rect x="626" y="118" width="44" height="7" rx="3.5" fill={C.fondo} fillOpacity="0.6" />
      </g>

      <Vineta uid={uid} />
    </>
  );
}

export const camaras: Escena = {
  descripcion: 'Ilustración: la cámara vigila la casa, detecta que alguien entra y manda el aviso con la vista en vivo al teléfono.',
  Dibujo,
  pasos,
};
