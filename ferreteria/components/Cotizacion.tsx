'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { porCodigo, type Articulo } from '@/lib/catalogo';

/*
  No es un carrito de compra: es una lista para PEDIR PRECIO. En ferreteria el
  precio final depende de la cantidad y de si hay en bodega, asi que el sitio no
  cobra: arma el mensaje y lo manda por WhatsApp.

  Como en los otros tres sitios, en localStorage se guarda solo
  { codigo, cantidad } y el precio se reconstruye del catalogo al cargar. Asi una
  lista guardada hace dos semanas no llega con precios viejos.
*/

const CLAVE = 'ferreteria.cotizacion.v1';

type Linea = { codigo: string; cantidad: number };
export type LineaResuelta = { articulo: Articulo; cantidad: number };

type Cotizacion = {
  lineas: LineaResuelta[];
  unidades: number;
  agregar: (codigo: string) => void;
  quitar: (codigo: string) => void;
  fijar: (codigo: string, cantidad: number) => void;
  cantidadDe: (codigo: string) => number;
  vaciar: () => void;
};

const Contexto = createContext<Cotizacion | null>(null);

function leerGuardado(): Linea[] {
  if (typeof window === 'undefined') return [];
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (!crudo) return [];
    const datos: unknown = JSON.parse(crudo);
    if (!Array.isArray(datos)) return [];

    return datos
      .map((item) => item as Partial<Linea>)
      .filter((l) => typeof l?.codigo === 'string' && porCodigo[l.codigo])
      .map((l) => ({
        codigo: l.codigo as string,
        cantidad: Math.min(Math.max(Math.floor(Number(l.cantidad) || 1), 1), 999),
      }));
  } catch {
    return [];
  }
}

export function ProveedorCotizacion({ children }: { children: React.ReactNode }) {
  const [lineas, setLineas] = useState<Linea[]>([]);
  const hidratado = useRef(false);

  useEffect(() => {
    setLineas(leerGuardado());
    hidratado.current = true;
  }, []);

  /*
    Persistir en un efecto, no dentro de cada accion.

    Y TODAS las acciones usan la forma funcional de setLineas.

    Esto no es estilo: antes cada accion leia `lineas` del closure, asi que tres
    clics rapidos en [+] leian los tres el MISMO arreglo viejo y se pisaban entre
    si — de tres articulos agregados quedaba uno. Lo reproduje en el navegador
    haciendo cinco clics seguidos: se guardo uno solo.

    Con la forma funcional, cada actualizacion parte del estado real anterior y
    ninguna se pierde, por rapido que se toque.
  */
  useEffect(() => {
    if (!hidratado.current) return;
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify(lineas));
    } catch {
      /* Ventana privada o almacenamiento bloqueado: sigue en memoria. */
    }
  }, [lineas]);

  const agregar = useCallback((codigo: string) => {
    if (!porCodigo[codigo]) return;
    setLineas((prev) =>
      prev.some((l) => l.codigo === codigo)
        ? prev.map((l) => (l.codigo === codigo ? { ...l, cantidad: Math.min(l.cantidad + 1, 999) } : l))
        : [...prev, { codigo, cantidad: 1 }],
    );
  }, []);

  const quitar = useCallback((codigo: string) => {
    setLineas((prev) => {
      const actual = prev.find((l) => l.codigo === codigo);
      if (!actual) return prev;
      return actual.cantidad <= 1
        ? prev.filter((l) => l.codigo !== codigo)
        : prev.map((l) => (l.codigo === codigo ? { ...l, cantidad: l.cantidad - 1 } : l));
    });
  }, []);

  const fijar = useCallback((codigo: string, cantidad: number) => {
    const n = Math.min(Math.max(Math.floor(cantidad) || 0, 0), 999);
    setLineas((prev) => {
      if (n === 0) return prev.filter((l) => l.codigo !== codigo);
      if (!porCodigo[codigo]) return prev;
      return prev.some((l) => l.codigo === codigo)
        ? prev.map((l) => (l.codigo === codigo ? { ...l, cantidad: n } : l))
        : [...prev, { codigo, cantidad: n }];
    });
  }, []);

  const valor = useMemo<Cotizacion>(() => {
    const resueltas: LineaResuelta[] = lineas
      .map((l) => ({ articulo: porCodigo[l.codigo], cantidad: l.cantidad }))
      .filter((l): l is LineaResuelta => Boolean(l.articulo));

    return {
      lineas: resueltas,
      unidades: resueltas.length,
      agregar,
      quitar,
      fijar,
      cantidadDe: (codigo: string) => lineas.find((l) => l.codigo === codigo)?.cantidad ?? 0,
      vaciar: () => setLineas([]),
    };
  }, [lineas, agregar, quitar, fijar]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCotizacion(): Cotizacion {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useCotizacion se uso fuera de ProveedorCotizacion');
  return ctx;
}
