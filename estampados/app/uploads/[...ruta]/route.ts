import { promises as fs } from 'node:fs';
import path from 'node:path';
import { rutaSegura } from '@/lib/almacen';

/*
  Sirve las imagenes desde el disco, leyendo en cada pedido.

  Por que no van en public/: Next arma el indice de esa carpeta AL ARRANCAR, asi
  que un archivo escrito despues devuelve 404 hasta que se reinicie el proceso —
  o sea, cada estampado recien subido se veria roto. Y el contenedor se recrea
  en cada despliegue, asi que ademas se perderian todos.
*/

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const IMAGENES = path.join(process.cwd(), 'uploads', 'imagenes');

export async function GET(_: Request, { params }: { params: Promise<{ ruta: string[] }> }) {
  const { ruta } = await params;

  // Un solo segmento: no hay subcarpetas y no tiene por que haberlas.
  if (ruta.length !== 1) return new Response('No encontrado', { status: 404 });

  const completa = rutaSegura(IMAGENES, ruta[0]);
  if (!completa) return new Response('No encontrado', { status: 404 });

  try {
    const datos = await fs.readFile(completa);
    return new Response(new Uint8Array(datos), {
      headers: {
        'Content-Type': 'image/webp',
        /* Inmutable: el nombre del archivo lleva el codigo, y un codigo no se
           reusa. Si se borra y se vuelve a subir, es otro codigo. */
        'Cache-Control': 'private, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('No encontrado', { status: 404 });
  }
}
