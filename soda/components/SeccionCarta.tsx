import LineaPlato from '@/components/LineaPlato';
import type { SeccionCarta as Seccion } from '@/config/site';

export default function SeccionCarta({ seccion }: { seccion: Seccion }) {
  return (
    <section id={seccion.id} className="entra scroll-mt-20">
      <h2 className="font-display text-h2">{seccion.titulo}</h2>

      {seccion.descripcion && (
        <p className="medida mt-2 text-pie text-tinta-suave">{seccion.descripcion}</p>
      )}

      {/* `list-none` y sin marcadores: la separacion la da la linea de 1 px de
          cada plato, no una vinieta. */}
      <ul className="mt-6 border-t border-linea">
        {seccion.platos.map((plato) => (
          <LineaPlato key={plato.id} plato={plato} />
        ))}
      </ul>
    </section>
  );
}
