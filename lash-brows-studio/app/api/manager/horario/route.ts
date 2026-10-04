import { NextResponse } from "next/server";
import { z } from "zod";

import { aMinutos, type DiaHorario } from "@/lib/horario";
import { guardarHorario, leerHorario } from "@/lib/horario-disco";

/**
 * Leer y guardar el horario del estudio.
 *
 * Va detrás de `middleware.ts`, que ya cubre `/api/manager/*` con autenticación
 * básica — la misma puerta que la moderación de reseñas. No se agrega una
 * nueva: cada puerta es una que se puede dejar abierta.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Dia = z.object({
  dia: z.number().int().min(0).max(6),
  abierto: z.boolean(),
  apertura: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida"),
  cierre: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida"),
  /*
    Entre 15 minutos y 8 horas.

    El piso no es capricho: con un intervalo de 5 minutos, un día de nueve horas
    genera más de cien botones de hora y la clienta no elige, se abruma. El
    techo es para que un cero o un número enorme no dejen el día sin un solo
    espacio y parezca que está todo ocupado.
  */
  intervalo: z.number().int().min(15).max(480),
});

const Esquema = z.object({
  dias: z.array(Dia).length(7, "Tienen que venir los siete días"),
});

export async function GET() {
  return NextResponse.json({ ok: true, dias: await leerHorario() });
}

export async function POST(request: Request) {
  let datos: unknown;
  try {
    datos = await request.json();
  } catch {
    return NextResponse.json({ ok: false, motivo: "Pedido inválido" }, { status: 400 });
  }

  const leido = Esquema.safeParse(datos);
  if (!leido.success) {
    return NextResponse.json(
      { ok: false, motivo: leido.error.issues[0]?.message ?? "Revisá los campos" },
      { status: 400 },
    );
  }

  /*
    Un día abierto que cierra antes de abrir no es un horario raro: es un día
    sin ningún espacio, que en la página se ve igual que "todo ocupado". Se
    rechaza con el nombre del día adentro para que Génesis sepa cuál corregir
    sin tener que adivinar.
  */
  const NOMBRES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  for (const d of leido.data.dias) {
    if (d.abierto && aMinutos(d.cierre) <= aMinutos(d.apertura)) {
      return NextResponse.json(
        {
          ok: false,
          motivo: `El ${NOMBRES[d.dia]} cierra antes de abrir. Revisá esa fila.`,
        },
        { status: 400 },
      );
    }
  }

  try {
    await guardarHorario(leido.data.dias as DiaHorario[]);
  } catch (error) {
    console.error("[horario] no se pudo guardar:", error);
    return NextResponse.json({ ok: false, motivo: "No se pudo guardar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, dias: await leerHorario() });
}
