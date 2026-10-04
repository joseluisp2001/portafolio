'use client';

import { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import { motion } from 'motion/react';
import { DURATION, STAGGER_STEP, REVEAL_Y, EASE_TECH } from '@/lib/motion';

interface Producto {
  IdProducto: number;
  Nombre: string;
  Descripcion: string | null;
  TipoProducto: string | null;
  Talla: string | null;
  Precio: number;
  RutaImagen: string | null;
}

export default function ProductGrid({ productos }: { productos: Producto[] }) {
  const [filter, setFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const categorias = useMemo(() => {
    const cats = new Set(productos.map((p) => p.TipoProducto).filter(Boolean) as string[]);
    return Array.from(cats);
  }, [productos]);

  const removeAccents = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const filtered = useMemo(() => {
    return productos.filter((p) => {
      const matchFilter = filter ? p.TipoProducto === filter : true;
      const matchSearch = search
        ? removeAccents(p.Nombre.toLowerCase()).includes(removeAccents(search.toLowerCase()))
        : true;
      return matchFilter && matchSearch;
    });
  }, [productos, filter, search]);

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === null
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos
          </button>
          {categorias.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === c
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="w-full md:w-auto relative">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      <div className="mb-6 text-sm text-slate-500">
        Mostrando {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          No hay productos disponibles con estos filtros.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((p, i) => (
            <motion.div
              data-revelar
              key={p.IdProducto}
              initial={{ opacity: 0, y: REVEAL_Y }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: DURATION?.reveal || 0.6,
                ease: EASE_TECH || [0.22, 1, 0.36, 1],
                delay: i * (STAGGER_STEP || 0.08),
              }}
            >
              <ProductCard producto={p} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
