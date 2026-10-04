import { site, type Servicio } from '@/config/site';

/*
  Todo se calcula en la zona de Costa Rica, no en la del visitante.
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

  return {
    dia: dias[busca('weekday')] ?? 0,
    minutos: Number(busca('hour')) * 60 + Number(busca('minute')),
  };
}

const aMinutos = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const aHHMM = (minutos: number): string =>
  `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;

export type EstadoHorario = { abierto: boolean; texto: string };

export function estadoHorario(): EstadoHorario {
  const { dia, minutos } = ahoraEnCostaRica();
  const hoy = site.horario[dia] as Franja | null;

  if (hoy && minutos >= aMinutos(hoy.abre) && minutos < aMinutos(hoy.cierra)) {
    return { abierto: true, texto: `Abierto hasta las ${hoy.cierra}` };
  }

  for (let salto = hoy && minutos < aMinutos(hoy.abre) ? 0 : 1; salto <= 7; salto++) {
    const franja = site.horario[(dia + salto) % 7] as Franja | null;
    if (!franja) continue;
    if (salto === 0) return { abierto: false, texto: `Abre hoy a las ${franja.abre}` };
    if (salto === 1) return { abierto: false, texto: `Abre manana a las ${franja.abre}` };
    return { abierto: false, texto: `Abre ${franja.dia.toLowerCase()} a las ${franja.abre}` };
  }

  return { abierto: false, texto: 'Cerrado' };
}

/** Los proximos `cantidad` dias que la barberia abre, desde hoy. */
export function proximosDias(cantidad: number): { iso: string; dia: string; numero: number }[] {
  const dias: { iso: string; dia: string; numero: number }[] = [];
  const hoy = new Date();

  for (let salto = 0; dias.length < cantidad && salto < 30; salto++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + salto);

    const franja = site.horario[fecha.getDay()] as Franja | null;
    if (!franja) continue;

    dias.push({
      iso: new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(fecha),
      dia: franja.dia,
      numero: fecha.getDate(),
    });
  }

  return dias;
}

/**
 * Horas que se pueden apartar para UN servicio en UN dia.
 *
 * El paso depende de cuanto dura el servicio, no es fijo.
 *
 * Esto es la leccion de lash-brows-studio aplicada desde el primer dia: alla el
 * paso esta clavado en 180 minutos para todos los servicios, asi que un diseno
 * de cejas de 45 minutos solo se puede reservar a las 9, a las 12 y a las 15
 * — tres arranques por dia donde fisicamente caben doce. Y si alguien toma las
 * 9:00 para 45 minutos, de 9:45 a 12:00 nadie mas puede reservar aunque la
 * silla este vacia. Los servicios cortos son los que llenan los huecos, y son
 * justo los que el sitio no dejaba agendar.
 *
 * Aca: paso = duracion + colchon, redondeado a la media hora siguiente para que
 * las horas caigan en numeros que la gente pueda decir por telefono.
 */
export function generarHoras(servicio: Servicio, fechaISO: string): string[] {
  const fecha = new Date(`${fechaISO}T12:00:00`);
  const franja = site.horario[fecha.getDay()] as Franja | null;
  if (!franja) return [];

  const bruto = servicio.duracion + site.colchon;
  const paso = Math.ceil(bruto / 30) * 30;

  const apertura = aMinutos(franja.abre);
  const cierre = aMinutos(franja.cierra);

  // Si hoy ya empezo, no ofrecer horas que ya pasaron.
  const { dia: diaHoy, minutos: ahora } = ahoraEnCostaRica();
  const esHoy = fecha.getDay() === diaHoy;

  const horas: string[] = [];
  for (let t = apertura; t + servicio.duracion <= cierre; t += paso) {
    if (esHoy && t <= ahora) continue;
    horas.push(aHHMM(t));
  }

  return horas;
}
