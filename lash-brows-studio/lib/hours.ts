/**
 * Horarios del estudio, siempre en `site.calendar.timezone`.
 *
 * El servidor corre en UTC y el navegador de la clienta puede estar en cualquier
 * zona. Nada de este archivo usa `Date.getHours()`, `getDay()` ni ninguna otra
 * lectura local: todo pasa por `Intl.DateTimeFormat` con `timeZone` explícito.
 * Ese es el único motivo por el que estas funciones existen.
 */

import { site } from "@/config/site";
import { agrupar, horarioPorOmision, type DiaHorario } from "@/lib/horario";
import { minutesToTime, timeToMinutes, weekdayOf } from "@/lib/format";

/**
 * EL HORARIO SE PASA, NO SE LEE DE UN GLOBAL.
 *
 * Hasta el 9-9-2026 estas funciones leían `site.hours` directamente. Desde que
 * Génesis lo edita en /manager, el horario vive en disco y cambia sin recompilar
 * — así que quien lo tiene es el servidor, y estas funciones lo reciben.
 *
 * El valor por omisión es el del config, y eso importa: `BookingForm`,
 * `TodayHoursCard` y `LocationHours` corren en el NAVEGADOR, donde no hay disco.
 * Reciben el horario como prop desde la página; si alguna vez se llamara sin
 * pasarlo, cae al de siempre en vez de romperse.
 */

const TZ = site.calendar.timezone;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

/* -------------------------------------------------------------------------- */
/*  Lectura del "ahora" en la zona del estudio                                 */
/* -------------------------------------------------------------------------- */

/** "YYYY-MM-DD" del día que es hoy en Costa Rica. */
export function todayInStudioTz(now: Date = new Date()): string {
  // en-CA emite exactamente el formato ISO de fecha.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Minutos transcurridos desde medianoche en Costa Rica. */
export function nowMinutesInStudioTz(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    // h23 evita que medianoche salga como "24" en algunas versiones de ICU.
    hourCycle: "h23",
  }).formatToParts(now);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  return read("hour") * 60 + read("minute");
}

/** Día de la semana de hoy en Costa Rica. 0 = domingo … 6 = sábado. */
export function weekdayInStudioTz(now: Date = new Date()): number {
  return weekdayOf(todayInStudioTz(now)) ?? 0;
}

/* -------------------------------------------------------------------------- */
/*  Reglas de horario                                                          */
/* -------------------------------------------------------------------------- */

/** El día del horario que cubre ese día de la semana. */
export function ruleForWeekday(
  weekday: number,
  horario: DiaHorario[] = horarioPorOmision(),
): DiaHorario | undefined {
  return horario.find((dia) => dia.dia === weekday);
}

/** El día que aplica a una fecha "YYYY-MM-DD". */
export function ruleForDate(
  isoDate: string,
  horario: DiaHorario[] = horarioPorOmision(),
): DiaHorario | undefined {
  const weekday = weekdayOf(isoDate);
  return weekday === null ? undefined : ruleForWeekday(weekday, horario);
}

/** El día de hoy, en la zona del estudio. */
export function todayRule(
  now: Date = new Date(),
  horario: DiaHorario[] = horarioPorOmision(),
): DiaHorario | undefined {
  return ruleForWeekday(weekdayInStudioTz(now), horario);
}

/** `true` si el estudio no abre ese día. */
export function isClosedOn(
  isoDate: string,
  horario: DiaHorario[] = horarioPorOmision(),
): boolean {
  const dia = ruleForDate(isoDate, horario);
  return !dia || !dia.abierto;
}

/** `true` si en este momento el estudio está dentro de su horario. */
export function isOpenNow(
  now: Date = new Date(),
  horario: DiaHorario[] = horarioPorOmision(),
): boolean {
  const dia = todayRule(now, horario);
  if (!dia || !dia.abierto) return false;

  const open = timeToMinutes(dia.apertura);
  const close = timeToMinutes(dia.cierre);
  if (open === null || close === null) return false;

  const current = nowMinutesInStudioTz(now);
  return current >= open && current < close;
}

/* -------------------------------------------------------------------------- */
/*  Límites de reserva                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Primera fecha reservable, respetando `minNoticeHours`.
 * Es el piso del atributo `min` del input de fecha. El filtrado fino por hora
 * lo hace `generateSlots`, que descarta las horas de hoy que ya no alcanzan.
 */
export function minBookableDate(now: Date = new Date()): string {
  const earliest = new Date(
    now.getTime() + site.calendar.minNoticeHours * MS_PER_HOUR,
  );
  return todayInStudioTz(earliest);
}

/** Última fecha reservable, respetando `maxAdvanceDays`. */
export function maxBookableDate(now: Date = new Date()): string {
  const latest = new Date(
    now.getTime() + site.calendar.maxAdvanceDays * MS_PER_DAY,
  );
  return todayInStudioTz(latest);
}

/* -------------------------------------------------------------------------- */
/*  Generación de espacios                                                     */
/* -------------------------------------------------------------------------- */

export interface Slot {
  /** Hora de inicio en 24 h, "HH:MM". */
  start: string;
  available: boolean;
}

/**
 * Espacios de inicio posibles para un servicio en una fecha dada.
 *
 * Reglas aplicadas acá:
 *  - día cerrado o fecha ya pasada → lista vacía;
 *  - el servicio tiene que terminar antes de la hora de cierre;
 *  - si la fecha es hoy, se descartan las horas que ya no cumplen
 *    `minNoticeHours`.
 *
 * `bufferMinutes` NO se aplica acá: sirve para separar una cita de la
 * siguiente, y quien conoce las citas ya agendadas es n8n contra Google
 * Calendar. Esta función sólo dice qué horas son posibles en teoría; el
 * endpoint de disponibilidad las marca como ocupadas cuando corresponde.
 */
export function generateSlots(
  isoDate: string,
  durationMinutes: number,
  now: Date = new Date(),
  horario: DiaHorario[] = horarioPorOmision(),
): Slot[] {
  const rule = ruleForDate(isoDate, horario);
  if (!rule || !rule.abierto) return [];

  const open = timeToMinutes(rule.apertura);
  const close = timeToMinutes(rule.cierre);
  if (open === null || close === null) return [];

  const today = todayInStudioTz(now);
  if (isoDate < today) return [];

  const cutoff =
    isoDate === today
      ? nowMinutesInStudioTz(now) + site.calendar.minNoticeHours * 60
      : Number.NEGATIVE_INFINITY;

  /*
    El paso sale del DÍA, no de una constante global.

    Antes era `site.calendar.slotIntervalMinutes`, fijo en 180. Con eso un
    laminado de 30 minutos sólo se ofrecía a las 9:00, 12:00 y 15:00: tres
    arranques donde caben doce, y el resto del día escondido aunque el
    calendario estuviera vacío. Los servicios cortos son los que llenan los
    huecos, y eran justo los que el sitio no dejaba agendar.

    Ahora Génesis pone el intervalo de cada día desde el panel.
  */
  const step = rule.intervalo;
  const slots: Slot[] = [];

  for (let start = open; start + durationMinutes <= close; start += step) {
    if (start < cutoff) continue;
    slots.push({ start: minutesToTime(start), available: true });
  }

  return slots;
}

/* -------------------------------------------------------------------------- */
/*  JSON-LD                                                                    */
/* -------------------------------------------------------------------------- */

const SCHEMA_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export interface OpeningHoursSpecification {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string[];
  opens: string;
  closes: string;
}

/** `openingHoursSpecification` de schema.org, armado desde `site.hours`. */
export function openingHoursSpecification(
  horario: DiaHorario[] = horarioPorOmision(),
): OpeningHoursSpecification[] {
  /*
    Se agrupan los días con el mismo horario en vez de emitir siete entradas.
    schema.org acepta las dos formas, pero agrupado es lo que Google muestra en
    la ficha del negocio y es más corto de leer.

    Y sale del horario REAL: si Génesis cierra los miércoles desde el panel,
    Google deja de decir que abre los miércoles. Antes esto salía del config, o
    sea que cambiarlo requería desplegar.
  */
  return agrupar(horario)
    .filter((tramo) => tramo.abierto)
    .map((tramo) => ({
      "@type": "OpeningHoursSpecification" as const,
      dayOfWeek: tramo.dias.map((day) => SCHEMA_DAYS[day]),
      opens: tramo.apertura,
      closes: tramo.cierre,
    }));
}
