import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

const HEADER = 'X-Api-Key';

function keysEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function authenticateApiKey(req: NextRequest): NextResponse | null {
  const expected = process.env.API_KEY;
  
  if (!expected) {
    console.error('[API] No API_KEY configured — rejecting all requests');
    return NextResponse.json(
      { mensaje: 'Servicio no disponible. La clave de API no está configurada.' },
      { status: 503 }
    );
  }

  const provided = req.headers.get(HEADER);
  
  if (!provided || !keysEqual(provided, expected)) {
    return NextResponse.json(
      { mensaje: 'Clave de API ausente o incorrecta.' },
      { status: 401 }
    );
  }

  return null; // Authenticated
}
