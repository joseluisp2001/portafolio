import { site, type FilaVacuna } from '@/config/site';
import { colones } from '@/lib/whatsapp';

/*
  El bloque duro dentro de la carcasa blanda.

  Radio 8 en vez de 24, sin sombra, alineado a la izquierda, numeros tabulares.
  Sin este contraste la estetica se cae: redondo + pastel + blobs, llevado
  tambien a los datos medicos, deja de leerse "clinica" y empieza a leerse
  "guarderia".
*/

function Tabla({ titulo, filas }: { titulo: string; filas: readonly FilaVacuna[] }) {
  return (
    <div>
      <h3 className="text-lg font-extrabold">{titulo}</h3>

      <div className="tabla-dato mt-3 overflow-x-auto border border-tinta/10 bg-tarjeta">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-tinta/10 bg-arena/40">
              <th scope="col" className="font-semibold">
                Edad
              </th>
              <th scope="col" className="font-semibold">
                Vacuna
              </th>
              <th scope="col" className="text-right font-semibold">
                Precio
              </th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.edad + fila.vacuna}>
                <td className="whitespace-nowrap">{fila.edad}</td>
                <td>{fila.vacuna}</td>
                <td className="text-right whitespace-nowrap">{colones(fila.precio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TablaVacunacion() {
  return (
    <section id="vacunacion" className="mx-auto max-w-5xl scroll-mt-24 px-5 py-16">
      <h2 className="text-h2">Esquema de vacunacion</h2>
      <p className="mt-3 max-w-prose">
        Los precios incluyen la aplicacion y el carnet. Si su animal ya empezo el esquema en
        otro lado, traiga el carnet y seguimos desde ahi.
      </p>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <Tabla titulo="Perros" filas={site.vacunacion.perros} />
        <Tabla titulo="Gatos" filas={site.vacunacion.gatos} />
      </div>
    </section>
  );
}
