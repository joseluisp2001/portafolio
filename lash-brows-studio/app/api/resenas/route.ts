import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { site } from "@/config/site";
import { crearLimite, huellaDe, ipDe } from "@/lib/limite";
import { guardar, type Resena } from "@/lib/resenas";

/**
 * Recibe una reseña del público.
 *
 * Es el único endpoint abierto que ESCRIBE en disco, así que lleva todas las
 * defensas juntas. Cada una responde a un ataque concreto, no a una precaución
 * genérica — el detalle está en la nota "Reseñas de clientas — lash".
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* --- Límite por IP -------------------------------------------------------
   Máximo 3 por hora. El limitador vive en `lib/limite.ts`: lo comparte con
   /api/reservar, que lo necesitó después. Antes estaba escrito acá adentro, y
   copiarlo habría sido la segunda copia en el mismo proyecto — con la tercera
   ya existiendo, y con fuga, en tech-services. */
const pasaElLimite = crearLimite({ ventanaMs: 60 * 60 * 1000, tope: 3 });

/* --- Validación ----------------------------------------------------------
   Los topes existen porque sin ellos alguien manda un comentario de varios
   megas y lo que se rompe es el disco del VPS. */
const Esquema = z.object({
  nombre: z.string().trim().min(2, "Falta el nombre").max(60),
  estrellas: z.number().int().min(1).max(5),
  servicio: z.string().trim().max(80).optional().default(""),
  comentario: z.string().trim().min(10, "Contanos un poco más").max(600),
  /*
    Campo trampa: se acepta CUALQUIER texto acá a propósito.

    La primera versión lo validaba con `.max(0)`, así que zod lo rechazaba con
    un 400 antes de que corriera la comprobación de más abajo — y eso rompe la
    idea entera: un bot que recibe un error reintenta con otra técnica. Lo vi
    mandando un envío de prueba con el campo lleno: devolvió 400 en vez del 200
    que se buscaba.

    Ahora pasa la validación y se descarta después, en silencio.
  */
  web: z.string().max(500).optional().default(""),
});


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
    El campo trampa vino lleno: es un bot.

    Se responde 200 OK y NO se guarda nada. Es a propósito: un bot que recibe un
    error reintenta con otra técnica; uno que recibe éxito se va contento.
  */
  if (leido.data.web !== "") {
    return NextResponse.json({ ok: true });
  }

  const huella = huellaDe(ipDe(request));

  if (!pasaElLimite(huella)) {
    return NextResponse.json(
      { ok: false, motivo: "Ya recibimos varias reseñas desde acá. Probá más tarde." },
      { status: 429 },
    );
  }

  /* El servicio tiene que ser uno de los que el estudio ofrece de verdad: si no,
     el campo es texto libre publicado en la página de Génesis. */
  const servicio = site.services.some((s) => s.name === leido.data.servicio)
    ? leido.data.servicio
    : "";

  const resena: Resena = {
    id: randomBytes(8).toString("hex"),
    nombre: leido.data.nombre,
    estrellas: leido.data.estrellas,
    servicio,
    comentario: leido.data.comentario,
    /*
      PENDIENTE. Nada se publica solo.

      Es un sitio con el nombre de Génesis encima. Un formulario abierto en
      internet recibe spam, publicidad de otros negocios y, tarde o temprano,
      algo ofensivo. El costo de moderar es un clic; el de no moderar es que su
      página publique lo que a un desconocido se le ocurra.
    */
    estado: "pendiente",
    recibida: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Costa_Rica" }).format(new Date()),
    huella,
  };

  try {
    await guardar(resena);
  } catch (error) {
    console.error("[resenas] no se pudo guardar:", error);
    return NextResponse.json({ ok: false, motivo: "No se pudo guardar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
