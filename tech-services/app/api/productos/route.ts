import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { listarProductos, registrarProducto } from '@/lib/productos';
import { validateImage, generateImageName } from '@/lib/image-validator';
import fs from 'fs/promises';
import path from 'path';

const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const requests = rateLimitMap.get(ip) || [];
  const filtered = requests.filter((time) => now - time < windowMs);
  
  if (filtered.length >= 60) return false;
  
  filtered.push(now);
  rateLimitMap.set(ip, filtered);
  return true;
}

export async function GET(req: NextRequest) {
  const authError = authenticateApiKey(req);
  if (authError) return authError;

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ mensaje: 'Too many requests' }, { status: 429 });
  }

  try {
    const productos = await listarProductos();
    return NextResponse.json(productos);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ mensaje: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = authenticateApiKey(req);
  if (authError) return authError;

  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ mensaje: 'Too many requests' }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const nombre = formData.get('nombre') as string;
    const descripcion = formData.get('descripcion') as string | null;
    const tipoProducto = formData.get('tipoProducto') as string | null;
    const talla = formData.get('talla') as string | null;
    const precio = Number(formData.get('precio'));
    const file = formData.get('imagen') as File | null;

    if (!nombre || isNaN(precio)) {
      return NextResponse.json({ mensaje: 'Faltan campos obligatorios' }, { status: 400 });
    }

    let rutaImagen: string | null = null;

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const { valid, ext, error } = validateImage(buffer);
      
      if (!valid) {
        return NextResponse.json({ mensaje: error }, { status: 400 });
      }

      const fileName = generateImageName('Desamparados Tech', 'prod', nombre, ext!);
      const publicDir = path.join(process.cwd(), 'public', 'productos');
      await fs.mkdir(publicDir, { recursive: true });
      const filePath = path.join(publicDir, fileName);
      await fs.writeFile(filePath, buffer);
      rutaImagen = `/productos/${fileName}`;
    }

    const id = await registrarProducto({
      Nombre: nombre,
      Descripcion: descripcion,
      TipoProducto: tipoProducto,
      Talla: talla,
      Precio: precio,
      RutaImagen: rutaImagen
    });

    return NextResponse.json({ IdProducto: id, mensaje: 'Producto creado' }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ mensaje: 'Error interno' }, { status: 500 });
  }
}
