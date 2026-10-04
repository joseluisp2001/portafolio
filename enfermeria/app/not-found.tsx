import Link from 'next/link';

export default function NoEncontrado() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <h1 className="text-h1">No encontramos esa pagina</h1>
      <p className="medida mt-4">
        Puede que el enlace este cortado. Los servicios y como pedirlos estan en el
        inicio.
      </p>
      <p className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="boton toque bg-verde text-blanco hover:bg-tinta">
          Ver los servicios
        </Link>
        <Link href="/hoy" className="boton toque border-2 border-verde text-verde hover:bg-verde hover:text-blanco">
          Lo necesito hoy
        </Link>
      </p>
    </div>
  );
}
