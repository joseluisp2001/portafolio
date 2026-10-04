"use client";

/**
 * La lista de citas pendientes con sus botones.
 *
 * Recibe los datos ya cargados por el servidor y actúa mediante acciones de
 * servidor. No hace `fetch` a ninguna API propia: el panel está detrás de
 * autenticación básica y esas peticiones no siempre arrastran la credencial.
 *
 * Decisiones que importan:
 *
 * - **Se pide confirmación antes de rechazar.** Aprobar de más se arregla
 *   borrando el evento; rechazar borra la cita de la clienta y no se deshace.
 * - **La tarjeta se bloquea mientras se procesa.** Sin eso, dos clics seguidos
 *   mandan dos aprobaciones de la misma cita.
 * - **Después de actuar se recarga desde el servidor**, en vez de sacar la
 *   tarjeta y confiar. Si algo falló a mitad, la cita reaparece y se ve.
 */

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { decidirCita, type CitaPendiente } from "@/app/manager/acciones";

interface Props {
  citasIniciales: CitaPendiente[];
  errorInicial: string;
}

export function PanelCitas({ citasIniciales, errorInicial }: Props) {
  const router = useRouter();
  const [pendiente, iniciarTransicion] = useTransition();
  const [procesando, setProcesando] = useState<string | null>(null);
  const [aviso, setAviso] = useState("");

  const citas = citasIniciales;

  function actuar(cita: CitaPendiente, accion: "aprobar" | "rechazar") {
    if (procesando) return;

    if (accion === "rechazar") {
      const seguro = window.confirm(
        `¿Rechazar la cita de ${cita.cliente}?\n\n` +
          `${cita.servicio} — ${cita.cuando}\n\n` +
          "Se borra del calendario. Esto no se puede deshacer.",
      );
      if (!seguro) return;
    }

    setProcesando(cita.id);
    setAviso("");
    iniciarTransicion(async () => {
      const r = await decidirCita(cita.id, accion);
      setAviso(r.mensaje);
      setProcesando(null);
      router.refresh();
    });
  }

  const boton =
    "rounded-full px-5 py-2 text-sm font-medium transition-colors duration-200 " +
    "disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div>
      {aviso && (
        <p
          role="status"
          className="mb-5 rounded-2xl border border-espresso/10 bg-white px-4 py-3 text-sm text-espresso"
        >
          {aviso}
        </p>
      )}

      {errorInicial && (
        <p
          role="alert"
          className="mb-5 rounded-2xl border border-rose-ink/30 bg-blush px-4 py-3 text-sm text-rose-ink"
        >
          {errorInicial}
        </p>
      )}

      {citas.length === 0 && !errorInicial && (
        <div className="rounded-3xl border border-espresso/10 bg-white px-6 py-12 text-center">
          <p className="font-serif text-xl text-espresso">Todo al día 🌿</p>
          <p className="mt-2 text-sm text-mocha">
            No hay citas esperando aprobación.
          </p>
        </div>
      )}

      <ul className="space-y-4">
        {citas.map((cita) => {
          const bloqueada = procesando === cita.id;
          return (
            <li
              key={cita.id}
              className={
                "rounded-3xl border border-espresso/10 bg-white p-5 transition-opacity " +
                (bloqueada ? "opacity-50" : "")
              }
            >
              <p className="font-serif text-lg text-espresso">{cita.servicio}</p>
              <p className="mt-0.5 text-sm text-espresso">{cita.cliente}</p>
              <p className="mt-2 text-sm text-mocha">📅 {cita.cuando}</p>
              {cita.telefono && (
                <p className="mt-0.5 text-sm text-mocha">📱 {cita.telefono}</p>
              )}
              {cita.nota && (
                <p className="mt-2 text-sm italic text-mocha/80">“{cita.nota}”</p>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={bloqueada || pendiente}
                  onClick={() => actuar(cita, "aprobar")}
                  className={boton + " bg-espresso text-cream hover:bg-espresso/90"}
                >
                  {bloqueada ? "Procesando…" : "Aprobar"}
                </button>
                <button
                  type="button"
                  disabled={bloqueada || pendiente}
                  onClick={() => actuar(cita, "rechazar")}
                  className={
                    boton + " border border-espresso/20 text-mocha hover:bg-blush"
                  }
                >
                  Rechazar
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => router.refresh()}
        disabled={pendiente}
        className="mt-8 w-full rounded-full border border-espresso/15 py-3 text-sm text-mocha transition-colors hover:bg-blush disabled:opacity-50"
      >
        Actualizar lista
      </button>
    </div>
  );
}
