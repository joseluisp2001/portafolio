import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import sharp from 'sharp';
import { site, type Estampado } from '@/config/site';
import {
  asegurarCarpetas,
  guardar,
  limpiarCodigo,
  listar,
  obtener,
  rutaImagen,
  tipoDeImagen,
} from '@/lib/almacen';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ estampados: await listar() });
}

export async function POST(request: Request) {
  try {
    const formulario = await request.formData();

    // --- El archivo -------------------------------------------------------
    const archivo = formulario.get('imagen');
    if (!(archivo instanceof File) || archivo.size === 0) {
      return NextResponse.json({ ok: false, motivo: 'Falta la imagen' }, { status: 400 });
    }

    if (archivo.size > site.maxMB * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, motivo: `La imagen pasa de ${site.maxMB} MB` },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await archivo.arrayBuffer());

    /* Magic bytes, no la extension: un .jpg con cualquier cosa adentro se
       guardaria igual y despues se serviria como imagen. */
    const tipo = tipoDeImagen(buffer);
    if (!tipo) {
      return NextResponse.json(
        { ok: false, motivo: 'Ese archivo no es una imagen JPG, PNG ni WEBP' },
        { status: 400 },
      );
    }

    // --- Los datos --------------------------------------------------------
    const texto = (campo: string) => String(formulario.get(campo) ?? '').trim();

    const codigo = limpiarCodigo(texto('codigo'));
    if (!codigo) {
      return NextResponse.json({ ok: false, motivo: 'Falta el codigo' }, { status: 400 });
    }

    if (await obtener(codigo)) {
      return NextResponse.json(
        { ok: false, motivo: `Ya hay un estampado con el codigo ${codigo}` },
        { status: 409 },
      );
    }

    const motivo = texto('motivo');
    if (!site.motivos.includes(motivo as (typeof site.motivos)[number])) {
      return NextResponse.json({ ok: false, motivo: 'Motivo invalido' }, { status: 400 });
    }

    const colores = formulario
      .getAll('colores')
      .map(String)
      .filter((c) => site.colores.includes(c as (typeof site.colores)[number]));

    const repetidoCrudo = Number(texto('repetidoCm'));
    const repetidoCm =
      Number.isFinite(repetidoCrudo) && repetidoCrudo > 0 ? Math.min(repetidoCrudo, 500) : null;

    // --- Guardar ----------------------------------------------------------
    await asegurarCarpetas();

    const nombreArchivo = `${codigo}.webp`;
    const nombreMiniatura = `${codigo}-min.webp`;

    /* La grande se limita a 2000 px: mas que eso no aporta nada para mirar un
       estampado y multiplica el peso del volumen.
       La miniatura es lo que pinta la grilla — sin ella, abrir el panel con 200
       estampados baja cientos de MB. */
    await fs.writeFile(
      rutaImagen(nombreArchivo),
      await sharp(buffer).rotate().resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(),
    );

    await fs.writeFile(
      rutaImagen(nombreMiniatura),
      await sharp(buffer).rotate().resize({ width: 500, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer(),
    );

    const estampado: Estampado = {
      codigo,
      nombre: texto('nombre') || codigo,
      motivo,
      colores,
      repetidoCm,
      ancho: texto('ancho'),
      notas: texto('notas').slice(0, 500),
      archivo: nombreArchivo,
      miniatura: nombreMiniatura,
      subidoEn: new Date().toISOString(),
    };

    await guardar(estampado);

    return NextResponse.json({ ok: true, estampado });
  } catch (error) {
    /* Que quede en `docker logs` con el detalle. Una falla de subida que no deja
       rastro es la que despues no se puede explicar. */
    console.error('[estampados] fallo la subida:', error);
    return NextResponse.json({ ok: false, motivo: 'No se pudo guardar' }, { status: 500 });
  }
}
