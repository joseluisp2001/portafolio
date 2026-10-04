import { site } from '@/config/site';

/*
  "Nuestro cuidado": la lista del afiche del negocio, con un icono por punto.

  Es una lista de verdad (<ul>), no una grilla de tarjetas: son diez frases
  cortas que se leen de corrido, y un lector de pantalla anuncia "lista, 10
  elementos". Los iconos son decorativos (aria-hidden): el texto dice todo.

  Mismos tokens AAA que el resto: icono en verde sobre circulo nieve con borde
  de 2 px, texto de 19 px, nota en gris AAA de 17 px.
*/

/* Trazos de 24x24, estilo lineal, sin relleno. */
const ICONOS: Record<string, React.ReactNode> = {
  reloj24: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
      <path d="M3 4v4h4" />
    </>
  ),
  calendario: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
      <path d="m9 15 2 2 4-4" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </>
  ),
  ducha: (
    <>
      <path d="M4 20V8a4 4 0 0 1 8 0" />
      <path d="M10 8h6l-1 3h-4z" />
      <path d="M12 14v1M15 14v1M18 14v1M13 17v1M16 17v1M14 20v1M17 20v1" />
    </>
  ),
  cubiertos: (
    <>
      <path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5" />
      <path d="M17 21V3c-2 1-3 4-3 7v3h3" />
    </>
  ),
  cerebro: (
    <>
      <path d="M12 5a3 3 0 0 0-5.8-1A3 3 0 0 0 4 9a3 3 0 0 0 0 6 3 3 0 0 0 3 4 3 3 0 0 0 5 1z" />
      <path d="M12 5a3 3 0 0 1 5.8-1A3 3 0 0 1 20 9a3 3 0 0 1 0 6 3 3 0 0 1-3 4 3 3 0 0 1-5 1z" />
      <path d="M12 5v15" />
    </>
  ),
  estetoscopio: (
    <>
      <path d="M6 3v6a4 4 0 0 0 8 0V3" />
      <path d="M10 13v2a5 5 0 0 0 10 0v-3" />
      <circle cx="20" cy="10" r="2" />
    </>
  ),
  pastillas: (
    <>
      <rect x="6" y="3" width="12" height="4" rx="1" />
      <path d="M7 7h10v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" />
      <path d="M10 13h4M12 11v4" />
    </>
  ),
  pulso: (
    <>
      <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1z" />
      <path d="M6 12h3l2-3 2 5 1.5-2H18" />
    </>
  ),
  carro: (
    <>
      <path d="M5 17h14v-5l-2-5H7l-2 5z" />
      <path d="M5 12h14" />
      <circle cx="8" cy="17" r="2" />
      <circle cx="16" cy="17" r="2" />
    </>
  ),
};

export default function NuestroCuidado() {
  if (site.cuidado.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 pt-14" aria-labelledby="titulo-cuidado">
      <h2 id="titulo-cuidado" className="text-h2">
        Nuestro cuidado
      </h2>
      <p className="medida mt-2 text-gris">
        Atención de enfermería y acompañamiento en su casa, a la medida de lo que necesita.
      </p>

      <ul className="mt-8 grid gap-x-10 gap-y-1 sm:grid-cols-2">
        {site.cuidado.map((c) => (
          <li key={c.texto} className="flex items-center gap-4 border-b-2 border-borde py-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-verde bg-nieve text-verde">
              <svg
                aria-hidden="true"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {ICONOS[c.icono] ?? ICONOS.estetoscopio}
              </svg>
            </span>
            <span>
              <span className="block font-bold">{c.texto}</span>
              {c.nota && <span className="block text-chico text-gris">{c.nota}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
