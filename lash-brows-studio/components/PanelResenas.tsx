"use client";

import { Star } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/cn";
import type { Resena } from "@/lib/resenas";

/**
 * Moderación de reseñas, dentro del panel de Génesis.
 *
 * Las pendientes van arriba y separadas: son lo único que pide una decisión.
 * Las aprobadas quedan abajo para poder bajar una que ya se publicó.
 */
export function PanelResenas({ iniciales }: { iniciales: Resena[] }) {
  const [resenas, setResenas] = useState(iniciales);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);

  const pendientes = resenas.filter((r) => r.estado === "pendiente");
  const aprobadas = resenas.filter((r) => r.estado === "aprobada");

  async function actuar(id: string, accion: "aprobar" | "borrar") {
    setOcupado(id);
    try {
      const respuesta = await fetch("/api/manager/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, accion }),
      });
      if (!respuesta.ok) return;

      setResenas((prev) =>
        accion === "borrar"
          ? prev.filter((r) => r.id !== id)
          : prev.map((r) => (r.id === id ? { ...r, estado: "aprobada" } : r)),
      );
    } finally {
      setOcupado(null);
      setConfirmando(null);
    }
  }

  function Tarjeta({ r }: { r: Resena }) {
    return (
      <li className="rounded-xl border border-mocha/20 bg-white p-4">
        <div className="flex items-center gap-2">
          <span className="flex" aria-label={`${r.estrellas} de 5 estrellas`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={16}
                aria-hidden
                className={cn(n <= r.estrellas ? "fill-gold-ink text-gold-ink" : "text-mocha/30")}
              />
            ))}
          </span>
          <span className="font-medium text-espresso">{r.nombre}</span>
          {r.servicio && <span className="text-sm text-mocha">· {r.servicio}</span>}
          <span className="ml-auto text-sm text-mocha">{r.recibida}</span>
        </div>

        {/*
          TEXTO PLANO, sin `dangerouslySetInnerHTML` en ningún lado.

          Es la defensa más simple contra XSS y contra el uso más común de un
          formulario de reseñas abierto: meter un enlace a otro negocio en la
          página de Génesis. Sin renderizado de HTML no hay enlace posible.
        */}
        <p className="mt-2 whitespace-pre-wrap text-espresso">{r.comentario}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {r.estado === "pendiente" && (
            <button
              type="button"
              disabled={ocupado === r.id}
              onClick={() => actuar(r.id, "aprobar")}
              className="min-h-11 rounded-lg bg-espresso px-4 py-2 text-sm text-cream disabled:opacity-50"
            >
              Publicar
            </button>
          )}

          {confirmando === r.id ? (
            <>
              <button
                type="button"
                disabled={ocupado === r.id}
                onClick={() => actuar(r.id, "borrar")}
                className="min-h-11 rounded-lg border border-red-700 px-4 py-2 text-sm text-red-700"
              >
                Sí, borrarla
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(null)}
                className="min-h-11 px-3 py-2 text-sm text-mocha"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmando(r.id)}
              className="min-h-11 rounded-lg border border-mocha/30 px-4 py-2 text-sm text-mocha"
            >
              Borrar
            </button>
          )}
        </div>
      </li>
    );
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-medium text-espresso">Reseñas</h2>

      {/* Las pendientes primero: son lo único que pide una decisión hoy. */}
      <h3 className="mt-4 text-sm text-mocha">
        {pendientes.length === 0
          ? "No hay reseñas esperando"
          : `${pendientes.length} esperando que las revises`}
      </h3>

      {pendientes.length > 0 && (
        <ul className="mt-3 space-y-3">
          {pendientes.map((r) => (
            <Tarjeta key={r.id} r={r} />
          ))}
        </ul>
      )}

      {aprobadas.length > 0 && (
        <>
          <h3 className="mt-8 text-sm text-mocha">
            {aprobadas.length} publicadas — están en la página
          </h3>
          <ul className="mt-3 space-y-3">
            {aprobadas.map((r) => (
              <Tarjeta key={r.id} r={r} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
