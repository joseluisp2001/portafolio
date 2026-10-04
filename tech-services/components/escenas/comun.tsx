// Piezas comunes de las escenas de mantenimiento: el fondo de placa, las pistas
// y los pulsos. Son los mismos colores y gruesos de scripts/generar-ilustraciones.mjs,
// para que las escenas se vean de la misma familia que las ilustraciones fijas.
import type { ReactNode } from 'react';

export const C = {
  fondo: '#0F172A',
  panel: '#1E293B',
  borde: '#334155',
  cobre: '#3B4A60',
  via: '#475569',
  pizarra: '#64748B',
  claro: '#F8FAFC',
  cian: '#06B6D4',
  punto: 'rgba(148, 163, 184, 0.10)',
} as const;

export const CURVA = {
  tech: 'cubic-bezier(0.22, 1, 0.36, 1)', // --ease-tech: entrar y asentarse
  inOut: 'cubic-bezier(0.77, 0, 0.175, 1)', // lo que se mueve en pantalla
  lineal: 'linear', // giros y barras de progreso
} as const;

/** Un paso de la escena: anima todos los elementos con data-p igual a `p`. */
export interface Paso {
  p: string;
  kf: Keyframe[] | ((i: number) => Keyframe[]);
  dur: number;
  delay: number;
  /** ms entre elementos con el mismo data-p (tope de 6). */
  escalon?: number;
  /** Demoras explícitas por elemento; manda sobre `delay` y `escalon`. */
  delays?: readonly number[];
  ease?: string;
  /** transform-origin distinto del centro (por ejemplo, "0 50%" para una barra). */
  origen?: string;
}

export interface Escena {
  /** Lo que se ve, para lectores de pantalla. */
  descripcion: string;
  Dibujo: (props: { uid: string }) => ReactNode;
  pasos: Paso[];
}

/** Fondo de placa: color, grilla de puntos, resplandor y los filtros de la escena. */
export function Fondo({ uid, cx, cy }: { uid: string; cx: number; cy: number }) {
  return (
    <>
      <defs>
        <pattern id={`${uid}-grilla`} width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="1.3" fill={C.punto} />
        </pattern>
        <filter id={`${uid}-brillo`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="h" />
          <feMerge>
            <feMergeNode in="h" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${uid}-halo`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <radialGradient id={`${uid}-res`} cx={cx} cy={cy} r="250" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={C.cian} stopOpacity="0.2" />
          <stop offset="100%" stopColor={C.cian} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-luz`}>
          <stop offset="0%" stopColor={C.cian} stopOpacity="0.55" />
          <stop offset="100%" stopColor={C.cian} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-vineta`} cx="50%" cy="50%" r="75%">
          <stop offset="55%" stopColor={C.fondo} stopOpacity="0" />
          <stop offset="100%" stopColor={C.fondo} stopOpacity="0.85" />
        </radialGradient>
      </defs>
      <rect width="800" height="450" fill={C.fondo} />
      <rect width="800" height="450" fill={`url(#${uid}-grilla)`} />
      <circle cx={cx} cy={cy} r="250" fill={`url(#${uid}-res)`} />
    </>
  );
}

/** Oscurece los bordes, como las ilustraciones fijas. Va al final. */
export function Vineta({ uid }: { uid: string }) {
  return <rect width="800" height="450" fill={`url(#${uid}-vineta)`} pointerEvents="none" />;
}

/** Pista de circuito con vía y pad opcionales. */
export function Pista({ uid, d, via, pad }: { uid: string; d: string; via?: [number, number]; pad?: [number, number] }) {
  return (
    <>
      <path d={d} fill="none" stroke={C.cobre} strokeWidth="3.5" strokeLinejoin="round" />
      {via && <circle cx={via[0]} cy={via[1]} r="6" fill={C.fondo} stroke={C.via} strokeWidth="3" />}
      {pad && <circle cx={pad[0]} cy={pad[1]} r="4" fill={C.cian} filter={`url(#${uid}-brillo)`} />}
    </>
  );
}

/**
 * Un pulso que recorre una pista. Sin filtro de desenfoque (no se anima nada con
 * filtro): el brillo es un trazo ancho y tenue debajo. pathLength = 100, así que
 * el desplazamiento va de 14 (antes del inicio) a -104 (pasado el final). El hueco
 * (120) es más largo que la pista: con 12 y 100 los extremos del guion caían justo
 * en el borde y quedaba un punto redondo al terminar.
 * `p` lo mueve la escena; `hover` lo mueve el CSS al pasar el mouse por la tarjeta.
 */
export function Pulso({ d, p, hover }: { d: string; p?: string; hover?: boolean }) {
  return (
    <g data-p={p} className={hover ? 'escena-pulso-hover' : undefined} style={{ strokeDashoffset: 14 }}>
      <path d={d} pathLength={100} fill="none" stroke={C.cian} strokeOpacity="0.3" strokeWidth="10" strokeLinecap="round" strokeDasharray="12 120" />
      <path d={d} pathLength={100} fill="none" stroke={C.cian} strokeWidth="4" strokeLinecap="round" strokeDasharray="12 120" />
    </g>
  );
}

/** Chip SMD decorativo, igual al de las ilustraciones. */
export function Chip({ x, y, ancho = 34, alto = 18 }: { x: number; y: number; ancho?: number; alto?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={ancho} height={alto} rx="2" fill={C.fondo} stroke={C.via} strokeWidth="2.5" />
      <rect x={x + 2} y={y + 2} width="6" height={alto - 4} fill={C.via} />
      <rect x={x + ancho - 8} y={y + 2} width="6" height={alto - 4} fill={C.via} />
    </g>
  );
}

/** Documento: hoja con la esquina doblada y dos renglones. 28 × 34. */
export function Documento() {
  return (
    <g fill="none" stroke={C.claro} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round">
      <path d="M0 0H18L28 10V34H0Z" fill={C.fondo} />
      <path d="M18 0V10H28" />
      <path d="M6 19H22M6 26H17" strokeWidth="3" />
    </g>
  );
}

/** Foto: marco con un cerro y un sol. 36 × 30. */
export function Foto() {
  return (
    <g fill="none" stroke={C.claro} strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round">
      <rect width="36" height="30" rx="4" fill={C.fondo} />
      <path d="M4 25L14 14L21 21L25 17L32 25" strokeWidth="3" />
      <circle cx="26" cy="9" r="3" fill={C.claro} stroke="none" />
    </g>
  );
}

/**
 * Keyframes de un viaje por puntos, con offsets proporcionales a la distancia:
 * la velocidad queda pareja y la curva general (inOut) la suaviza de punta a punta.
 */
export function recorrido(
  fin: [number, number],
  puntos: Array<{ x: number; y: number; escala?: number; opacity?: number }>,
): Keyframe[] {
  const largos = puntos.map((p, i) => (i === 0 ? 0 : Math.hypot(p.x - puntos[i - 1].x, p.y - puntos[i - 1].y)));
  const total = largos.reduce((a, b) => a + b, 0) || 1;
  let acumulado = 0;
  return puntos.map((p, i) => {
    acumulado += largos[i];
    return {
      offset: i === puntos.length - 1 ? 1 : acumulado / total,
      opacity: p.opacity ?? 1,
      transform: `translate(${p.x - fin[0]}px, ${p.y - fin[1]}px) scale(${p.escala ?? 1})`,
    };
  });
}

/** Mueve un punto absoluto (centro) a un translate relativo a la posición final. */
export const hacia = (fin: [number, number], x: number, y: number, extra = '') =>
  `translate(${x - fin[0]}px, ${y - fin[1]}px)${extra ? ' ' + extra : ''}`;

/** Arco de anillo en coordenadas absolutas, ángulos en grados (0 = derecha). */
export function arco(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)].map((v) => v.toFixed(2));
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}
