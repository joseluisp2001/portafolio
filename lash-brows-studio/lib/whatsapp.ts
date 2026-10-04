/**
 * El corazón del sitio: todos los CTAs terminan acá.
 *
 * La métrica única de éxito es "conversaciones iniciadas por WhatsApp", así que
 * el trabajo de este archivo es que la clienta llegue al chat con el contexto
 * ya escrito y que el bot de n8n sepa de qué parte de la web salió.
 *
 * El mensaje va redactado EN PRIMERA PERSONA POR LA CLIENTA, en español de
 * Costa Rica. Al final se agrega un marcador `[ref:...]` que n8n lee para
 * saber el origen y que después debe ignorar en la conversación visible.
 */

import { site } from "@/config/site";
import { formatDateLong, formatTime12 } from "@/lib/format";

export type WhatsAppIntent = {
  /** "hero" | "servicio:volumen-ruso" | "fab" | "form" | "footer" | ... */
  source: string;
  /** Nombre del servicio tal cual lo lee la clienta, ej. "Volumen ruso". */
  service?: string;
  /** "YYYY-MM-DD" */
  preferredDate?: string;
  /** "HH:MM" en 24 h */
  preferredTime?: string;
  name?: string;
  notes?: string;
};

/**
 * Convierte el `source` en el marcador de trazabilidad.
 *   "hero"                  → "hero"
 *   "servicio:volumen-ruso" → "svc-volumen-ruso"
 * Se limita a [a-z0-9-] para que sobreviva al URL-encoding y sea trivial de
 * parsear con una expresión regular en n8n.
 */
export function sourceToRef(source: string): string {
  const prefix = "servicio:";
  const normalized = source.startsWith(prefix)
    ? `svc-${source.slice(prefix.length)}`
    : source;

  return (
    normalized
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "web"
  );
}

/*
  Dos frases que se repiten en varios mensajes, con el porqué de su redacción:

  - "Quería consultar por X" en vez de "me interesa el servicio de X". El "el
    servicio de" existía para esquivar el género (es "el Volumen Medio" pero "la
    Henna"), sólo que suena a formulario. "Consultar por" resuelve lo mismo sin
    artículo y suena a persona.
  - "¿Qué días tenés disponibles?" en vez de "¿Qué disponibilidad tienen?".
    Génesis es UNA persona, así que el "tienen" en plural estaba mal, y el bot
    contesta en voseo tico: el mensaje que la clienta manda tiene que sonar
    igual, no como un correo corporativo.
*/
const CONSULTA_POR = "Quería consultar por";
const PREGUNTA_DIAS = "¿Qué días tenés disponibles?";

/** Redacta el cuerpo del mensaje según cuánto contexto haya. */
function buildMessage(intent: WhatsAppIntent): string {
  const name = intent.name?.trim();
  const service = intent.service?.trim();
  const notes = intent.notes?.trim();
  const date = intent.preferredDate ? formatDateLong(intent.preferredDate) : "";
  const time = intent.preferredTime ? formatTime12(intent.preferredTime) : "";

  /*
    Cuando la clienta llenó el formulario tenemos su nombre Y el servicio: ahí
    conviene un mensaje ESTRUCTURADO, con cada dato en su línea. No es frialdad
    —abre cálido, en primera persona—: es para que Génesis lea la reserva de un
    vistazo desde el celular, sin tener que descifrar un párrafo. Los datos van
    con viñeta y sólo se listan los que existen.
  */
  if (name && service) {
    const lineas: string[] = [`¡Hola! Soy ${name} ✨`, ""];

    if (date || time) {
      lineas.push("Me gustaría agendar:", "");

      // Sólo se listan los datos que existen.
      lineas.push(`• Servicio: ${service}`);
      if (date) lineas.push(`• Día: ${date}`);
      if (time) lineas.push(`• Hora: ${time}`);
      if (notes) lineas.push(`• Nota: ${notes}`);

      // Cierra con una pregunta directa: le da a Génesis algo concreto que
      // contestar y evita que la conversación se quede en visto.
      lineas.push("", "¿Me lo podés confirmar?");
    } else {
      lineas.push(`${CONSULTA_POR} ${service}. ${PREGUNTA_DIAS}`);
      if (notes) lineas.push("", `• Nota: ${notes}`);
    }

    return lineas.join("\n");
  }

  /* Desde una tarjeta de servicio (hay servicio pero no nombre). */
  if (service) {
    const partes = [`¡Hola! ${CONSULTA_POR} ${service} ✨`, PREGUNTA_DIAS];
    if (notes) partes.push(`Nota: ${notes}`);
    return partes.join(" ");
  }

  /* Genérico: hero, header, FAB, footer. */
  const base = name
    ? `¡Hola! Soy ${name}, vi la página y me gustaría agendar una cita ✨`
    : "¡Hola! Vi la página y me gustaría agendar una cita ✨";
  return notes ? `${base} Nota: ${notes}` : base;
}

/**
 * Arma la URL de WhatsApp. Es la ÚNICA forma en que el sitio genera enlaces a
 * wa.me: si aparece otra, es un bug.
 */
export function buildWhatsAppUrl(intent: WhatsAppIntent): string {
  const message = `${buildMessage(intent)}\n\n[ref:${sourceToRef(intent.source)}]`;
  return `https://wa.me/${site.contact.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
