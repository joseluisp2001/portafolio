import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { obtenerProducto, actualizarProducto, eliminarProducto } from '@/lib/productos';
import { validateImage, generateImageName } from '@/lib/image-validator';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = authenticateApiKey(req);
  if (authError) return authError;
  const { id } = await params;
  
  try {
    const producto = await obtenerProducto(Number(id));
    if (!producto) return NextResponse.json({ mensaje: 'Producto no encontrado' }, { status: 404 });
    return NextResponse.json(producto);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ mensaje: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = authenticateApiKey(req);
  if (authError) return authError;
  const { id } = await params;
  const productId = Number(id);

  try {
    const existing = await obtenerProducto(productId);
    if (!existing) return NextResponse.json({ mensaje: 'Producto no encontrado' }, { status: 404 });

    const formData = await req.formData();
    const nombre = formData.get('nombre') as string;
    const descripcion = formData.get('descripcion') as string | null;
    const tipoProducto = formData.get('tipoProducto') as string | null;
    const talla = formData.get('talla') as string | null;
    const precioStr = formData.get('precio');
    const precio = precioStr ? Number(precioStr) : existing.Precio;
    const file = formData.get('imagen') as File | null;

    let rutaImagen = existing.RutaImagen;

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const { valid, ext, error } = validateImage(buffer);
      
      if (!valid) {
        return NextResponse.json({ mensaje: error }, { status: 400 });
      }

      const fileName = generateImageName('Desamparados Tech', 'prod', nombre || existing.Nombre, ext!);
      const publicDir = path.join(process.cwd(), 'public', 'productos');
      await fs.mkdir(publicDir, { recursive: true });
      const filePath = path.join(publicDir, fileName);
      await fs.writeFile(filePath, buffer);
      
      if (rutaImagen && rutaImagen.startsWith('/productos/')) {
        const oldFilePath = path.join(process.cwd(), 'public', rutaImagen);
        try { await fs.unlink(oldFilePath); } catch (e) { /* ignore */ }
      }
      
      rutaImagen = `/productos/${fileName}`;
    }

    await actualizarProducto(productId, {
      Nombre: nombre || existing.Nombre,
      Descripcion: descripcion !== null ? descripcion : existing.Descripcion,
      TipoProducto: tipoProducto !== null ? tipoProducto : existing.TipoProducto,
      Talla: talla !== null ? talla : existing.Talla,
      Precio: precio,
      RutaImagen: rutaImagen
    });

    return NextResponse.json({ mensaje: 'Producto actualizado' });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ mensaje: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = authenticateApiKey(req);
  if (authError) return authError;
  const { id } = await params;
  const productId = Number(id);

  try {
    const existing = await obtenerProducto(productId);
    if (!existing) return NextResponse.json({ mensaje: 'Producto no encontrado' }, { status: 404 });

    const deleted = await eliminarProducto(productId);
    
    if (deleted && existing.RutaImagen && existing.RutaImagen.startsWith('/productos/')) {
      const oldFilePath = path.join(process.cwd(), 'public', existing.RutaImagen);
      try { await fs.unlink(oldFilePath); } catch (e) { /* ignore */ }
    }

    return NextResponse.json({ mensaje: 'Producto eliminado' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ mensaje: 'Error interno' }, { status: 500 });
  }
}
