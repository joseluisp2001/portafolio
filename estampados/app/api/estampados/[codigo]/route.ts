import { NextResponse } from 'next/server';
import { borrar, limpiarCodigo, obtener } from '@/lib/almacen';

export const runtime = 'nodejs';

export async function DELETE(_: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo: crudo } = await params;
  const codigo = limpiarCodigo(crudo);

  if (!codigo || !(await obtener(codigo))) {
    return NextResponse.json({ ok: false, motivo: 'No existe' }, { status: 404 });
  }

  /* Borra tambien los dos archivos de imagen.

     En shein-los-guido el DELETE borra la fila y nunca toca el archivo, asi que
     el volumen se llena de fotos de productos que ya no existen y nadie sabe
     cuales sobran. Aca no. */
  await borrar(codigo);

  return NextResponse.json({ ok: true });
}
