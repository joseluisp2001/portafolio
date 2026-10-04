import { Fragment } from 'react';
import { cv } from '@/config/cv';
import BotonImprimir from '@/components/BotonImprimir';
import Habilidades from '@/components/Habilidades';
import PaseDeImagenes from '@/components/PaseDeImagenes';
import DemoAcceso from '@/components/DemoAcceso';
import Palabras from '@/components/Palabras';
import Revelador from '@/components/Revelador';

/*
  Una sola pagina, dos presentaciones del mismo contenido.

  EN PANTALLA lleva el trabajo: habilidades que se abren, pase de imagenes con
  fundido, tipografia con tamano optico.

  EN PAPEL es un documento: todo abierto, sin pase de imagenes, sin botones, en
  negro y sin partir un puesto entre dos paginas.

  No son dos disenos: es el mismo, con la parte interactiva apagada donde no
  existe. Un curriculum que se desarma al imprimirlo se contradice solo.

  EL MOVIMIENTO sigue la misma regla. `data-revelar` marca lo que aparece al
  entrar en pantalla ("titulo", "bloque" o "cortina"); `entrada` y `--entrada`
  marcan el encabezado, que entra una vez al cargar. Todo eso vive en
  globals.css dentro de `@media screen`: en papel no existe.

  ---------------------------------------------------------------------------
  LA TIPOGRAFIA DE LAS ENTRADAS (21-9-2026)

  El NOMBRE de cada entrada (proyecto, puesto, estudio, grupo de habilidades)
  va en Newsreader: es lo que el ojo busca al recorrer la hoja. Los DATOS que
  lo acompanan (papel, lugar, fechas, stack) van en Inter gris, un escalon mas
  abajo. El gris es solo para datos: los logros, las habilidades y las
  certificaciones son contenido y van en tinta.

  EL ESPACIO tiene tres escalones en pantalla: 40 px entre secciones, 20 entre
  entradas, 4-8 dentro de una entrada. En papel quedan los de antes (print:),
  para que la paginacion no cambie.
  ---------------------------------------------------------------------------
*/

/** El retraso de la entrada del encabezado, en ms. */
const entrada = (ms: number) => ({ '--entrada': `${ms}ms` }) as React.CSSProperties;

/** La medida de linea del texto corrido: ~73 caracteres en pantalla. El
    `max-w-prose` de 65ch da unos 82 con Inter, porque el "0" es mas ancho que
    la letra promedio. En papel queda el de antes. */
const MEDIDA = 'max-w-[58ch] print:max-w-prose';

function Seccion({
  titulo,
  soloPantalla = false,
  children,
}: {
  titulo: string;
  /** Una seccion que en papel no tiene nada que mostrar se va entera, con su
      titulo: un rotulo con la regla y nada debajo delata un CV de pagina web. */
  soloPantalla?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={['mt-10 print:mt-7', soloPantalla ? 'no-imprimir' : ''].join(' ')}>
      <h2 className="seccion" data-revelar="titulo">
        <Palabras texto={titulo} />
      </h2>
      {children}
    </section>
  );
}

export default function Curriculum() {
  return (
    <>
      <BotonImprimir />

      <article className="hoja px-6 py-10 sm:px-12 sm:py-14">
        {/* --- Encabezado ------------------------------------------------- */}
        <header className="bloque">
          <h1 className="nombre">
            <Palabras texto={cv.nombre} />
          </h1>

          {/* El puesto es lo segundo que se lee: un escalon entre el nombre
              (36 px) y los datos de contacto (15 px gris), en tinta. */}
          <p className="entrada mt-1.5 text-puesto text-balance text-tinta" style={entrada(320)}>
            {cv.titulo}
          </p>

          {/* Sin cifras tabulares: en Inter tambien ensanchan el guion, y el
              correo se leia "jose - luis - prado". */}
          <p className="entrada mt-3 flex flex-wrap gap-x-4 gap-y-1 text-gris" style={entrada(400)}>
            <a href={`mailto:${cv.contacto.correo}`} className="subrayable acento text-acento">
              {cv.contacto.correo}
            </a>
            <a href={`tel:${cv.contacto.telefono.replace(/\s/g, '')}`} className="subrayable acento text-acento">
              {cv.contacto.telefono}
            </a>

            {/* Se escribe entero para que en papel se pueda teclear. Vacio = no
                aparece. */}
            {cv.contacto.github && (
              <a
                href={`https://github.com/${cv.contacto.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="subrayable acento text-acento"
              >
                github.com/{cv.contacto.github}
              </a>
            )}

            <span>{cv.contacto.ciudad}</span>
          </p>

          <p className={`entrada prosa mt-4 ${MEDIDA}`} style={entrada(480)}>
            {cv.resumen}
          </p>
        </header>

        {/* --- Lo que sabe hacer ------------------------------------------ */}
        <Seccion titulo="Lo que sé hacer">
          <Habilidades />
        </Seccion>

        {/* --- Proyectos --------------------------------------------------- */}
        <Seccion titulo="Proyectos">
          <div className="space-y-5 print:space-y-4">
            {cv.proyectos.map((p) => (
              <div key={p.nombre} className="bloque" data-revelar="bloque">
                <h3 className="flex flex-wrap items-baseline gap-x-3 font-titulo text-puesto leading-snug font-semibold">
                  {p.nombre}
                  {/* En el telefono el papel va siempre en su renglon: si no,
                      unas entradas lo bajaban y otras no. */}
                  <span className="basis-full font-cuerpo text-base font-normal text-gris sm:basis-auto">
                    {p.papel}
                  </span>

                  {/* Vacio = no se muestra. Un enlace a un 404 en un curriculum
                      es peor que no tener enlace. */}
                  {p.repo && (
                    <a
                      href={p.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="subrayable acento font-cuerpo text-base font-normal text-acento"
                    >
                      Ver el código
                    </a>
                  )}
                </h3>
                <p className={`prosa mt-1 ${MEDIDA}`}>{p.texto}</p>
                <p className="mt-0.5 text-gris">{p.hecho}</p>

                {/*
                  Cuando el proyecto son varios repos, van en un renglon:
                  "Código: soda · barbería · …". Es el mismo patron que la barra
                  de Word de arriba. Antes eran cajitas con borde, las unicas de
                  la hoja, y en papel parecian campos de formulario.
                */}
                {'repos' in p && p.repos.length > 0 && (
                  <p className="mt-0.5 text-gris">
                    Código:{' '}
                    {p.repos.map((r, i) => (
                      <Fragment key={r.url}>
                        {i > 0 && ' · '}
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="subrayable acento text-acento"
                        >
                          {r.nombre}
                        </a>
                      </Fragment>
                    ))}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/*
            El pase de imagenes va DESPUES de la lista, justo debajo de "Cinco
            sitios, cinco sistemas de diseño", que es lo que ilustra. Arriba de
            todo abria Proyectos con la carta de una soda de demostracion, y el
            trabajo en produccion quedaba 480 px mas abajo. En papel no existe.
          */}
          <div className="mt-6">
            <PaseDeImagenes />
          </div>
        </Seccion>

        {/* --- Demostración ------------------------------------------------ */}
        {/*
          Va DESPUÉS de proyectos: primero lo que se hizo de verdad, después una
          pieza que se puede tocar. Al revés parece un juguete con un currículum
          pegado atrás.

          No se imprime, ni siquiera su titulo: en papel, un formulario que no
          hace nada es una mancha.
        */}
        <Seccion titulo="Una pieza que se puede tocar" soloPantalla>
          <p className={`prosa mb-4 ${MEDIDA} text-gris`} data-revelar="bloque">
            Registro e ingreso con validación en vivo, medidor de fuerza de contraseña y
            estados de carga. Todo del lado del navegador.
          </p>
          {/* Angosta, como una figura dentro del texto: a lo ancho de la hoja
              era la masa mas pesada de la pagina, mas que el nombre. */}
          <div className="max-w-[58ch]" data-revelar="bloque">
            <DemoAcceso />
          </div>
        </Seccion>

        {/* --- Experiencia ------------------------------------------------ */}
        <Seccion titulo="Experiencia">
          <div className="space-y-5 print:space-y-3">
            {cv.experiencia.map((e) => (
              <div key={e.puesto + e.lugar} className="bloque" data-revelar="bloque">
                <h3 className="flex flex-wrap items-baseline justify-between gap-x-4 font-titulo text-puesto leading-snug font-semibold">
                  <span>
                    {e.puesto}
                    {/* En el telefono cada parte del lugar baja a su renglon y
                        los puntos medios se van: si no, el corte dejaba un
                        "Mather ·" o un "SECURITY ·" colgando al final. */}
                    <span className="font-cuerpo text-base font-normal text-gris">
                      {e.lugar.split(/\s*·\s*/).map((parte) => (
                        <Fragment key={parte}>
                          <span className="max-sm:hidden"> · </span>
                          <span className="block sm:inline">{parte}</span>
                        </Fragment>
                      ))}
                    </span>
                  </span>
                  {/* En el telefono, siempre en su renglon: si no, unas fechas
                      quedaban a la derecha del puesto y otras abajo. */}
                  <span className="fecha basis-full font-cuerpo text-base font-normal text-gris sm:basis-auto">
                    {/* Semirraya para un rango, con espacio duro antes para que
                        no quede sola al empezar un renglon. */}
                    {e.desde === e.hasta ? e.desde : `${e.desde} – ${e.hasta}`}
                  </span>
                </h3>
                <p className={`prosa mt-1 ${MEDIDA}`}>{e.texto}</p>

                {/* Lo que se hizo en el puesto. Lista real, no renglones con
                    guiones: en papel y en un lector de pantalla se lee como
                    lista. En tinta: es contenido, no un dato. */}
                {'puntos' in e && (
                  <ul className={`prosa mt-1 ${MEDIDA} list-disc space-y-0.5 pl-5 marker:text-gris`}>
                    {e.puntos.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Seccion>

        {/* --- Formacion e idiomas | certificaciones ----------------------- */}
        {/* Idiomas va bajo Formacion: a lo ancho era una seccion entera para un
            renglon, y bajo Formacion quedaba un hueco de 228 px. */}
        <div className="grid gap-x-8 sm:grid-cols-2">
          <div>
            <Seccion titulo="Formación">
              <ul className="space-y-3 print:space-y-2">
                {cv.formacion.map((f) => (
                  <li key={f.titulo} className="bloque" data-revelar="bloque">
                    <span className="block font-titulo text-puesto leading-snug font-semibold">{f.titulo}</span>
                    <span className="block text-gris">
                      {f.lugar} · {f.detalle}
                    </span>
                  </li>
                ))}
              </ul>
            </Seccion>

            <Seccion titulo="Idiomas">
              <ul className="flex flex-wrap gap-x-8">
                {cv.idiomas.map((i) => (
                  <li key={i.idioma} data-revelar="bloque">
                    <span className="font-semibold">{i.idioma}</span>
                    <span className="text-gris"> · {i.nivel}</span>
                  </li>
                ))}
              </ul>
            </Seccion>
          </div>

          <Seccion titulo="Certificaciones">
            {/* Con vineta y 8 px entre una y otra: sin eso, las que ocupan tres
                renglones se leian como un solo parrafo gris. */}
            <ul className="list-disc space-y-2 pl-5 marker:text-gris print:space-y-1">
              {cv.certificaciones.map((c) => (
                <li key={c} data-revelar="bloque">
                  {c}
                </li>
              ))}
            </ul>
          </Seccion>
        </div>
      </article>

      {/* Al final: arranca cuando todo lo de arriba ya esta en la pagina. */}
      <Revelador />
    </>
  );
}
