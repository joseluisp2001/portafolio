import { NextResponse } from "next/server";

import { aprobar, borrar, listar } from "@/lib/resenas";

/**
 * Moderación: aprobar y borrar.
 *
 * NO agrega una puerta nueva. `middleware.ts` ya cubre `/api/manager/*` con
 * autenticación básica, así que esta ruta entra bajo la misma llave que el
 * panel de citas — y una puerta menos es una puerta menos que se puede dejar
 * abierta por descuido.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Con pendientes: es el único lugar del sitio donde se ven. */
export async function GET() {
  return NextResponse.json({ resenas: await listar(true) });
}

export async function POST(request: Request) {
  const { id, accion } = (await request.json()) as { id?: string; accion?: string };

  if (typeof id !== "string") {
    return NextResponse.json({ ok: false, motivo: "Falta el id" }, { status: 400 });
  }

  if (accion === "aprobar") {
    const listo = await aprobar(id);
    return NextResponse.json({ ok: listo }, { status: listo ? 200 : 404 });
  }

  if (accion === "borrar") {
    const listo = await borrar(id);
    // Queda en `docker logs`: borrar es lo único irreversible de este panel.
    if (listo) console.warn(`[resenas] borrada: ${id}`);
    return NextResponse.json({ ok: listo }, { status: listo ? 200 : 404 });
  }

  return NextResponse.json({ ok: false, motivo: "Acción desconocida" }, { status: 400 });
}
