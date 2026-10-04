'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { platosPorId, type Plato } from '@/config/site';

/*
  En localStorage se guarda SOLO { id, cantidad }.

  En shein-los-guido el carrito guarda una copia completa de la fila del dia en
  que se agrego —nombre, precio, foto— y la rehidrata sin volver a mirar el
  catalogo. Si sube un precio, la clienta que dejo el carrito abierto manda el
  pedido con el total de la semana pasada: o se respeta y se pierde plata, o la
  conversacion arranca corrigiendo dinero, que es la peor forma de empezar una
  venta. Y un plato que se saco de la carta sigue apareciendo en el pedido.

  Guardando solo el id, el precio siempre sale de config/site.ts, que es la
  unica fuente de verdad. Lo que ya no existe se descarta al cargar.
*/

const CLAVE = 'soda.canasta.v1';

type Linea = { id: string; cantidad: number };

export type LineaResuelta = { plato: Plato; cantidad: number };

type Canasta = {
  lineas: LineaResuelta[];
  total: number;
  unidades: number;
  agregar: (id: string) => void;
  quitar: (id: string) => void;
  cantidadDe: (id: string) => number;
  vaciar: () => void;
  /** Se descarto algo al cargar porque ya no esta en la carta. */
  huboDescartes: boolean;
};

const Contexto = createContext<Canasta | null>(null);

function leerGuardado(): { lineas: Linea[]; descartes: boolean } {
  if (typeof window === 'undefined') return { lineas: [], descartes: false };

  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (!crudo) return { lineas: [], descartes: false };

    const datos: unknown = JSON.parse(crudo);
    if (!Array.isArray(datos)) return { lineas: [], descartes: false };

    const validas: Linea[] = [];
    let descartes = false;

    for (const item of datos) {
      const l = item as Partial<Linea>;
      const cantidad = Number(l?.cantidad);

      if (typeof l?.id !== 'string' || !Number.isFinite(cantidad) || cantidad < 1) continue;

      // El plato tiene que seguir existiendo en la carta de HOY.
      if (!platosPorId[l.id]) {
        descartes = true;
        continue;
      }

      validas.push({ id: l.id, cantidad: Math.min(Math.floor(cantidad), 99) });
    }

    return { lineas: validas, descartes };
  } catch {
    // localStorage puede fallar entero en ventana privada o con las cookies
    // bloqueadas. Que no se caiga la pagina por eso.
    return { lineas: [], descartes: false };
  }
}

export function ProveedorCanasta({ children }: { children: React.ReactNode }) {
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [huboDescartes, setHuboDescartes] = useState(false);
  const hidratado = useRef(false);

  // Se lee despues del montaje: el servidor no tiene localStorage y si se leyera
  // durante el render el HTML del servidor y el del cliente no coincidirian.
  useEffect(() => {
    const { lineas: guardadas, descartes } = leerGuardado();
    setLineas(guardadas);
    setHuboDescartes(descartes);
    hidratado.current = true;
  }, []);

  /*
    Persistir en un efecto, y TODAS las acciones con la forma funcional de
    setLineas.

    No es estilo. Antes cada accion leia `lineas` del closure, asi que dos toques
    rapidos en "+" leian el MISMO arreglo viejo y el segundo pisaba al primero:
    la clienta toca tres veces y le queda uno. Lo reproduje en el sitio de la
    ferreteria, que tenia exactamente el mismo codigo, y desde ahi se corrigio
    aca tambien.
  */
  useEffect(() => {
    if (!hidratado.current) return;
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify(lineas));
    } catch {
      /* Sin espacio o con el almacenamiento bloqueado: la canasta sigue
         funcionando en memoria durante la visita. */
    }
  }, [lineas]);

  const agregar = useCallback((id: string) => {
    if (!platosPorId[id]) return;
    setLineas((prev) =>
      prev.some((l) => l.id === id)
        ? prev.map((l) => (l.id === id ? { ...l, cantidad: Math.min(l.cantidad + 1, 99) } : l))
        : [...prev, { id, cantidad: 1 }],
    );
  }, []);

  const quitar = useCallback((id: string) => {
    setLineas((prev) => {
      const actual = prev.find((l) => l.id === id);
      if (!actual) return prev;
      return actual.cantidad <= 1
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, cantidad: l.cantidad - 1 } : l));
    });
  }, []);

  const vaciar = useCallback(() => setLineas([]), []);

  const valor = useMemo<Canasta>(() => {
    const resueltas: LineaResuelta[] = lineas
      .map((l) => ({ plato: platosPorId[l.id], cantidad: l.cantidad }))
      .filter((l): l is LineaResuelta => Boolean(l.plato));

    return {
      lineas: resueltas,
      total: resueltas.reduce((suma, l) => suma + l.plato.precio * l.cantidad, 0),
      unidades: resueltas.reduce((suma, l) => suma + l.cantidad, 0),
      agregar,
      quitar,
      cantidadDe: (id: string) => lineas.find((l) => l.id === id)?.cantidad ?? 0,
      vaciar,
      huboDescartes,
    };
  }, [lineas, agregar, quitar, vaciar, huboDescartes]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCanasta(): Canasta {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useCanasta se uso fuera de ProveedorCanasta');
  return ctx;
}
