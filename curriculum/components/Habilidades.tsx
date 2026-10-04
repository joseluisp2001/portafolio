'use client';

import { useState, type CSSProperties } from 'react';
import { cv } from '@/config/cv';

/*
  Las habilidades como grupos que se abren, no como una lista plana.

  En pantalla: se toca un area y se abre con transicion; las otras se cierran.
  Empieza abierta la primera, para que nunca se vea un bloque vacio. Al abrir,
  los renglones entran escalonados (35 ms entre uno y otro); al cerrar se van
  todos juntos, porque nadie espera a ver como se cierra algo.

  AL IMPRIMIR SE ABREN TODAS. Es la regla de este proyecto: la pantalla lleva el
  trabajo, el papel lleva el documento. Un currículum impreso con las habilidades
  escondidas detras de un clic no es un currículum.

  Y no hay barras de porcentaje: un 80% en React no significa nada, y el que lee
  lo sabe.

  UNA COLUMNA EN PANTALLA, DOS EN PAPEL (21-9-2026). En dos columnas, el grupo
  abierto crecia y el de al lado quedaba con su titulo solo: un hueco blanco de
  unos 300 x 190 px en lo primero que se ve de la hoja. En una columna no hay
  hueco y cada habilidad entra en un renglon. En papel, con todo abierto, la
  rejilla de 2x2 si se llena, y se queda.
*/
export default function Habilidades() {
  const [abierta, setAbierta] = useState<string>(cv.loQueSabe[0].area);

  return (
    <div className="grid gap-y-1 print:grid-cols-2 print:gap-x-8 print:gap-y-2">
      {cv.loQueSabe.map((grupo) => {
        const activa = grupo.area === abierta;

        return (
          <div key={grupo.area} className="bloque" data-revelar="bloque">
            <h3 className="font-titulo text-puesto leading-snug font-semibold">
              {/*
                En pantalla es un boton; al imprimir queda como texto normal
                porque el borde y la flecha se apagan y el contenido esta abierto.
              */}
              <button
                type="button"
                onClick={() => setAbierta(grupo.area)}
                aria-expanded={activa}
                className="imprimir-plano flex w-full items-center justify-between gap-3 border-b border-transparent py-1 text-left transition-colors duration-200 hover:border-regla"
              >
                {/* print:text-tinta: en papel no hay grupo "abierto", y el
                    marron en una laser sale gris sucio. */}
                <span className={['transition-colors duration-200', activa ? 'text-acento print:text-tinta' : ''].join(' ')}>
                  {grupo.area}
                </span>
                <span
                  aria-hidden
                  className={[
                    'no-imprimir text-gris transition-transform duration-300 ease-out',
                    activa ? 'rotate-90' : '',
                  ].join(' ')}
                >
                  ›
                </span>
              </button>
            </h3>

            {/*
              Se anima el grid-template-rows en vez del alto: es la unica forma
              de que una transicion de apertura funcione sin saber cuanto mide el
              contenido, y sin medirlo con JavaScript en cada render.
            */}
            <div
              data-abierta={activa}
              className={[
                'abrible grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
                activa ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              ].join(' ')}
            >
              {/* La opacidad va en cada renglon (globals.css, .abrible li) y no
                  en la lista entera: asi pueden entrar de a uno.
                  Con vineta, como la experiencia, y en tinta: son contenido,
                  no datos. El aire bajo el grupo abierto va como margen del
                  ultimo renglon, ADENTRO de la lista: un padding se veria
                  aun con el grupo cerrado. */}
              <ul className="list-disc space-y-1 overflow-hidden pl-5 marker:text-gris print:space-y-0 [&>li:last-child]:mb-3 print:[&>li:last-child]:mb-0">
                {grupo.cosas.map((cosa, i) => (
                  <li key={cosa} style={{ '--i': i } as CSSProperties}>
                    {cosa}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
