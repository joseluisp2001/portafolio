'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[barberia] error en el cliente:', error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-24">
      <h1 className="text-h2">Algo se rompio</h1>

      <p className="mt-6">
        De nuestro lado, no del suyo. Proba de nuevo; si sigue igual, escribinos y
        apartamos la hora a mano.
      </p>

      <p className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="fila border border-hueso px-5 py-3 uppercase">
          Reintentar
        </button>
        <Link href="/" className="fila border border-borde px-5 py-3 uppercase text-gris">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
