import Link from 'next/link';

export default function NoEncontrado() {
  return (
    <div className="mx-auto max-w-5xl px-3 py-16">
      <p className="text-xs text-apagado">Error 404</p>
      <h1 className="mt-2 text-h1 font-semibold">No encontramos esa pagina</h1>

      <p className="mt-3 max-w-prose">
        Puede ser un enlace viejo, o un articulo que salio de la lista. Eso no quiere decir
        que no lo tengamos: busquelo por la medida.
      </p>

      <p className="mt-5">
        <Link href="/" className="inline-block rounded-xs bg-azul px-5 py-3 font-medium text-white">
          Ir al buscador
        </Link>
      </p>
    </div>
  );
}
