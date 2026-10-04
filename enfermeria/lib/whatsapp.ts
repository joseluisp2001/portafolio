import { site } from '@/config/site';

/*
  UNICO lugar del proyecto donde se arma un enlace de WhatsApp.

  Ningun componente escribe "wa.me" a mano. En shein-los-guido el boton de hacer
  el pedido tenia el numero escrito adentro del componente y apuntaba a uno
  inventado: cada pedido del carrito se perdio durante semanas, y no se detecto
  revisando los enlaces de la pagina porque ese boton usaba window.open y no un
  <a href>.

  Antes de publicar:  grep -rn "wa\.me" --include=*.tsx --include=*.ts .
  Tiene que aparecer solo en este archivo.
*/

/* `as string`: el config es `as const`, asi que con un numero puesto TypeScript
   ve el literal y dice que la comparacion "no tiene sentido". Gravity lo resolvio
   dejando `hayWhatsApp = true` fijo, y con eso el aviso de "falta el numero"
   no podia volver a salir nunca. */
export const hayWhatsApp = (site.contacto.whatsapp as string) !== '';

export function urlWhatsApp(mensaje?: string): string {
  const texto = mensaje ? '?text=' + encodeURIComponent(mensaje) : '';
  return `https://wa.me/${site.contacto.whatsapp}${texto}`;
}

/**
 * Formatea un monto en colones: 8900 -> "₡8.900"
 *
 * NO se usa toLocaleString('es-CR'): el CLDR de Costa Rica separa los miles con
 * un ESPACIO, no con punto, asi que devuelve "2 500" y en pantalla se lee como
 * si fueran dos numeros. Lo verifique en el navegador antes de escribir esto.
 * Aca se arma a mano para que siempre salga como lo escribe la gente.
 */
export function colones(monto: number): string {
  const entero = Math.round(monto).toString();
  return '₡' + entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
