/**
 * Formateo de precios, fechas y horas para es-CR.
 *
 * REGLA DE ORO DE ESTE ARCHIVO: una fecha "YYYY-MM-DD" y una hora "HH:MM" son
 * valores de calendario, no instantes en el tiempo. Si se pasaran por
 * `new Date("2026-09-12")` el motor los interpretaría como medianoche UTC y,
 * al formatearlos en Costa Rica (UTC-6), saldría el 11 de septiembre.
 *
 * Para evitarlo, acá las fechas se anclan al mediodía UTC y se formatean con
 * `timeZone: "UTC"`. Así el día que se escribe es el día que se lee, sin
 * importar dónde corra el servidor. Lo que sí necesita zona real —"qué hora es
 * ahora en Costa Rica"— vive en `lib/hours.ts`.
 */

const LOCALE = "es-CR";

/* -------------------------------------------------------------------------- */
/*  Precio                                                                     */
/* -------------------------------------------------------------------------- */

const priceFormatters = new Map<string, Intl.NumberFormat>();

/** ₡20 000 — sin decimales, que es como se escriben los precios en CR. */
export function formatPrice(amount: number, currency: string): string {
  let formatter = priceFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
    priceFormatters.set(currency, formatter);
  }
  return formatter.format(amount);
}

/* -------------------------------------------------------------------------- */
/*  Fecha                                                                      */
/* -------------------------------------------------------------------------- */

/** Convierte "2026-09-12" en un Date anclado al mediodía UTC de ese día. */
function fromIsoDate(isoDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), 12, 0, 0),
  );
}

/** "2026-09-12" → "sábado 12 de septiembre". Cadena vacía si no parsea. */
export function formatDateLong(isoDate: string): string {
  const date = fromIsoDate(isoDate);
  if (!date) return "";
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
}

/** "2026-09-12" → "12 set". Para etiquetas cortas. */
export function formatDateShort(isoDate: string): string {
  const date = fromIsoDate(isoDate);
  if (!date) return "";
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

/** Día de la semana de una fecha ISO: 0 = domingo … 6 = sábado. */
export function weekdayOf(isoDate: string): number | null {
  const date = fromIsoDate(isoDate);
  return date ? date.getUTCDay() : null;
}

/* -------------------------------------------------------------------------- */
/*  Hora                                                                       */
/* -------------------------------------------------------------------------- */

/** "14:00" → minutos desde medianoche (840). `null` si no parsea. */
export function timeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** 840 → "14:00". */
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * "14:00" → "2:00 p. m."
 *
 * Se formatea sobre una fecha fija en UTC porque sólo interesa la hora del
 * reloj, no un instante. es-CR escribe "p. m." con espacios y puntos; el
 * espacio que mete Intl es un NBSP o un NNBSP según la versión de ICU, y se
 * normaliza a espacio común para que el texto viaje bien en la URL de WhatsApp.
 */
export function formatTime12(time: string): string {
  const minutes = timeToMinutes(time);
  if (minutes === null) return "";
  const date = new Date(
    Date.UTC(2000, 0, 1, Math.floor(minutes / 60), minutes % 60),
  );
  const texto = new Intl.DateTimeFormat(LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  })
    .format(date)
    // Intl separa el "p. m." con NBSP (U+00A0) o NNBSP (U+202F) segun la
    // version de ICU. Se normalizan a espacio comun para que el texto viaje
    // limpio dentro de la URL de WhatsApp.
    .replace(/[\u00A0\u202F]/g, " ");

  // Intl escribe el mediodia como "12:00 p. m.", pero en Costa Rica se dice
  // "m. d." (meridiem diei). El bot de WhatsApp ya lo corrige de su lado: si el
  // sitio no hiciera lo mismo, la clienta veria una hora en el formulario y otra
  // distinta en la respuesta del bot para el mismo espacio.
  if (minutes === 12 * 60) return texto.replace(/p\.\s*m\./i, "m. d.");

  return texto;
}
