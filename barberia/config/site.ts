/*
  UNICA fuente de verdad de los datos del negocio.

  Lo que no tenga dato real SE APAGA, no se rellena.
  `scripts/check-config.mjs` corre antes de cada build y falla si encuentra un
  marcador de relleno o un numero de WhatsApp que no sea real.
*/

export type Servicio = {
  id: string;
  nombre: string;
  /** Minutos que ocupa la silla. Decide el paso de la grilla de horas. */
  duracion: number;
  precio: number;
  detalle?: string;
};

export type Barbero = {
  id: string;
  nombre: string;
};

export const site = {
  nombre: 'Barberia El Corte',
  descripcionCorta: 'Corte y barba en Desamparados. Sin cita desde las 9.',
  descripcionLarga:
    'Corte clasico, fade, barba y perfilado. Se puede apartar hora o llegar y ' +
    'esperar el turno.',

  /* Titular de la portada. Va en mayusculas y ocupa casi toda la pantalla:
     cuatro palabras cortas funcionan, una frase larga no. */
  titular: ['Corte', 'que no', 'hay que', 'explicar'],

  urlRespaldo: 'http://localhost:3000',

  contacto: {
    /*
      VACIO A PROPOSITO. El build falla mientras siga asi.

      Antes de ponerlo: mandarle un mensaje al numero DESDE OTRO TELEFONO y ver
      que conteste. Formato: 506 + 8 digitos, sin espacios ni signos.
    */
    whatsapp: '',
    direccion: '',
    mapa: '',
  },

  /* Domingo = 0. `null` = cerrado. */
  horario: [
    null,
    { dia: 'Lunes', abre: '09:00', cierra: '19:00' },
    { dia: 'Martes', abre: '09:00', cierra: '19:00' },
    { dia: 'Miercoles', abre: '09:00', cierra: '19:00' },
    { dia: 'Jueves', abre: '09:00', cierra: '19:00' },
    { dia: 'Viernes', abre: '09:00', cierra: '20:00' },
    { dia: 'Sabado', abre: '08:00', cierra: '18:00' },
  ] as ({ dia: string; abre: string; cierra: string } | null)[],

  /*
    Minutos de colchon entre citas: limpiar la silla y recibir al siguiente.
    Se suma a la duracion del servicio para calcular el paso de la grilla.
  */
  colchon: 10,

  servicios: [
    { id: 'corte', nombre: 'Corte clasico', duracion: 30, precio: 5000 },
    { id: 'fade', nombre: 'Fade', duracion: 40, precio: 6000 },
    { id: 'corte-barba', nombre: 'Corte + barba', duracion: 50, precio: 8500 },
    { id: 'barba', nombre: 'Perfilado de barba', duracion: 20, precio: 3500 },
    { id: 'nino', nombre: 'Corte de nino', duracion: 25, precio: 4000, detalle: 'Hasta 12 anos' },
    { id: 'cejas', nombre: 'Cejas', duracion: 15, precio: 2000 },
  ] as Servicio[],

  /* Si hay uno solo, el paso de elegir barbero no se muestra. */
  barberos: [
    { id: 'cualquiera', nombre: 'El que este libre' },
  ] as Barbero[],

  /* Solo las que existen y estan activas. Vacio = no se muestra. */
  redes: {
    instagram: '',
  },
} as const;

export const serviciosPorId: Record<string, Servicio> = Object.fromEntries(
  site.servicios.map((s) => [s.id, s]),
);
