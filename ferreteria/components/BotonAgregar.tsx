'use client';

import { useCotizacion } from '@/components/Cotizacion';

/*
  El unico pedazo interactivo de la pagina de articulo, aislado en su propio
  componente de cliente para que el resto de la pagina siga siendo HTML estatico
  generado al compilar.
*/
export default function BotonAgregar({ codigo, nombre }: { codigo: string; nombre: string }) {
  const { agregar, cantidadDe } = useCotizacion();
  const cantidad = cantidadDe(codigo);

  return (
    <button
      type="button"
      onClick={() => agregar(codigo)}
      className="rounded-xs bg-azul px-5 py-3 font-medium text-white hover:opacity-90"
    >
      {cantidad > 0 ? `Agregar otro (${cantidad} en la cotizacion)` : `Agregar a la cotizacion`}
      <span className="sr-only"> — {nombre}</span>
    </button>
  );
}
