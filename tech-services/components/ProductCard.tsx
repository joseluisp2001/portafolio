'use client';

import Image from 'next/image';
import { site } from '@/config/site';
import { formatPrice } from '@/lib/format';

interface Producto {
  IdProducto: number;
  Nombre: string;
  Descripcion: string | null;
  TipoProducto: string | null;
  Talla: string | null;
  Precio: number;
  RutaImagen: string | null;
}

export default function ProductCard({ producto }: { producto: Producto }) {
  const hasImage = producto.RutaImagen && producto.RutaImagen !== 'Sin imagen';

  // El numero vive en config/site.ts. Antes esto leia `site.whatsapp.number`,
  // que no existe, y caia siempre al enlace sin destinatario.
  const wpUrl =
    `https://wa.me/${site.contact.whatsappNumber}?text=` +
    encodeURIComponent(`Hola, me interesa el producto: ${producto.Nombre}`);

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="aspect-square relative bg-slate-100 flex-shrink-0">
        {hasImage ? (
          <Image
            src={producto.RutaImagen as string}
            alt={producto.Nombre}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            // Sin optimizador: estas fotos se suben después de compilar y las
            // sirve app/productos/[archivo]/route.ts. El optimizador las busca
            // en la lista de `public/` hecha al compilar y responde 400.
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-start justify-between gap-2 mb-2">
          {producto.TipoProducto && (
            <span className="bg-cyan-500/10 text-cyan-700 text-xs font-medium px-2 py-1 rounded-full">
              {producto.TipoProducto}
            </span>
          )}
        </div>
        <h3 className="font-display font-medium text-slate-900 mb-1 line-clamp-2">
          {producto.Nombre}
        </h3>
        {producto.Talla && (
          <p className="text-sm text-slate-500 mb-2">
            Especificación: {producto.Talla}
          </p>
        )}
        <div className="mt-auto pt-4 flex items-center justify-between">
          <span className="font-medium text-lg text-slate-900">
            {formatPrice(producto.Precio)}
          </span>
          <a
            href={wpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Consultar
          </a>
        </div>
      </div>
    </div>
  );
}
