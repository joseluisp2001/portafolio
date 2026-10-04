'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/*
  Sin este archivo, una excepcion en cualquier componente cliente muestra
  "Application error: a client-side exception has occurred", en ingles y sin nada
  alrededor. Con el, al menos queda un camino de vuelta.
*/
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Queda en `docker logs` con el digest, que es lo unico que despues permite
    // encontrar el error real en el servidor.
    console.error('[soda] error en el cliente:', error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-24 sm:px-8 sm:py-32">
      <h1 className="font-display text-h1">Algo se rompio de nuestro lado</h1>

      <p className="medida mt-5">
        No es culpa suya. Proba de nuevo; si sigue igual, escribinos por WhatsApp y
        te tomamos el pedido ahi mismo.
      </p>

      <p className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-pie">
        <button
          type="button"
          onClick={reset}
          className="border border-tinta px-4 py-2 hover:bg-tinta hover:text-papel"
        >
          Reintentar
        </button>
        <Link href="/" className="text-tomate-hondo underline underline-offset-4">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
