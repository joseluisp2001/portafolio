import type { Metadata } from 'next';
import { site } from '@/config/site';
import SeccionCarta from '@/components/SeccionCarta';

export const metadata: Metadata = {
  title: 'Carta',
  description: `La carta completa de ${site.nombre}: ${site.carta.map((s) => s.titulo.toLowerCase()).join(', ')}.`,
  alternates: { canonical: '/carta' },
};

export default function Carta() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
      <h1 className="font-display text-h1">La carta</h1>
      <p className="medida mt-4 text-tinta-suave">
        Los precios incluyen impuestos. Tocando un plato lo agregas al pedido, y el
        pedido se manda por WhatsApp.
      </p>

      {/* Indice de anclas: en una carta larga, en celular, bajar buscando
          "bebidas" es lo que hace que la gente se salga. */}
      <nav aria-label="Secciones de la carta" className="no-imprimir mt-8 border-y border-linea py-3">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-pie">
          {site.carta.map((seccion) => (
            <li key={seccion.id}>
              <a href={`#${seccion.id}`} className="text-tomate-hondo underline underline-offset-4">
                {seccion.titulo}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-12 space-y-16">
        {site.carta.map((seccion) => (
          <SeccionCarta key={seccion.id} seccion={seccion} />
        ))}
      </div>
    </div>
  );
}
