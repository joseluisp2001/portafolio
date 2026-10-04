import { site } from '@/config/site';
import { estadoHorario, formatoHora } from '@/lib/horario';

/*
  Lo que no tenga dato real NO se muestra. Nada de "correo@ejemplo.com" ni de un
  enlace a una red que no existe: una seccion apagada no se nota, un dato
  inventado se queda publicado. lash-brows-studio publica hoy un correo que no es
  del estudio y un enlace de fidelidad a una pagina que no existe, justamente por
  no haber hecho esto.
*/
export default function Pie() {
  const estado = estadoHorario();
  const redes = Object.entries(site.redes).filter(([, url]) => url !== '');

  return (
    <footer id="donde" className="mt-24 border-t border-linea bg-papel-hondo sm:mt-40">
      <div className="mx-auto grid max-w-5xl gap-10 px-5 py-14 sm:grid-cols-2 sm:px-8">
        <div>
          <h2 className="font-display text-h2">Donde estamos</h2>

          {site.contacto.direccion ? (
            <p className="medida mt-3">{site.contacto.direccion}</p>
          ) : (
            <p className="medida mt-3 text-tinta-suave">
              Escribinos por WhatsApp y te pasamos la ubicacion.
            </p>
          )}

          {site.contacto.mapa && (
            <a
              href={site.contacto.mapa}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-tomate-hondo underline underline-offset-4"
            >
              Abrir en el mapa
            </a>
          )}

          {site.contacto.correo && (
            <p className="mt-4 text-pie">
              <a href={`mailto:${site.contacto.correo}`} className="text-tomate-hondo underline underline-offset-4">
                {site.contacto.correo}
              </a>
            </p>
          )}

          {redes.length > 0 && (
            <ul className="mt-4 flex gap-4 text-pie">
              {redes.map(([nombre, url]) => (
                <li key={nombre}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-tomate-hondo underline underline-offset-4 capitalize"
                  >
                    {nombre}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="font-display text-h2">Horario</h2>

          <p className="mt-3 text-pie">
            <span className={estado.abierto ? 'text-oliva' : 'text-tinta-suave'}>
              {estado.abierto ? '● ' : '○ '}
              {estado.texto}
            </span>
          </p>

          <table className="mt-4 w-full max-w-xs text-pie">
            <tbody>
              {site.horario.map((franja, i) =>
                franja ? (
                  <tr key={franja.dia} className={i === 0 ? '' : 'border-t border-linea'}>
                    <th scope="row" className="py-1.5 text-left font-normal text-tinta-suave">
                      {franja.dia}
                    </th>
                    <td className="py-1.5 text-right tabular-nums">
                      {formatoHora(franja.abre)} — {formatoHora(franja.cierra)}
                    </td>
                  </tr>
                ) : null,
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="border-t border-linea px-5 py-5 text-center text-pie text-tinta-suave sm:px-8">
        {site.nombre}
      </p>
    </footer>
  );
}
