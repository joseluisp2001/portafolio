import { site } from '@/config/site';

/*
  "¿Estan abiertos ahora?" es el dato que la gente busca primero y que casi
  ningun sitio de comida pone.

  Todo se calcula en la zona de Costa Rica (UTC-6, sin horario de verano), no en
  la del visitante: si alguien abre el sitio desde otro pais, lo que le importa
  es si la soda esta abierta alla, no aca.
*/

const ZONA = 'America/Costa_Rica';

type Franja = { dia: string; abre: string; cierra: string };

function ahoraEnCostaRica(): { dia: number; minutos: number } {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const busca = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';

  const dias: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const hora = Number(busca('hour'));
  const minuto = Number(busca('minute'));

  return { dia: dias[busca('weekday')] ?? 0, minutos: hora * 60 + minuto };
}

const aMinutos = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export type EstadoHorario = {
  abierto: boolean;
  /** Frase corta lista para mostrar: "Abierto hasta las 7:00 p. m." */
  texto: string;
};

/**
 * El dia de la semana EN COSTA RICA (domingo = 0).
 *
 * Las paginas usaban `new Date().getDay()`, que en el servidor da el dia en
 * UTC: de las 6 p. m. a medianoche de Costa Rica ya es "manana" en UTC, y la
 * franja de "hoy" mostraba el horario del dia siguiente justo de noche, que es
 * cuando mas se busca una visita urgente.
 */
export function diaDeHoy(): number {
  return ahoraEnCostaRica().dia;
}

export function estadoHorario(): EstadoHorario {
  const { dia, minutos } = ahoraEnCostaRica();
  const hoy = site.horario[dia] as Franja | null;

  if (hoy && minutos >= aMinutos(hoy.abre) && minutos < aMinutos(hoy.cierra)) {
    return { abierto: true, texto: `Abierto hasta las ${formatoHora(hoy.cierra)}` };
  }

  // Cerrado: buscamos el proximo dia con horario, mirando hasta una semana.
  for (let salto = hoy && minutos < aMinutos(hoy.abre) ? 0 : 1; salto <= 7; salto++) {
    const franja = site.horario[(dia + salto) % 7] as Franja | null;
    if (!franja) continue;

    if (salto === 0) return { abierto: false, texto: `Abre hoy a las ${formatoHora(franja.abre)}` };
    if (salto === 1) return { abierto: false, texto: `Abre manana a las ${formatoHora(franja.abre)}` };
    return { abierto: false, texto: `Abre el ${franja.dia.toLowerCase()} a las ${formatoHora(franja.abre)}` };
  }

  return { abierto: false, texto: 'Cerrado' };
}

/** "19:00" -> "7:00 p. m." */
export function formatoHora(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const sufijo = h < 12 ? 'a. m.' : 'p. m.';
  const hora12 = h % 12 === 0 ? 12 : h % 12;
  return `${hora12}:${String(m).padStart(2, '0')} ${sufijo}`;
}
