/**
 * "15000" -> "₡15.000".
 *
 * El separador de miles se pone A MANO, no con `toLocaleString` ni con
 * `Intl.NumberFormat`. Tres razones, las tres medidas:
 *
 * 1. El locale es-CR devuelve un espacio fino como separador ("₡15 000"), que
 *    en Costa Rica no se escribe asi.
 * 2. Node y el navegador no siempre coinciden en ese detalle, y cuando no
 *    coinciden React se queja de que el HTML del servidor no calza con el del
 *    cliente.
 * 3. La version anterior de esta funcion usaba Intl y despues hacia
 *    `.replace(/\s/g, '')` — o sea, veia el espacio raro y lo borraba. El
 *    resultado era "₡15000", sin ningun separador.
 *
 * `Math.round` primero, y no es un detalle: el reemplazo de miles sobre un
 * numero con decimales devuelve basura ("15000.5" -> "15.000.5"). Los precios
 * en colones no llevan centimos.
 *
 * Es la misma solucion que ya estaba en `rapitelas/lib/numeros.ts`; faltaba
 * copiarla aca.
 */
export function formatPrice(amount: number): string {
  const entero = Math.round(amount).toString();
  return '₡' + entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-CR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}
