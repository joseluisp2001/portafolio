/*
  UNICA fuente de verdad de los datos del negocio.
  Lo que no tenga dato real SE APAGA, no se rellena.
*/

export type Servicio = {
  id: string;
  nombre: string;
  descripcion: string;
  /** Nombre de un icono simple dibujado en components/Icono.tsx. */
  icono: 'jeringa' | 'estetoscopio' | 'tijeras' | 'hueso' | 'corazon' | 'diente';
  /** Vacio = "consultar". Nunca poner un precio inventado. */
  precio?: number;
};

export type FilaVacuna = {
  edad: string;
  vacuna: string;
  precio: number;
};

export const site = {
  nombre: 'Veterinaria Patitas',
  descripcionCorta: 'Clinica veterinaria y peluqueria canina en Desamparados.',
  descripcionLarga:
    'Consulta, vacunacion, desparasitacion, cirugia y peluqueria. Atendemos ' +
    'perros y gatos.',

  /* La frase de la portada. Corta y humana: acá el sitio tiene que bajar el
     pulso, no subirlo. Nada de urgencia ni de signos de admiracion. */
  frase: 'Un lugar tranquilo para su animal.',

  urlRespaldo: 'http://localhost:3000',

  contacto: {
    /* VACIO A PROPOSITO. El build falla mientras siga asi.
       Verificar mandando un mensaje DESDE OTRO TELEFONO antes de ponerlo. */
    whatsapp: '',
    /* Para /emergencias. Un telefono que suene, no un formulario. */
    telefono: '',
    correo: '',
    direccion: '',
    mapa: '',
  },

  /* Domingo = 0. `null` = cerrado. */
  horario: [
    null,
    { dia: 'Lunes', abre: '08:00', cierra: '18:00' },
    { dia: 'Martes', abre: '08:00', cierra: '18:00' },
    { dia: 'Miercoles', abre: '08:00', cierra: '18:00' },
    { dia: 'Jueves', abre: '08:00', cierra: '18:00' },
    { dia: 'Viernes', abre: '08:00', cierra: '18:00' },
    { dia: 'Sabado', abre: '08:00', cierra: '13:00' },
  ] as ({ dia: string; abre: string; cierra: string } | null)[],

  servicios: [
    {
      id: 'consulta',
      nombre: 'Consulta general',
      descripcion: 'Revision completa, con tiempo. Si hace falta algo mas, se lo explicamos antes.',
      icono: 'estetoscopio',
      precio: 12000,
    },
    {
      id: 'vacunacion',
      nombre: 'Vacunacion',
      descripcion: 'Esquema completo para perros y gatos, con carnet y recordatorio.',
      icono: 'jeringa',
    },
    {
      id: 'desparasitacion',
      nombre: 'Desparasitacion',
      descripcion: 'Interna y externa, segun el peso y la edad.',
      icono: 'corazon',
      precio: 6000,
    },
    {
      id: 'peluqueria',
      nombre: 'Peluqueria canina',
      descripcion: 'Bano, corte y unas. Sin sedacion, con paciencia.',
      icono: 'tijeras',
    },
    {
      id: 'dental',
      nombre: 'Limpieza dental',
      descripcion: 'Con valoracion previa: no todos los animales son candidatos.',
      icono: 'diente',
    },
    {
      id: 'cirugia',
      nombre: 'Cirugia',
      descripcion: 'Castracion y cirugia de tejidos blandos. Se cotiza por caso.',
      icono: 'hueso',
    },
  ] as Servicio[],

  /*
    Este bloque es el que sostiene la estetica.

    La carcasa del sitio es blanda —todo redondo, pastel, con aire—, pero los
    DATOS van estrictos: tabla, alineados a la izquierda, numeros tabulares,
    radio chico y sin sombra. Sin este contraste, redondo + pastel + blobs deja
    de leerse "clinica" y empieza a leerse "guarderia", y aca adentro operan.
  */
  vacunacion: {
    perros: [
      { edad: '6 semanas', vacuna: 'Puppy DP', precio: 12000 },
      { edad: '9 semanas', vacuna: 'Sextuple', precio: 15000 },
      { edad: '12 semanas', vacuna: 'Sextuple + Rabia', precio: 18000 },
      { edad: 'Cada ano', vacuna: 'Refuerzo sextuple + rabia', precio: 18000 },
    ] as FilaVacuna[],
    gatos: [
      { edad: '8 semanas', vacuna: 'Triple felina', precio: 14000 },
      { edad: '12 semanas', vacuna: 'Triple felina + Leucemia', precio: 20000 },
      { edad: 'Cada ano', vacuna: 'Refuerzo triple + rabia', precio: 17000 },
    ] as FilaVacuna[],
  },

  /*
    Que hacer mientras llega. Es la pagina que justifica el sitio: alguien con
    un animal convulsionando a las 11 de la noche no navega, busca un numero.
  */
  emergencias: [
    {
      titulo: 'Comio algo que no debia',
      texto:
        'No lo haga vomitar sin que se lo indiquemos: con algunos venenos y con objetos ' +
        'filosos, vomitar hace mas dano. Traiga el empaque de lo que comio si lo tiene.',
    },
    {
      titulo: 'Convulsiones',
      texto:
        'No le meta la mano en la boca. Aparte los muebles para que no se golpee, apague ' +
        'la luz y el ruido, y mire la hora: cuanto duro es el dato que mas nos sirve.',
    },
    {
      titulo: 'Se atraganto',
      texto:
        'Abra la boca y mire, pero solo saque lo que pueda agarrar sin empujar. Si no ' +
        'respira, venga de una vez y avise en el camino.',
    },
    {
      titulo: 'Golpe o atropello',
      texto:
        'Muevalo lo menos posible: use una tabla o una cobija estirada como camilla. ' +
        'Aunque camine y parezca bien, traigalo — los golpes internos no se ven.',
    },
    {
      titulo: 'Sangrado',
      texto: 'Presione con una tela limpia y sostenga la presion. No aplique torniquete.',
    },
    {
      titulo: 'Golpe de calor',
      texto:
        'Mojelo con agua fresca, NO helada, sobre todo las patas y la panza. A la sombra ' +
        'y con aire. Y venga.',
    },
  ],

  /* Solo las que existen. Vacio = no se muestra. */
  redes: {
    facebook: '',
    instagram: '',
  },
} as const;
