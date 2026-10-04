'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/*
  El error tambien tiene que calmar. Terracota apagada y no rojo, y el texto
  redactado como se lo diria una persona: quien esta leyendo esto puede estar
  con un animal enfermo al lado.
*/
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[veterinaria] error en el cliente:', error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-24">
      <h1 className="text-h1">Se nos cayo algo</h1>

      <p className="mt-5 text-lg">
        Es de nuestro lado. Si viene por una urgencia, no espere a que esto funcione:
        llamenos y venga.
      </p>

      <p className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/emergencias"
          className="rounded-full bg-salvia-texto px-6 py-3 font-semibold text-nube"
        >
          Ir a emergencias
        </Link>
        <button
          type="button"
          onClick={reset}
          className="rounded-full border-2 border-alerta px-6 py-3 font-semibold text-alerta"
        >
          Reintentar
        </button>
      </p>
    </div>
  );
}
