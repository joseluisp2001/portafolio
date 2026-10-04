/**
 * Capa fina de analítica.
 *
 * Hoy sólo escribe en la consola y empuja al `dataLayer` si existe. Está así a
 * propósito: cuando el dueño conecte Meta Pixel o GA4 no hay que tocar ningún
 * componente, sólo agregar el script en `layout.tsx` y los eventos empiezan a
 * llegar solos. Ningún componente llama a `window.dataLayer` directamente.
 */

export type AnalyticsEvent =
  | "whatsapp_click"
  | "form_submit"
  | "form_error"
  | "availability_degraded"
  | "gallery_open"
  | "quick_link_click";

export type AnalyticsParams = Record<
  string,
  string | number | boolean | undefined
>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

/**
 * Registra un evento. Es seguro llamarla desde cualquier lado: en el servidor
 * no hace nada y nunca lanza, porque una falla de analítica jamás debe romper
 * el camino hacia WhatsApp.
 */
export function trackEvent(
  name: AnalyticsEvent,
  params: AnalyticsParams = {},
): void {
  if (typeof window === "undefined") return;

  try {
    console.debug(`[analytics] ${name}`, params);
    window.dataLayer?.push({ event: name, ...params });
  } catch {
    // Silencio intencional.
  }
}
