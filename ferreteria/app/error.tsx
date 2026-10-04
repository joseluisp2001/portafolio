'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[ferreteria] error en el cliente:', error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-5xl px-3 py-16">
      <h1 className="text-h1 font-semibold">Se cayo algo de nuestro lado</h1>

      <p className="mt-3 max-w-prose">
        Proba de nuevo. Si sigue igual, escribinos con lo que necesita y se lo cotizamos a
        mano.
      </p>

      <p className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-xs bg-azul px-5 py-3 font-medium text-white"
        >
          Reintentar
        </button>
        <Link href="/" className="rounded-xs border border-linea bg-fila px-5 py-3">
          Ir al buscador
        </Link>
      </p>
    </div>
  );
}
