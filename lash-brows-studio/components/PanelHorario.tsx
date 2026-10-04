"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { enDoceHoras, NOMBRE_DIAS, type DiaHorario } from "@/lib/horario";

/**
 * El horario del estudio, editable por Génesis.
 *
 * Una fila por día de la semana: si abre, desde qué hora, hasta qué hora, y
 * cada cuánto arranca una cita.
 *
 * Antes esto vivía en `config/site.ts`, así que cambiar una hora era editar
 * código y volver a desplegar. Ahora se guarda en disco y vale desde el
 * siguiente pedido.
 */

/** Las opciones del intervalo, con el nombre que usa una persona. */
const INTERVALOS = [
  { minutos: 15, texto: "Cada 15 minutos" },
  { minutos: 30, texto: "Cada 30 minutos" },
  { minutos: 45, texto: "Cada 45 minutos" },
  { minutos: 60, texto: "Cada hora" },
  { minutos: 90, texto: "Cada hora y media" },
  { minutos: 120, texto: "Cada 2 horas" },
  { minutos: 180, texto: "Cada 3 horas" },
  { minutos: 240, texto: "Cada 4 horas" },
] as const;

function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/**
 * La lista de intervalos, garantizando que el valor guardado esté adentro.
 *
 * Un `<select>` cuyo `value` no coincide con ninguna `<option>` no muestra nada
 * seleccionado: se ve vacío, como si el dato se hubiera perdido. Puede pasar
 * con un horario escrito por la API con un valor fuera de la lista (25 minutos,
 * por ejemplo), o si algún día se recorta esta lista.
 *
 * En vez de confiar en que nunca pase, se agrega el valor y se ordena.
 */
function opcionesDeIntervalo(actual: number) {
  if (INTERVALOS.some((i) => i.minutos === actual)) return INTERVALOS;

  return [...INTERVALOS, { minutos: actual, texto: `Cada ${actual} minutos` }].sort(
    (a, b) => a.minutos - b.minutos,
  );
}

export function PanelHorario({ iniciales }: { iniciales: DiaHorario[] }) {
  const [dias, setDias] = useState<DiaHorario[]>(iniciales);
  const [guardado, setGuardado] = useState<DiaHorario[]>(iniciales);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const hayCambios = useMemo(
    () => JSON.stringify(dias) !== JSON.stringify(guardado),
    [dias, guardado],
  );

  function cambiar(dia: number, campo: keyof DiaHorario, valor: string | number | boolean) {
    setDias((prev) =>
      prev.map((d) => (d.dia === dia ? { ...d, [campo]: valor } : d)),
    );
    setAviso(null);
  }

  /**
   * Cuántas citas entran en ese día. Es el número que de verdad le importa a
   * Génesis: le dice al instante si el intervalo que eligió le llena la agenda
   * o le deja tres huecos. Sin esto, "cada 3 horas" es una frase abstracta.
   *
   * ES UN TECHO, no un número exacto, y por eso en pantalla dice "hasta". No
   * sabe qué servicio va a pedir la clienta, y una cita tiene que TERMINAR
   * antes de la hora de cierre: con un mega volumen de 3 horas entran menos que
   * con un laminado de 30 minutos. Decir "9 citas" a secas prometería una
   * agenda que según el servicio no se llena.
   */
  function cuantosEspacios(d: DiaHorario): number {
    if (!d.abierto) return 0;
    const inicio = aMinutos(d.apertura);
    const fin = aMinutos(d.cierre);
    if (fin <= inicio || d.intervalo <= 0) return 0;
    return Math.ceil((fin - inicio) / d.intervalo);
  }

  async function guardar() {
    setGuardando(true);
    setAviso(null);
    try {
      const respuesta = await fetch("/api/manager/horario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dias }),
      });
      const cuerpo = await respuesta.json();

      if (!cuerpo.ok) {
        setAviso({ tipo: "error", texto: cuerpo.motivo ?? "No se pudo guardar" });
        return;
      }

      /* Se toma lo que devolvió el servidor, no lo que se mandó: si normalizó
         algo, la pantalla muestra lo que quedó guardado de verdad. */
      setDias(cuerpo.dias);
      setGuardado(cuerpo.dias);
      setAviso({ tipo: "ok", texto: "Horario guardado. Ya está en la página." });
    } catch {
      setAviso({ tipo: "error", texto: "Se cortó la conexión. Probá de nuevo." });
    } finally {
      setGuardando(false);
    }
  }

  /* Se ordena de lunes a domingo: la semana de trabajo empieza el lunes, y
     arrancar en domingo obliga a saltearlo mentalmente cada vez. */
  const enOrden = [1, 2, 3, 4, 5, 6, 0]
    .map((n) => dias.find((d) => d.dia === n))
    .filter((d): d is DiaHorario => Boolean(d));

  return (
    <section className="mt-10">
      <h2 className="font-display text-h3 text-espresso">Horario y citas</h2>
      <p className="mt-2 max-w-2xl text-sm text-mocha">
        Marcá los días que abrís, poné desde qué hora hasta qué hora, y cada
        cuánto querés que empiece una cita. Lo que elijas acá es lo que la
        clienta ve al reservar.
      </p>
      <p className="mt-2 max-w-2xl text-sm text-mocha">
        El número de citas es un máximo: cada servicio tiene que{" "}
        <em>terminar</em> antes de la hora de cierre, así que en un mega volumen
        de 3 horas entran menos que en un laminado de 30 minutos.
      </p>

      <div className="mt-6 space-y-3">
        {enOrden.map((d) => {
          const espacios = cuantosEspacios(d);
          const incoherente = d.abierto && aMinutos(d.cierre) <= aMinutos(d.apertura);

          return (
            <div
              key={d.dia}
              className={cn(
                "rounded-xl border p-4",
                d.abierto ? "border-mocha/20 bg-white" : "border-mocha/10 bg-mocha/5",
                incoherente && "border-red-600",
              )}
            >
              {/*
                En el teléfono cada cosa ocupa su renglón y las dos horas van
                juntas; a partir de `sm` la fila entera entra en una línea.

                La primera versión era un `flex-wrap` suelto: a 375px dejaba
                "Lunes" y "Desde" en un renglón, "Hasta" solo en el siguiente y
                el selector solo en el otro. Dentado y difícil de recorrer, que
                importa porque Génesis va a usar esto desde el celular.
              */}
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                {/* Abre / cerrado */}
                <label className="flex min-h-11 items-center gap-2 sm:min-w-32">
                  <input
                    type="checkbox"
                    checked={d.abierto}
                    onChange={(e) => cambiar(d.dia, "abierto", e.target.checked)}
                    className="size-5 accent-espresso"
                  />
                  <span className="font-medium text-espresso">
                    {NOMBRE_DIAS[d.dia]}
                  </span>
                </label>

                {d.abierto ? (
                  <>
                    {/* Las dos horas, siempre lado a lado: se leen como un
                        rango y no como dos campos sueltos. */}
                    <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
                      <label className="flex items-center gap-2 text-sm text-mocha">
                        Desde
                        <input
                          type="time"
                          value={d.apertura}
                          onChange={(e) => cambiar(d.dia, "apertura", e.target.value)}
                          className="min-h-11 w-full min-w-0 rounded-lg border border-mocha/25 bg-white px-2 sm:w-auto"
                        />
                      </label>

                      <label className="flex items-center gap-2 text-sm text-mocha">
                        Hasta
                        <input
                          type="time"
                          value={d.cierre}
                          onChange={(e) => cambiar(d.dia, "cierre", e.target.value)}
                          className="min-h-11 w-full min-w-0 rounded-lg border border-mocha/25 bg-white px-2 sm:w-auto"
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="sr-only">Cada cuánto empieza una cita</span>
                      <select
                        value={d.intervalo}
                        onChange={(e) => cambiar(d.dia, "intervalo", Number(e.target.value))}
                        className="min-h-11 w-full rounded-lg border border-mocha/25 bg-white px-2 sm:w-auto"
                      >
                        {opcionesDeIntervalo(d.intervalo).map((i) => (
                          <option key={i.minutos} value={i.minutos}>
                            {i.texto}
                          </option>
                        ))}
                      </select>
                    </label>

                    {/*
                      El resultado, en el idioma de Génesis. No dice "540
                      minutos con paso 60": dice cuántas clientas entran y a qué
                      hora es la primera y la última.
                    */}
                    <p className="text-sm text-mocha sm:ml-auto">
                      {incoherente ? (
                        <span className="font-medium text-red-700">
                          Cierra antes de abrir
                        </span>
                      ) : (
                        <>
                          <span className="font-medium text-espresso">
                            Hasta {espacios} {espacios === 1 ? "cita" : "citas"}
                          </span>{" "}
                          — de {enDoceHoras(d.apertura)} a {enDoceHoras(d.cierre)}
                        </>
                      )}
                    </p>
                  </>
                ) : (
                  <span className="text-sm text-mocha">Cerrado</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={guardar}
          disabled={guardando || !hayCambios}
          className="min-h-11 rounded-lg bg-espresso px-6 py-3 font-medium text-cream disabled:opacity-50"
        >
          {guardando ? "Guardando…" : "Guardar horario"}
        </button>

        {hayCambios && !guardando ? (
          <button
            type="button"
            onClick={() => {
              setDias(guardado);
              setAviso(null);
            }}
            className="min-h-11 text-sm text-mocha underline underline-offset-4"
          >
            Descartar cambios
          </button>
        ) : null}

        {aviso ? (
          <p
            role="status"
            className={cn(
              "text-sm",
              aviso.tipo === "ok" ? "text-espresso" : "font-medium text-red-700",
            )}
          >
            {aviso.texto}
          </p>
        ) : null}
      </div>

      {/*
        El botón queda apagado mientras no haya cambios, así que hace falta
        decir por qué: si no, se lee como que el panel está roto.
      */}
      {!hayCambios && !aviso ? (
        <p className="mt-3 text-sm text-mocha">
          No hay cambios sin guardar.
        </p>
      ) : null}
    </section>
  );
}
