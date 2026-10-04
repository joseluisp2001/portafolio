"use client";

import { Star } from "lucide-react";
import { useState } from "react";

import { site } from "@/config/site";
import { cn } from "@/lib/cn";

/**
 * Formulario para dejar una reseña.
 *
 * Lo que se envía NO aparece en la página: entra como pendiente y Génesis lo
 * aprueba. Eso se le dice a la clienta antes de que escriba, no después —
 * enterarse al final de que su reseña "está en revisión" se siente a censura;
 * saberlo desde el principio se lee como que el estudio cuida su página.
 */
export function FormularioResena() {
  const [estrellas, setEstrellas] = useState(0);
  const [sobrevolada, setSobrevolada] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState("");

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (estrellas === 0) {
      setError("Elegí cuántas estrellas");
      return;
    }

    const datos = new FormData(evento.currentTarget);
    setEnviando(true);
    setError("");

    try {
      const respuesta = await fetch("/api/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: String(datos.get("nombre") ?? ""),
          estrellas,
          servicio: String(datos.get("servicio") ?? ""),
          comentario: String(datos.get("comentario") ?? ""),
          // El campo trampa viaja tal cual: si un bot lo llenó, el servidor lo
          // descarta en silencio.
          web: String(datos.get("web") ?? ""),
        }),
      });

      const cuerpo = await respuesta.json();
      if (!cuerpo.ok) {
        setError(cuerpo.motivo ?? "No se pudo enviar");
        return;
      }

      setListo(true);
    } catch {
      setError("Se cortó la conexión. Probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <div className="rounded-2xl border border-gold-ink/30 bg-cream p-6 text-center">
        <p className="font-medium text-espresso">Gracias por escribir.</p>
        <p className="mt-1 text-sm text-mocha">
          Génesis la revisa antes de publicarla. Si dejaste algo que quieras que veamos
          ahora, escribinos por WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="rounded-2xl border border-gold-ink/30 bg-cream p-6">
      <p className="text-sm text-mocha">
        Tu reseña la revisa Génesis antes de que aparezca en la página.
      </p>

      {/* --- Estrellas --------------------------------------------------- */}
      <fieldset className="mt-4">
        <legend className="text-sm text-espresso">¿Cómo te fue?</legend>

        <div className="mt-2 flex gap-1" onMouseLeave={() => setSobrevolada(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setEstrellas(n)}
              onMouseEnter={() => setSobrevolada(n)}
              aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
              aria-pressed={estrellas === n}
              /* 44px de alto: es un control táctil, no un ícono decorativo. */
              className="flex size-11 items-center justify-center"
            >
              <Star
                size={26}
                className={cn(
                  "transition-colors",
                  n <= (sobrevolada || estrellas)
                    ? "fill-gold-ink text-gold-ink"
                    : "text-mocha/40",
                )}
              />
            </button>
          ))}
        </div>
      </fieldset>

      {/* --- Nombre ------------------------------------------------------- */}
      <label className="mt-4 block">
        <span className="text-sm text-espresso">Tu nombre</span>
        <input
          name="nombre"
          required
          maxLength={60}
          autoComplete="name"
          className="mt-1 min-h-11 w-full rounded-lg border border-mocha/25 bg-white px-3 py-2"
        />
      </label>

      {/* --- Servicio (opcional) ------------------------------------------ */}
      <label className="mt-4 block">
        <span className="text-sm text-espresso">¿Qué te hiciste? (opcional)</span>
        {/*
          `min-h-11` explícito. Con las mismas clases que el input de arriba,
          este <select> medía 40px y el input 47: el input crece con el
          line-height del texto, el select se dibuja con las métricas del
          control nativo y se queda corto. 40px está por debajo del mínimo
          táctil de 44 que respeta todo el resto del sitio.

          Medido en el navegador, no supuesto. Es el mismo error que apareció
          en enfermería con cuatro enlaces de 24px.
        */}
        <select
          name="servicio"
          defaultValue=""
          className="mt-1 min-h-11 w-full rounded-lg border border-mocha/25 bg-white px-3 py-2"
        >
          <option value="">No decirlo</option>
          {site.services.map((s) => (
            <option key={s.slug} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      {/* --- Comentario ---------------------------------------------------- */}
      <label className="mt-4 block">
        <span className="text-sm text-espresso">Contanos</span>
        <textarea
          name="comentario"
          required
          minLength={10}
          maxLength={600}
          rows={4}
          className="mt-1 w-full rounded-lg border border-mocha/25 bg-white px-3 py-2"
        />
      </label>

      {/*
        CAMPO TRAMPA.

        Una persona no lo ve ni lo llena: está fuera de pantalla y con
        `tabIndex={-1}`, así que tampoco lo alcanza el teclado. Un bot que llena
        todo lo que encuentra sí lo llena, y el servidor lo descarta.

        `aria-hidden` para que ningún lector de pantalla lo anuncie: alguien
        navegando así SÍ lo llenaría, y sería la única persona a la que este
        campo bloquearía.
      */}
      <input
        type="text"
        name="web"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-5 min-h-11 w-full rounded-lg bg-espresso px-5 py-3 font-medium text-cream disabled:opacity-60"
      >
        {enviando ? "Enviando…" : "Enviar mi reseña"}
      </button>
    </form>
  );
}
