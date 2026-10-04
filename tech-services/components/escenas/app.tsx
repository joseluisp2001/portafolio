// Escena L — Desarrollo de apps (2,7 s).
// La idea (un bombillo) se enciende y viaja al teléfono, donde la app se arma
// pieza por pieza; el indicador de la barra de pestañas se mueve. Cuadro final:
// la app terminada.
import { C, CURVA, Fondo, Pista, Pulso, Vineta, type Escena, type Paso } from './comun';

const pasos: Paso[] = [
  { p: 'ap-luz', kf: [{ opacity: 0 }, { opacity: 1, offset: 0.5 }, { opacity: 0.6, offset: 0.7 }, { opacity: 1 }], dur: 500, delay: 150 },
  { p: 'ap-pulso', kf: [{ strokeDashoffset: 14 }, { strokeDashoffset: -104 }], dur: 500, delay: 550, ease: CURVA.inOut },
  {
    p: 'ap-pieza',
    kf: [{ opacity: 0, transform: 'translateY(12px) scale(0.96)' }, { opacity: 1, transform: 'translateY(0px) scale(1)' }],
    dur: 380,
    delay: 1000,
    escalon: 130,
  },
  { p: 'ap-indicador', kf: [{ transform: 'translateX(-34px)' }, { transform: 'translateX(0px)' }], dur: 400, delay: 2000, ease: CURVA.inOut },
  { p: 'ap-listo', kf: [{ opacity: 0, transform: 'scale(0.5)' }, { opacity: 1, transform: 'scale(1)' }], dur: 350, delay: 2300 },
];

function Dibujo({ uid }: { uid: string }) {
  return (
    <>
      <Fondo uid={uid} cx={470} cy={225} />

      <Pista uid={uid} d="M-10 360H110L130 340H180" via={[50, 360]} />
      <Pulso d="M-10 360H110L130 340H180" hover />

      {/* la idea: un bombillo que se enciende */}
      <circle cx="200" cy="190" r="70" fill={`url(#${uid}-luz)`} data-p="ap-luz" />
      <g fill="none" stroke={C.claro} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M200 140A40 40 0 0 0 176 212C182 218 184 226 184 234H216C216 226 218 218 224 212A40 40 0 0 0 200 140Z" fill={C.fondo} />
        <path d="M186 250H214M190 264H210" />
      </g>
      <path d="M190 200L200 188L210 200" fill="none" stroke={C.cian} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

      {/* de la idea al teléfono */}
      <Pista uid={uid} d="M246 190H330L350 170H388" pad={[388, 170]} />
      <Pulso d="M246 190H330L350 170H388" p="ap-pulso" />

      {/* el teléfono con su halo quieto */}
      <rect x="400" y="35" width="176" height="380" rx="26" fill="none" stroke={C.cian} strokeWidth="10" opacity="0.45" filter={`url(#${uid}-halo)`} />
      <rect x="400" y="35" width="176" height="380" rx="26" fill={C.fondo} stroke={C.claro} strokeWidth="8" />
      <path d="M468 52H508" stroke={C.claro} strokeWidth="4" strokeLinecap="round" />

      {/* la app, pieza por pieza */}
      <g data-p="ap-pieza">
        <rect x="416" y="68" width="144" height="40" rx="8" fill={C.cian} />
        <circle cx="436" cy="88" r="9" fill={C.fondo} />
        <rect x="452" y="84" width="60" height="8" rx="4" fill={C.fondo} />
      </g>
      <g data-p="ap-pieza">
        <rect x="416" y="118" width="144" height="84" rx="8" fill={C.panel} />
        <path d="M424 194L452 164L472 184L484 172L552 194Z" fill="none" stroke={C.pizarra} strokeWidth="3" strokeLinejoin="round" />
        <circle cx="530" cy="140" r="7" fill={C.pizarra} />
      </g>
      {[212, 256, 300].map((y) => (
        <g key={y} data-p="ap-pieza">
          <rect x="416" y={y} width="144" height="36" rx="8" fill={C.panel} />
          <circle cx="434" cy={y + 18} r="8" fill="none" stroke={C.cian} strokeWidth="3" />
          <rect x="450" y={y + 10} width="80" height="6" rx="3" fill={C.claro} fillOpacity="0.85" />
          <rect x="450" y={y + 22} width="54" height="5" rx="2.5" fill={C.pizarra} />
        </g>
      ))}
      {/* barra de pestañas; el indicador va adentro para aparecer con ella
          (suelto se veía desde el cuadro 0, antes que la barra) */}
      <g data-p="ap-pieza">
        <path d="M404 352H572" stroke={C.borde} strokeWidth="2" />
        {[432, 466, 500, 534].map((x) => (
          <rect key={x} x={x - 9} y="366" width="18" height="18" rx="5" fill="none" stroke={C.pizarra} strokeWidth="3" />
        ))}
        <rect data-p="ap-indicador" x="455" y="392" width="22" height="4" rx="2" fill={C.cian} />
      </g>

      {/* sello de listo */}
      <g data-p="ap-listo">
        <circle cx="584" cy="60" r="20" fill={C.cian} />
        <path d="M574 60L581 67L595 53" fill="none" stroke={C.fondo} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <Vineta uid={uid} />
    </>
  );
}

export const app: Escena = {
  descripcion: 'Ilustración: una idea se enciende y pasa al teléfono, donde la aplicación se arma pieza por pieza hasta quedar lista.',
  Dibujo,
  pasos,
};
