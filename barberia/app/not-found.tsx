import Link from 'next/link';

export default function NoEncontrado() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-24">
      <p className="text-xs uppercase text-gris">Error 404</p>
      <h1 className="mt-3 text-h2">Esta pagina no existe</h1>

      <p className="mt-6">
        El enlace puede estar cortado, o movimos algo de lugar. Los precios y las horas
        siguen donde estaban.
      </p>

      <p className="mt-8 flex flex-wrap gap-3">
        <Link href="/reservar" className="fila border border-hueso px-5 py-3 uppercase">
          Apartar hora
        </Link>
        <Link href="/" className="fila border border-borde px-5 py-3 uppercase text-gris">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
