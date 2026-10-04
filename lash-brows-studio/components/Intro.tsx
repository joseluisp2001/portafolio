import { site } from "@/config/site";

/**
 * Carga de marca: los dos arcos del logo se trazan como dos plumas que bajan
 * desde el hueco de arriba, el monograma GR entra dentro y después el nombre.
 * Menos de dos segundos, una sola vez por sesión.
 *
 * Por qué así:
 * - **Sólo CSS.** Corre mientras el navegador todavía está cargando JavaScript,
 *   y si JS nunca carga, la capa igual se va sola.
 * - **`pointer-events: none` todo el tiempo.** Nada puede quedar entre la
 *   clienta y el chat: ni siquiera por un segundo y medio.
 * - **Una vez por sesión.** El script de `app/layout.tsx` marca
 *   `<html data-intro="visto">` y el CSS ni la dibuja.
 * - **Sólo en la landing.** La monta `app/page.tsx`, no el layout: /manager
 *   es el panel de Génesis y ahí una carga de marca sólo estorba.
 * - **No toca el hero.** Su imagen sigue arrancando opaca: es el elemento que
 *   mide el LCP y un fundido ahí retrasa la métrica (ver la nota del proyecto).
 * - Con `prefers-reduced-motion` no aparece.
 * - **Se corta sola con un gesto.** Como la capa no recibe clics, el scroll y
 *   los toques la atraviesan y caen sobre una página que la clienta no está
 *   viendo: un flick para bajar la dejaba parada en medio de Servicios sin
 *   haber visto el hero. Ahora el primer toque, tecla o scroll la termina.
 *   Si el JavaScript no corre, la capa igual se va sola: el respaldo es el CSS.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUÉ EL LOGO ESTÁ DOS VECES
 *
 * `logo.png` es una sola imagen con el aro y las letras juntos. Si se le anima
 * una máscara a la imagen entera —como estaba hasta ahora— el barrido **corta
 * las letras con un filo recto**: a los 260 ms la G se veía partida a la mitad.
 *
 * Así que la misma imagen se pinta dos veces y cada copia se recorta con una
 * máscara radial, en una banda donde el PNG no tiene nada:
 *
 *   medido sobre public/logo.png (144×144, centro 71,5/72)
 *   · letras: hasta r = 60,25 px  (83,7 %)
 *   · aro:    de r = 65 a 68,75   (90,3 % a 95,5 %)
 *   · la banda 85 %–89 % está vacía → ahí va el corte, y no se ve.
 *
 * `.intro-aro` se queda con el aro y se va descubriendo; `.intro-monograma` se
 * queda con las letras y entra con un fundido. Ninguna de las dos se corta.
 *
 * Si el logo cambia, `node scripts/medir-logo.mjs` lo vuelve a medir y avisa
 * si los porcentajes de `app/globals.css` dejaron de servir.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * La animación vive en `app/globals.css` (bloque `.intro*`).
 */
export function Intro() {
  return (
    <div className="intro" aria-hidden="true">
      <div className="intro-contenido">
        <div className="intro-marca">
          {/* El aro: dos arcos que se dibujan desde el hueco de las 12. */}
          <span className="intro-trazo">
            {/* eslint-disable-next-line @next/next/no-img-element -- crudo a propósito: la capa tiene que pintarse sin JavaScript y sin pasar por el optimizador, y el PNG pesa 14 KB. */}
            <img
              className="intro-aro"
              src={site.brand.logo}
              srcSet={`${site.brand.logo} 1x, ${site.brand.logo2x} 2x`}
              alt=""
              width={144}
              height={144}
            />
          </span>
          {/* Las letras, dentro del aro ya trazado. Misma URL que el aro: el
              navegador la descarga una sola vez. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- ídem: misma imagen, sin JS. */}
          <img
            className="intro-monograma"
            src={site.brand.logo}
            srcSet={`${site.brand.logo} 1x, ${site.brand.logo2x} 2x`}
            alt=""
            width={144}
            height={144}
          />
        </div>

        {/* La misma marca que el encabezado y que el logo impreso: el nombre
            arriba y "Lash & Brow Studio" como bajada fina. La bajada larga
            ("extensiones de pestañas…") ya la dice el hero dos segundos
            después, y en el teléfono partía en dos líneas. */}
        <p className="intro-nombre">{site.brand.name}</p>
        <p className="intro-bajada">{site.brand.studioSuffix}</p>
      </div>
    </div>
  );
}

/**
 * Corre antes de pintar. La primera visita de la sesión guarda la marca y deja
 * tres oyentes de un solo uso para que un gesto corte la carga; las siguientes
 * ponen `data-intro="visto"` y la carga no se muestra.
 *
 * Sólo se ocupa de la landing: /manager comparte el layout y ahí no hay capa.
 * Dentro de `try`: con el almacenamiento bloqueado (modo privado estricto) la
 * carga simplemente se muestra otra vez.
 */
export const INTRO_SCRIPT =
  "try{if(location.pathname==='/'){var d=document.documentElement;" +
  "if(sessionStorage.getItem('gr-intro')){d.dataset.intro='visto'}" +
  "else{sessionStorage.setItem('gr-intro','1');" +
  "var f=function(){d.dataset.intro='visto'};" +
  "['pointerdown','keydown','scroll'].forEach(function(e){" +
  "addEventListener(e,f,{once:true,passive:true})})}}}catch(e){}";
