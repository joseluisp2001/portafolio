import type { Servicio } from '@/config/site';

/*
  Iconos dibujados a mano, sin libreria.

  Trazo redondeado y grueso, para que peguen con el resto: un set de iconos de
  linea fina y esquinas rectas rompe la estetica mas que cualquier color mal
  elegido. Y evita sumar una dependencia entera para seis dibujos.

  Van dentro de un circulo de arena, decorativos: el significado lo da el titulo
  que esta debajo, no el dibujo. Por eso aria-hidden.
*/

const TRAZOS: Record<Servicio['icono'], React.ReactNode> = {
  jeringa: (
    <>
      <path d="M14 6l4 4M16 4l4 4M12.5 7.5l4 4M9 11l4 4-5 5H4v-4z" />
    </>
  ),
  estetoscopio: (
    <>
      <path d="M5 4v5a5 5 0 0010 0V4" />
      <path d="M10 14v2a4 4 0 008 0v-2" />
      <circle cx="18" cy="11" r="2.5" />
    </>
  ),
  tijeras: (
    <>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <path d="M8 7.5L19 18M8 16.5L19 6" />
    </>
  ),
  hueso: (
    <>
      <path d="M7 8a2.5 2.5 0 113.5 2.3l3 3A2.5 2.5 0 1116 17a2.5 2.5 0 01-2.3-3.5l-3-3A2.5 2.5 0 017 8z" />
    </>
  ),
  corazon: (
    <>
      <path d="M12 20s-7-4.4-7-9a4 4 0 017-2.6A4 4 0 0119 11c0 4.6-7 9-7 9z" />
    </>
  ),
  diente: (
    <>
      <path d="M7 4c2 0 2.5 1 5 1s3-1 5-1c1.5 0 2 1.5 1.6 4-.5 3-.8 4-1.3 7-.3 2-2.2 2.3-2.7 0-.3-1.6-.6-3-1.6-3s-1.3 1.4-1.6 3c-.5 2.3-2.4 2-2.7 0-.5-3-.8-4-1.3-7C5 5.5 5.5 4 7 4z" />
    </>
  ),
};

export default function Icono({ nombre }: { nombre: Servicio['icono'] }) {
  return (
    <span
      aria-hidden
      className="flex size-14 items-center justify-center rounded-full bg-arena text-salvia-texto"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {TRAZOS[nombre]}
      </svg>
    </span>
  );
}
