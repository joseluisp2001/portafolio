'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { site, type Estampado } from '@/config/site';

/*
  El panel entero: cargar, ver y borrar.

  Una sola pantalla a proposito. Es una herramienta de trabajo para una persona:
  cada pantalla de mas es un clic de mas repetido cien veces.
*/

type Estado = { tipo: 'quieto' } | { tipo: 'subiendo' } | { tipo: 'error'; texto: string };

export default function Panel({ iniciales }: { iniciales: Estampado[] }) {
  const [estampados, setEstampados] = useState<Estampado[]>(iniciales);
  const [estado, setEstado] = useState<Estado>({ tipo: 'quieto' });
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [filtroMotivo, setFiltroMotivo] = useState('');
  const [filtroColor, setFiltroColor] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return estampados.filter(
      (e) =>
        (!filtroMotivo || e.motivo === filtroMotivo) &&
        (!filtroColor || e.colores.includes(filtroColor)) &&
        (!q || `${e.codigo} ${e.nombre} ${e.notas}`.toLowerCase().includes(q)),
    );
  }, [estampados, filtroMotivo, filtroColor, busqueda]);

  async function subir(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    setEstado({ tipo: 'subiendo' });

    try {
      const respuesta = await fetch('/api/estampados', {
        method: 'POST',
        body: new FormData(formulario),
      });
      const datos = await respuesta.json();

      if (!datos.ok) {
        setEstado({ tipo: 'error', texto: datos.motivo ?? 'No se pudo guardar' });
        return;
      }

      /* Se agrega al principio sin recargar: cargando veinte estampados
         seguidos, esperar una recarga cada vez es la diferencia entre que la
         tarea se haga y que se deje a medias. */
      setEstampados((prev) => [datos.estampado, ...prev]);
      formulario.reset();
      setVistaPrevia(null);
      setEstado({ tipo: 'quieto' });
    } catch {
      setEstado({ tipo: 'error', texto: 'Se corto la conexion. La imagen no se guardo.' });
    }
  }

  async function eliminar(codigo: string) {
    const respuesta = await fetch(`/api/estampados/${codigo}`, { method: 'DELETE' });
    if (respuesta.ok) setEstampados((prev) => prev.filter((e) => e.codigo !== codigo));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="flex items-baseline justify-between gap-4 border-b border-linea pb-4">
        <h1 className="text-h1 font-medium">{site.nombre}</h1>
        <p className="rotulo">
          {estampados.length} {estampados.length === 1 ? 'estampado' : 'estampados'}
        </p>
      </header>

      {/* --- Cargar ------------------------------------------------------- */}
      <form onSubmit={subir} className="mt-6 border border-linea bg-white p-4">
        <p className="rotulo">Cargar uno nuevo</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="rotulo">Imagen</span>
            <input
              type="file"
              name="imagen"
              required
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const archivo = e.target.files?.[0];
                setVistaPrevia(archivo ? URL.createObjectURL(archivo) : null);
              }}
              className="mt-1 block w-full border border-linea px-3 py-2"
            />
            <span className="mt-1 block text-xs text-gris">
              JPG, PNG o WEBP. Hasta {site.maxMB} MB.
            </span>
          </label>

          <div className="flex items-start gap-3">
            {/* Vista previa antes de subir: evita cargar la foto equivocada y
                tener que borrarla despues. */}
            {vistaPrevia ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vistaPrevia}
                alt="Vista previa de la imagen elegida"
                className="size-24 border border-linea object-cover"
              />
            ) : (
              <div className="flex size-24 items-center justify-center border border-dashed border-linea text-xs text-gris">
                sin imagen
              </div>
            )}
          </div>

          <label className="block">
            <span className="rotulo">Codigo</span>
            <input
              name="codigo"
              required
              placeholder="EST-0142"
              className="mt-1 block w-full border border-linea px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="rotulo">Nombre</span>
            <input
              name="nombre"
              placeholder="Flores chicas azules"
              className="mt-1 block w-full border border-linea px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="rotulo">Motivo</span>
            <select name="motivo" required defaultValue="" className="mt-1 block w-full border border-linea px-3 py-2">
              <option value="" disabled>
                Elegir…
              </option>
              {site.motivos.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="rotulo">Repetido en cm</span>
            <input
              name="repetidoCm"
              type="number"
              step="0.5"
              min="0"
              placeholder="12"
              className="mt-1 block w-full border border-linea px-3 py-2"
            />
            {/* Sin esto, una foto de estampado no dice nada: no se sabe si la
                flor mide 2 cm o 20, y es lo primero que pregunta quien compra. */}
            <span className="mt-1 block text-xs text-gris">Cuanto mide el dibujo antes de repetirse.</span>
          </label>

          <label className="block">
            <span className="rotulo">Ancho del rollo</span>
            <input
              name="ancho"
              placeholder="1,50 m"
              className="mt-1 block w-full border border-linea px-3 py-2"
            />
          </label>

          <fieldset className="sm:col-span-2">
            <legend className="rotulo">Colores</legend>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {site.colores.map((c) => (
                <label key={c} className="flex items-center gap-1.5">
                  <input type="checkbox" name="colores" value={c} className="size-4" />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block sm:col-span-2">
            <span className="rotulo">Notas</span>
            <textarea
              name="notas"
              rows={2}
              maxLength={500}
              placeholder="Donde esta, cuanto queda, para que sirve…"
              className="mt-1 block w-full border border-linea px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={estado.tipo === 'subiendo'}
            className="border border-tinta bg-tinta px-5 py-3 text-papel disabled:opacity-50"
          >
            {estado.tipo === 'subiendo' ? 'Guardando…' : 'Guardar'}
          </button>

          {estado.tipo === 'error' && (
            <p role="alert" className="border border-error px-3 py-2 text-error">
              {estado.texto}
            </p>
          )}
        </div>
      </form>

      {/* --- Filtros ------------------------------------------------------ */}
      <div className="mt-8 flex flex-wrap items-end gap-3 border-b border-linea pb-4">
        <label className="block">
          <span className="rotulo">Buscar</span>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="codigo o nombre"
            className="mt-1 block border border-linea px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="rotulo">Motivo</span>
          <select
            value={filtroMotivo}
            onChange={(e) => setFiltroMotivo(e.target.value)}
            className="mt-1 block border border-linea px-3 py-2"
          >
            <option value="">todos</option>
            {site.motivos.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="rotulo">Color</span>
          <select
            value={filtroColor}
            onChange={(e) => setFiltroColor(e.target.value)}
            className="mt-1 block border border-linea px-3 py-2"
          >
            <option value="">todos</option>
            {site.colores.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <p className="rotulo ml-auto">{visibles.length} a la vista</p>
      </div>

      {/* --- Muestrario --------------------------------------------------- */}
      {visibles.length === 0 ? (
        <p className="mt-10 text-center text-gris">
          {estampados.length === 0
            ? 'Todavia no hay nada cargado.'
            : 'Ninguno calza con ese filtro.'}
        </p>
      ) : (
        <ul className="muestrario mt-6 border border-linea">
          {visibles.map((e) => (
            <li key={e.codigo} className="group relative bg-papel">
              <div className="relative aspect-square">
                <Image
                  src={`/uploads/${e.miniatura}`}
                  alt={e.nombre}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 200px, (min-width: 640px) 25vw, 50vw"
                  className="object-cover"
                />
              </div>

              <div className="border-t border-linea px-2 py-1.5">
                <p className="truncate text-xs font-medium">{e.nombre}</p>
                <p className="rotulo truncate">
                  {e.codigo}
                  {e.repetidoCm ? ` · ${e.repetidoCm} cm` : ''}
                </p>
              </div>

              <button
                type="button"
                onClick={() => eliminar(e.codigo)}
                aria-label={`Borrar ${e.nombre}`}
                className="absolute top-1 right-1 hidden size-8 items-center justify-center border border-linea bg-papel text-error group-hover:flex focus-visible:flex"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
