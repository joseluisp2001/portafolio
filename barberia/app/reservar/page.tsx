import type { Metadata } from 'next';
import { Suspense } from 'react';
import Reserva from '@/components/Reserva';

export const metadata: Metadata = {
  title: 'Apartar hora',
  description: 'Elegi el servicio, el dia y la hora. Se confirma por WhatsApp.',
  alternates: { canonical: '/reservar' },
};

export default function Reservar() {
  /*
    `useSearchParams` obliga a un limite de Suspense para que Next pueda
    prerenderizar el resto de la pagina. Sin esto el build falla.
  */
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-12 text-gris">Cargando…</div>}>
      <Reserva />
    </Suspense>
  );
}
