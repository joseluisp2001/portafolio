import { placaSvg } from '@/lib/placa';

// Baldosa de la placa madre del fondo de la portada (lib/placa.ts). Se genera
// una vez al compilar: la semilla es fija y el cliente arma la misma placa para
// que las señales corran por estas mismas pistas.
export const dynamic = 'force-static';

export function GET() {
  return new Response(placaSvg('oscura'), {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
