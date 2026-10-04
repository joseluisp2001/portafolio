'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[enfermeria] error en el cliente:', error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="text-h1">Se cayo algo de nuestro lado</h1>
      <p className="medida mt-4">
        No es culpa suya. Si lo necesita hoy, no espere a que esto funcione: escribanos
        por WhatsApp.
      </p>
      <p className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="boton toque bg-verde text-blanco hover:bg-tinta">
          Reintentar
        </button>
        <Link href="/hoy" className="boton toque border-2 border-verde text-verde hover:bg-verde hover:text-blanco">
          Lo necesito hoy
        </Link>
      </p>
    </div>
  );
}
