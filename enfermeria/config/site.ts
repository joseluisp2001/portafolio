/*
  UNICA fuente de verdad.

  ---------------------------------------------------------------------------
  ESTE PROYECTO TIENE CAMPOS QUE NO SE PUEDEN INVENTAR

  Enfermeria es una profesion regulada. Publicar un numero de incorporacion que
  no existe, o decir que se hace algo que requiere indicacion medica sin
  aclararlo, no es un error de diseno: es un problema legal y de seguridad para
  quien atiende y para quien recibe.

  `scripts/check-config.mjs` corre antes de cada build y NO deja publicar
  mientras falten. Hoy falta todo, y esta bien que falte.
  ---------------------------------------------------------------------------
*/

export type Servicio = {
  slug: string;
  nombre: string;
  resumen: string;
  /** Minutos que dura la visita. Se muestra: la gente organiza su dia con eso. */
  duracion: number;
  /** Colones. 0 = se cotiza, y entonces se dice DE QUE depende. */
  precio: number;
  depende?: string;
  incluye: string[];
  /* Lo que casi ningun sitio pone, y lo que evita la visita perdida. */
  preparar: string[];
  /** true = no se puede aplicar sin receta. Se muestra en la tarjeta, no en
   *  letra chica. */
  requiereReceta?: boolean;
};

export const site = {
  nombre: 'Enfermería a domicilio',
  descripcionCorta: '',
  descripcionLarga:
    'Inyectables, curaciones, control de presión y acompañamiento de adulto mayor, ' +
    'en su casa.',

  urlRespaldo: 'http://localhost:3017',

  /*
    QUIEN ATIENDE.

    Los dos campos van vacios a proposito y el build falla asi. El numero de
    incorporacion es lo que le permite a alguien verificar que quien va a entrar
    a su casa a poner una inyeccion esta habilitado para hacerlo.
  */
  /*
    SITIO DE DEMOSTRACION (portafolio, 12-9-2026).

    El nombre, la incorporacion y los barrios de abajo son DE EJEMPLO para poder
    publicar la demo: el build no deja salir sin ellos. Con `demo: true` el sitio
    lo dice arriba de todo, porque un numero de incorporacion inventado que se
    lee como real es justo lo que este proyecto existe para no hacer.
    Para un cliente real: poner sus datos y `demo: false`.
  */
  demo: true,

  profesional: {
    nombre: 'Demo',
    /* Numero de incorporacion al colegio profesional. */
    incorporacion: 'DEMO-0000',
    /* Opcional: "Enfermera", "Auxiliar de enfermeria". Tiene que ser el titulo
       real, porque no son lo mismo ni pueden hacer lo mismo. */
    titulo: '',
  },

  contacto: {
    /* VACIO. Verificar mandando un mensaje DESDE OTRO TELEFONO antes de ponerlo. */
    whatsapp: '',
    telefono: '',
  },

  /* Los lugares escritos con su nombre. "Gran Area Metropolitana" no le sirve a
     nadie: la gente quiere ver el nombre de SU barrio. */
  cobertura: ['Desamparados Centro', 'San Rafael Abajo', 'Aserrí'] as string[],

  /*
    Lo que incluye el cuidado, tal cual lo publica el negocio en su afiche
    (12-9-2026). Sale en la portada, debajo de la franja de hoy, con un icono
    cada uno (components/NuestroCuidado.tsx). `nota` es una aclaracion corta que
    va debajo, en gris.
  */
  cuidado: [
    { icono: 'reloj24', texto: 'Modalidad 24/7' },
    { icono: 'calendario', texto: 'Horarios flexibles' },
    { icono: 'reloj', texto: 'Cuido por horas' },
    { icono: 'ducha', texto: 'Baños de aspersión y en cama' },
    { icono: 'cubiertos', texto: 'Asistencia en la alimentación' },
    { icono: 'cerebro', texto: 'Estimulación cognitiva y ejercicios de movilidad' },
    { icono: 'estetoscopio', texto: 'Procedimientos de enfermería' },
    /* El sitio no aplica nada sin indicacion medica: se dice aca tambien. */
    { icono: 'pastillas', texto: 'Suministro de medicamentos', nota: 'Según la indicación médica' },
    { icono: 'pulso', texto: 'Toma de signos vitales' },
    { icono: 'carro', texto: 'Acompañamiento a citas médicas' },
  ] as { icono: string; texto: string; nota?: string }[],

  /* Domingo = 0. `null` = no se atiende ese dia. */
  horario: [
    { dia: 'Domingo', abre: '08:00', cierra: '16:00' },
    { dia: 'Lunes', abre: '07:00', cierra: '19:00' },
    { dia: 'Martes', abre: '07:00', cierra: '19:00' },
    { dia: 'Miércoles', abre: '07:00', cierra: '19:00' },
    { dia: 'Jueves', abre: '07:00', cierra: '19:00' },
    { dia: 'Viernes', abre: '07:00', cierra: '19:00' },
    { dia: 'Sábado', abre: '07:00', cierra: '17:00' },
  ] as ({ dia: string; abre: string; cierra: string } | null)[],

  /*
    Los precios estan en 0 = "se cotiza". Cuando se sepan, se ponen: quien
    compara dos opciones descarta la que no dice el precio.
  */
  servicios: [
    {
      slug: 'inyectable',
      nombre: 'Aplicación de inyectable',
      resumen: 'Intramuscular o subcutánea, en su casa.',
      duracion: 20,
      precio: 0,
      requiereReceta: true,
      incluye: [
        'Aplicación con técnica estéril',
        'Material descartable',
        'Manejo del desecho punzocortante',
        'Observación de 10 minutos después',
      ],
      preparar: [
        'La receta médica',
        'El medicamento ya comprado',
        'Un lugar con buena luz donde la persona pueda sentarse o acostarse',
      ],
    },
    {
      slug: 'curacion',
      nombre: 'Curación de herida',
      resumen: 'Limpieza, valoración y cambio de apósito.',
      duracion: 40,
      precio: 0,
      depende: 'del tamaño de la herida y del material que lleve',
      incluye: [
        'Limpieza y valoración',
        'Cambio de apósito',
        'Indicaciones para el cuidado entre visitas',
      ],
      preparar: [
        'El material que le hayan indicado, si ya lo tiene',
        'La indicación médica, si la hay',
        'Una mesa o superficie limpia cerca',
      ],
    },
    {
      slug: 'signos-vitales',
      nombre: 'Control de presión y signos vitales',
      resumen: 'Presión, pulso, temperatura, oxigenación y glicemia.',
      duracion: 25,
      precio: 0,
      incluye: [
        'Presión arterial, pulso y temperatura',
        'Saturación de oxígeno',
        'Glicemia capilar si se solicita',
        'Registro escrito para llevar al médico',
      ],
      preparar: [
        'La lista de medicamentos que toma',
        'Los controles anteriores, si los tiene anotados',
        'No fumar ni tomar café media hora antes',
      ],
    },
    {
      slug: 'sonda',
      nombre: 'Manejo de sondas',
      resumen: 'Cambio y cuidado de sonda vesical o nasogástrica.',
      duracion: 45,
      precio: 0,
      requiereReceta: true,
      depende: 'del tipo de sonda',
      incluye: ['Cambio con técnica estéril', 'Valoración de la zona', 'Educación al cuidador'],
      preparar: ['La indicación médica', 'La sonda y el material, si ya los tiene'],
    },
    {
      slug: 'adulto-mayor',
      nombre: 'Acompañamiento de adulto mayor',
      resumen: 'Aseo, movilización, control de medicamentos y compañía.',
      duracion: 240,
      precio: 0,
      depende: 'de las horas y de si es una vez o varias por semana',
      incluye: [
        'Aseo y cambio',
        'Movilización y cambios de posición',
        'Control de horarios de medicamentos',
        'Reporte de cómo estuvo el día',
      ],
      preparar: [
        'La lista de medicamentos con sus horarios',
        'Lo que use a diario: pañales, cremas, lo que sea',
      ],
    },
    {
      slug: 'post-operatorio',
      nombre: 'Cuidado post operatorio',
      resumen: 'Los primeros días en casa después de una cirugía.',
      duracion: 60,
      precio: 0,
      depende: 'de la cirugía y de cuántas visitas se necesiten',
      incluye: [
        'Curación de la herida quirúrgica',
        'Control de signos y de dolor',
        'Educación al cuidador sobre qué vigilar',
      ],
      preparar: ['La epicrisis o el resumen del hospital', 'Las recetas de salida'],
    },
  ] as Servicio[],
} as const;

export const servicioPorSlug: Record<string, Servicio> = Object.fromEntries(
  site.servicios.map((s) => [s.slug, s]),
);





