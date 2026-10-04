import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * Sirve las fotos de producto que sube AdminSQlito.
 *
 * Por qué existe: al compilar para Docker, Next arma la lista de archivos de
 * `public/` en ese momento. Todo lo que se suba después **da 404**, aunque el
 * archivo esté en el disco, y el optimizador de imágenes responde 400. Con las
 * fotos montadas desde el servidor (`/root/datos/tech-productos`), ninguna se
 * veía en la tienda.
 *
 * Las URL no cambian: siguen siendo `/productos/<archivo>`, que es lo que
 * guarda la columna `RutaImagen`.
 */

const TIPOS: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ archivo: string }> }) {
  const { archivo } = await params;

  // Solo un nombre de archivo simple: sin carpetas ni "..", para que nadie
  // pueda pedir un archivo de otra parte del servidor.
  if (archivo !== path.basename(archivo) || archivo.startsWith('.')) {
    return new NextResponse('No encontrado', { status: 404 });
  }

  const tipo = TIPOS[path.extname(archivo).toLowerCase()];
  if (!tipo) return new NextResponse('No encontrado', { status: 404 });

  try {
    const ruta = path.join(process.cwd(), 'public', 'productos', archivo);
    const datos = await fs.readFile(ruta);
    return new NextResponse(new Uint8Array(datos), {
      headers: {
        'Content-Type': tipo,
        // El nombre lleva fecha, hora y un sufijo al azar: nunca se repite,
        // así que se puede cachear sin miedo.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse('No encontrado', { status: 404 });
  }
}
