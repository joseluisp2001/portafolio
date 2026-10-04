/*
  Genera el curriculum en Word, en espanol y en ingles, pensado para un ATS
  (el programa que filtra los CV antes de que los lea una persona).

    pnpm word          (genera los .docx y los convierte a .doc con Word)
    node scripts/generar-word.mjs        (solo los .docx)

  Salen en public/documentos/, asi el sitio los sirve para descargar
  (/documentos/...). Los datos NO se escriben aca: el espanol sale de
  config/cv.ts, el mismo archivo del sitio, y el ingles de config/cv-en.ts.
  Cambiar el CV es cambiar esos archivos y volver a correr esto.

  ---------------------------------------------------------------------------
  QUE LO HACE LEGIBLE PARA UN ATS

  Un ATS no ve el documento: le saca el texto y lo reparte en campos (nombre,
  contacto, puestos, fechas, estudios). Todo lo que complica sacar el texto en
  orden hace que un dato se pierda o caiga en el campo equivocado. Por eso:

  - UNA SOLA COLUMNA. Sin tablas, sin cuadros de texto, sin columnas: muchos
    ATS los leen en otro orden o no los leen.
  - EL CONTACTO VA EN EL CUERPO, no en el encabezado de pagina: hay ATS que
    ignoran encabezados y pies.
  - TITULOS DE SECCION ESTANDAR ("Experience", "Education"), con el estilo de
    Titulo 1 de Word. Es lo que el ATS busca para saber donde empieza cada
    parte. Las mayusculas son formato (allCaps): el texto real queda en
    minuscula y se lee normal.
  - SIN IMAGENES, SIN ICONOS, SIN GRAFICOS de nivel.
  - Fechas en un solo formato, en el renglon del lugar.
  - Vinetas de lista real de Word, no un "•" escrito a mano.
  - Fuente comun (Calibri) y texto real: nada convertido en dibujo.
  ---------------------------------------------------------------------------
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import { cv, documentos } from '../config/cv.ts';
import { cvEn } from '../config/cv-en.ts';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = path.join(RAIZ, 'public', 'documentos');

// El sitio publicado: en papel y en Word va escrito, para que se pueda teclear.
const WEB = 'cv.desamparadostech.com';

const TEXTOS = {
  es: {
    archivo: documentos.es,
    idioma: 'es-CR',
    documento: 'Currículum',
    secciones: {
      perfil: 'Perfil profesional',
      habilidades: 'Habilidades',
      proyectos: 'Proyectos',
      experiencia: 'Experiencia laboral',
      educacion: 'Educación',
      certificaciones: 'Certificaciones',
      idiomas: 'Idiomas',
    },
    tecnologias: 'Tecnologías',
    codigo: 'Código',
  },
  en: {
    archivo: documentos.en,
    idioma: 'en-US',
    documento: 'Resume',
    secciones: {
      perfil: 'Professional Summary',
      habilidades: 'Skills',
      proyectos: 'Projects',
      experiencia: 'Work Experience',
      educacion: 'Education',
      certificaciones: 'Certifications',
      idiomas: 'Languages',
    },
    tecnologias: 'Technologies',
    codigo: 'Code',
  },
};

/* El sitio separa con "·"; en Word va coma. Algun ATS viejo convierte el punto
   medio en un caracter raro, y la coma nunca falla. */
const sinPuntoMedio = (s) => s.replace(/\s*·\s*/g, ', ');

/* Los datos de cada idioma, con la misma forma. */
function datos(idioma) {
  const comun = {
    nombre: cv.nombre,
    correo: cv.contacto.correo,
    telefono: cv.contacto.telefono,
    github: cv.contacto.github,
    certificaciones: cv.certificaciones,
    // Los repos de la serie de cinco sitios, con el nombre REAL del repo (el
    // final de la URL): "barberia", no "barbería". Es lo que alguien teclea.
    repos: cv.proyectos.map((p) => ('repos' in p ? p.repos.map((r) => r.url.split('/').pop()) : [])),
  };

  if (idioma === 'es') {
    return {
      ...comun,
      // "Desarrollador web · Next.js…": aca el punto medio separa el puesto de
      // las tecnologias, asi que va una barra, como en ingles.
      titulo: cv.titulo.replace(/\s*·\s*/, ' | '),
      ciudad: `${cv.contacto.ciudad}, Costa Rica`,
      resumen: cv.resumen,
      loQueSabe: cv.loQueSabe,
      proyectos: cv.proyectos.map((p) => ({ ...p, hecho: sinPuntoMedio(p.hecho) })),
      experiencia: cv.experiencia.map((e) => ({ ...e, lugar: sinPuntoMedio(e.lugar) })),
      formacion: cv.formacion.map((f) => ({ ...f, detalle: sinPuntoMedio(f.detalle) })),
      idiomas: cv.idiomas,
    };
  }

  return { ...comun, ...cvEn };
}

/* Si alguien agrega un proyecto o un puesto en cv.ts y se olvida del ingles,
   el Word en ingles saldria con un hueco sin que nadie lo note. Mejor fallar. */
function mismoLargo(es, en) {
  const pares = [
    ['loQueSabe', es.loQueSabe, en.loQueSabe],
    ['proyectos', es.proyectos, en.proyectos],
    ['experiencia', es.experiencia, en.experiencia],
    ['formacion', es.formacion, en.formacion],
    ['idiomas', es.idiomas, en.idiomas],
    ...es.loQueSabe.map((g, i) => [`loQueSabe[${i}].cosas`, g.cosas, en.loQueSabe[i]?.cosas ?? []]),
    ...es.experiencia.map((e, i) => [
      `experiencia[${i}].puntos`,
      e.puntos ?? [],
      en.experiencia[i]?.puntos ?? [],
    ]),
  ];
  const mal = pares.filter(([, a, b]) => a.length !== b.length);
  if (mal.length) {
    throw new Error(
      'config/cv-en.ts no tiene lo mismo que config/cv.ts en: ' +
        mal.map(([n, a, b]) => `${n} (es ${a.length}, en ${b.length})`).join(', '),
    );
  }
}

// ---------------------------------------------------------------------------
// Piezas del documento
// ---------------------------------------------------------------------------

const texto = (t, extra = {}) => new TextRun({ text: t, ...extra });

const enlace = (visible, url) =>
  new ExternalHyperlink({ link: url, children: [new TextRun({ text: visible, style: 'Hyperlink' })] });

/* Titulo de seccion: estilo Titulo 1 de Word, que es lo que un ATS reconoce
   como el comienzo de una parte. */
const seccion = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [texto(t)] });

/* El renglon que abre una entrada (un puesto, un proyecto, un estudio). No se
   separa de lo que tiene debajo. */
const entrada = (principal, secundario) =>
  new Paragraph({
    keepNext: true,
    spacing: { before: 140, after: 20 },
    children: [texto(principal, { bold: true }), ...(secundario ? [texto(` | ${secundario}`)] : [])],
  });

const renglon = (t, extra = {}) =>
  new Paragraph({ keepNext: extra.keepNext ?? false, spacing: { after: 20 }, children: [texto(t, extra.run)] });

const vineta = (hijos, { keepNext = false } = {}) =>
  new Paragraph({
    numbering: { reference: 'vinetas', level: 0 },
    keepNext,
    spacing: { after: 20 },
    children: typeof hijos === 'string' ? [texto(hijos)] : hijos,
  });

/* Las vinetas de una misma entrada no se separan entre paginas: todas menos la
   ultima quedan pegadas a la siguiente. Sin esto, la linea "Code:" del ultimo
   proyecto caia sola al principio de la pagina 2. */
const vinetasJuntas = (lista) =>
  lista.map((hijos, i) => vineta(hijos, { keepNext: i < lista.length - 1 }));

const periodo = (e) => (e.desde === e.hasta ? e.desde : `${e.desde} – ${e.hasta}`);

function cuerpo(d, t) {
  const s = t.secciones;
  const partes = [];

  // --- Nombre y contacto: en el cuerpo, nunca en el encabezado de pagina.
  partes.push(
    new Paragraph({ spacing: { after: 40 }, children: [texto(d.nombre, { bold: true, size: 36 })] }),
    new Paragraph({ spacing: { after: 60 }, children: [texto(d.titulo, { size: 24 })] }),
    new Paragraph({
      spacing: { after: 20 },
      children: [
        texto(`${d.ciudad} | ${d.telefono} | `),
        enlace(d.correo, `mailto:${d.correo}`),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        enlace(`github.com/${d.github}`, `https://github.com/${d.github}`),
        texto(' | '),
        enlace(WEB, `https://${WEB}`),
      ],
    }),
  );

  // --- Perfil
  partes.push(seccion(s.perfil), new Paragraph({ spacing: { after: 40 }, children: [texto(d.resumen)] }));

  // --- Habilidades: un renglon por area. Asi el ATS encuentra cada palabra
  //     clave como texto corrido, sin barras ni nubes de logos.
  partes.push(seccion(s.habilidades));
  for (const g of d.loQueSabe) {
    partes.push(vineta([texto(`${g.area}: `, { bold: true }), texto(g.cosas.join('; '))]));
  }

  // --- Proyectos
  partes.push(seccion(s.proyectos));
  d.proyectos.forEach((p, i) => {
    const vinetas = [p.texto, [texto(`${t.tecnologias}: `, { bold: true }), texto(p.hecho)]];
    if (d.repos[i].length) {
      vinetas.push([
        texto(`${t.codigo}: `, { bold: true }),
        enlace(`github.com/${d.github}`, `https://github.com/${d.github}`),
        texto(` (${d.repos[i].join(', ')})`),
      ]);
    }
    partes.push(entrada(p.nombre, p.papel), ...vinetasJuntas(vinetas));
  });

  // --- Experiencia: puesto en negrita; lugar y fechas en el renglon de abajo.
  partes.push(seccion(s.experiencia));
  for (const e of d.experiencia) {
    partes.push(
      entrada(e.puesto),
      renglon(`${e.lugar} | ${periodo(e)}`, { keepNext: true }),
      ...vinetasJuntas([e.texto, ...(e.puntos ?? [])]),
    );
  }

  // --- Educacion
  partes.push(seccion(s.educacion));
  for (const f of d.formacion) {
    partes.push(entrada(f.titulo), renglon(`${f.lugar} | ${f.detalle}`));
  }

  // --- Certificaciones
  partes.push(seccion(s.certificaciones));
  for (const c of d.certificaciones) partes.push(vineta(c));

  // --- Idiomas
  partes.push(
    seccion(s.idiomas),
    new Paragraph({ children: [texto(d.idiomas.map((i) => `${i.idioma}: ${i.nivel}`).join(' | '))] }),
  );

  return partes;
}

function documento(idioma) {
  const t = TEXTOS[idioma];
  const d = datos(idioma);

  return new Document({
    creator: d.nombre,
    title: `${d.nombre} — ${t.documento}`,
    subject: d.titulo,
    keywords: d.loQueSabe.flatMap((g) => g.cosas).join(', '),
    styles: {
      default: {
        document: {
          // Calibri 10 pt: esta en cualquier Word, y es el tamano mas chico que
          // un CV aguanta sin volverse dificil de leer. Con la experiencia
          // completa, 10,5 pt pasaba a tres paginas.
          run: { font: 'Calibri', size: 20, language: { value: t.idioma } },
          paragraph: { spacing: { line: 252 } },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: 'Calibri', size: 22, bold: true, allCaps: true, color: '1A1A18', characterSpacing: 20 },
          paragraph: {
            outlineLevel: 0,
            keepNext: true,
            spacing: { before: 240, after: 80 },
            // La regla bajo el titulo es un borde de parrafo, no una linea
            // dibujada ni una tabla: un ATS la ignora sin problema.
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'A6A6A0', space: 2 } },
          },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: 'vinetas',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 360, hanging: 240 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            // Carta (8,5 x 11 in), el papel de Costa Rica y de Estados Unidos.
            size: { width: 12240, height: 15840 },
            margin: { top: 864, right: 1008, bottom: 864, left: 1008 },
          },
        },
        children: cuerpo(d, t),
      },
    ],
  });
}

// ---------------------------------------------------------------------------

mismoLargo(datos('es'), datos('en'));
fs.mkdirSync(SALIDA, { recursive: true });

for (const idioma of ['es', 'en']) {
  const destino = path.join(SALIDA, `${TEXTOS[idioma].archivo}.docx`);
  fs.writeFileSync(destino, await Packer.toBuffer(documento(idioma)));
  console.log(`  ${path.relative(RAIZ, destino)}`);
}
