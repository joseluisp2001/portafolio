"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { enDoceHoras, type DiaHorario } from "@/lib/horario";
import { isOpenNow, todayRule } from "@/lib/hours";

interface TodayHoursCardProps {
  className?: string;
  /** El horario que Génesis puso en el panel. Llega por prop porque este
   *  componente corre en el navegador y el horario vive en disco. */
  horario: DiaHorario[];
}

/**
 * Tarjeta de vidrio esmerilado con el horario de hoy y si el estudio está
 * abierto en este momento.
 *
 * Va encima de la foto del hero porque responde, sin que la clienta tenga que
 * bajar, la pregunta que se hace antes de escribir: "¿me van a contestar
 * ahora?".
 *
 * HIDRATACIÓN: `todayRule()` depende sólo del día, que es el mismo en el
 * servidor y en el navegador, así que el horario se pinta desde el primer
 * render. `isOpenNow()` depende del MINUTO: si el HTML se generó a las 5:59
 * p. m. y se hidrata a las 6:00 p. m., servidor y cliente no coinciden y React
 * tira un error de hidratación. Por eso el estado arranca en `null` (no se
 * dibuja nada) y se calcula recién en el `useEffect`, que sólo corre en el
 * cliente. La fila reserva su altura con `min-h-5` para que aparecer el estado
 * no mueva nada: CLS cero.
 */
export function TodayHoursCard({ className, horario }: TodayHoursCardProps) {
  // `null` = todavía no montó y no sabemos la hora real del navegador.
  const [openNow, setOpenNow] = useState<boolean | null>(null);

  useEffect(() => {
    const refresh = () => setOpenNow(isOpenNow(new Date(), horario));
    refresh();
    // Si alguien deja la pestaña abierta encima de la hora de cierre, el punto
    // se corrige solo en el próximo minuto en vez de mentir hasta el reload.
    const timer = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(timer);
  }, [horario]);

  const rule = todayRule(new Date(), horario);
  // El horario cubre los siete días siempre, así que esto no debería pasar.
  // Se prefiere no renderizar antes que inventar un horario en el componente.
  if (!rule) return null;

  return (
    <div
      className={cn(
        "max-w-full rounded-2xl bg-cream/80 p-4 shadow-soft backdrop-blur-md",
        "border border-espresso/10",
        className,
      )}
    >
      <p className="flex min-h-5 items-center gap-2 text-sm font-medium text-espresso">
        {openNow !== null && (
          <>
            {/*
              Único color fuera de la paleta en todo el sitio. El verde de
              "abierto" es un semáforo: se lee igual en cualquier cultura y sin
              leer una palabra. Meterlo a la paleta de marca sería peor, porque
              tentaría a usarlo de adorno. Y como el estado también va escrito
              ("Abierto ahora" / "Cerrado"), nadie depende sólo del color.
            */}
            <span
              aria-hidden="true"
              className={cn(
                "size-2 shrink-0 rounded-full",
                openNow ? "bg-emerald-500" : "bg-mocha/40",
              )}
            />
            {openNow ? "Abierto ahora" : "Cerrado"}
          </>
        )}
      </p>

      <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-mocha">
        <Clock
          width={14}
          height={14}
          strokeWidth={1.5}
          aria-hidden="true"
          className="shrink-0"
        />
        <span className="font-medium text-espresso">Hoy</span>
        <span aria-hidden="true" className="text-mocha/50">
          ·
        </span>
        <span>{rule.abierto ? `${enDoceHoras(rule.apertura)} – ${enDoceHoras(rule.cierre)}` : "Cerrado"}</span>
      </p>
    </div>
  );
}
