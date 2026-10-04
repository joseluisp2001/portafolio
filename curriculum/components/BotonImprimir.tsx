'use client';

import { documentos } from '@/config/cv';

/*
  La barra de arriba: el PDF y los Word. Desaparece al imprimir.

  EL PDF no lo genera una biblioteca: llama al del navegador, que ya sabe hacer
  PDF y respeta la hoja de estilos de impresion. Una biblioteca de PDF seria una
  dependencia entera para reemplazar algo que el navegador hace mejor.

  LOS WORD son para quien tiene que subir el CV a un portal de empleo: esos
  portales pasan el archivo por un ATS, que lee mejor un .docx de una columna
  que un PDF. Los arma `pnpm word` en public/documentos/, en espanol y en
  ingles. Van como enlaces y no como botones porque SON enlaces: un archivo que
  se descarga.

  Entra ultimo, cuando ya termino el encabezado: es lo que se usa despues de
  leer, no antes.
*/
export default function BotonImprimir() {
  return (
    <div
      // pb-4: el boton no toca la hoja. Pegado al borde, parecia una pestana
      // de la hoja y no algo que esta sobre la mesa.
      className="entrada no-imprimir mx-auto flex max-w-[46rem] flex-wrap items-center justify-end gap-x-5 gap-y-2 px-6 pt-6 pb-4 sm:px-12"
      style={{ '--entrada': '560ms' } as React.CSSProperties}
    >
      <p className="text-gris">
        Word:{' '}
        <a
          href={`/documentos/${documentos.es}.docx`}
          download
          className="subrayable acento text-acento"
        >
          español
        </a>
        {' · '}
        <a
          href={`/documentos/${documentos.en}.docx`}
          download
          hrefLang="en"
          lang="en"
          className="subrayable acento text-acento"
        >
          English
        </a>
      </p>

      <button
        type="button"
        onClick={() => window.print()}
        className="pulsable border border-tinta px-4 py-2 text-tinta hover:bg-tinta hover:text-papel"
      >
        Guardar como PDF
      </button>
    </div>
  );
}
