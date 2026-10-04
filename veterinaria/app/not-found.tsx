import Link from 'next/link';

export default function NoEncontrado() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-24">
      <h1 className="text-h1">No encontramos esa pagina</h1>

      <p className="mt-5 text-lg">
        El enlace puede estar cortado. Si es una urgencia, el telefono y que hacer mientras
        llega estan siempre en la misma pagina.
      </p>

      <p className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/emergencias"
          className="rounded-full bg-salvia-texto px-6 py-3 font-semibold text-nube"
        >
          Emergencias
        </Link>
        <Link href="/servicios" className="rounded-full bg-arena px-6 py-3 font-semibold">
          Servicios
        </Link>
        <Link href="/" className="rounded-full px-6 py-3 font-semibold text-cielo-texto underline underline-offset-4">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
