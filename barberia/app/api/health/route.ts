import { NextResponse } from 'next/server';

// Endpoint de salud para el monitoreo. Sin esto, la unica forma de enterarse de
// que el sitio se cayo a las 3 de la manana es que un cliente escriba quejandose.
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ ok: true, hora: new Date().toISOString() });
}
