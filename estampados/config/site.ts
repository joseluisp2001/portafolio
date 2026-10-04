/*
  UNICA fuente de verdad.

  OJO: este proyecto NO es como los otros cuatro.

  No es un sitio publico. Es un panel privado para dejar los estampados
  cargados: subir la imagen, ponerle codigo, motivo, colores y el tamano del
  repetido. Nada de aca se comparte: no hay enlaces publicos, no hay tarjetas
  para WhatsApp y no hay boton de compartir en ningun lado.

  Por eso tampoco lleva numero de WhatsApp, y `scripts/check-config.mjs` esta
  ajustado para no exigirlo.
*/

export const site = {
  nombre: 'Muestrario de Estampados',
  descripcionCorta: 'Panel privado para cargar y ordenar estampados de tela.',

  urlRespaldo: 'http://localhost:3000',

  /* Este proyecto no publica nada, asi que no hay contacto que mostrar.
     Se deja el campo para que lib/whatsapp.ts siga compilando igual que en los
     otros cuatro. */
  contacto: {
    whatsapp: '',
  },

  /* Familias de motivo. Se eligen de una lista cerrada a proposito: escribir el
     motivo a mano termina en "floral", "Floral", "flores" y "flor" como cuatro
     categorias distintas, y despues no se puede filtrar por nada. */
  motivos: [
    'floral',
    'geometrico',
    'rayas',
    'cuadros',
    'lunares',
    'animal',
    'abstracto',
    'liso',
    'infantil',
    'tropical',
  ],

  /* Familias de color, para poder buscar "algo azul" sin depender de como se
     haya escrito el nombre del tono. */
  colores: [
    'blanco',
    'negro',
    'gris',
    'beige',
    'rojo',
    'rosado',
    'naranja',
    'amarillo',
    'verde',
    'azul',
    'morado',
    'multicolor',
  ],

  /* Tope de subida. Una foto de celular ronda los 3-5 MB. */
  maxMB: 8,
} as const;

export type Estampado = {
  codigo: string;
  nombre: string;
  motivo: string;
  colores: string[];
  /** Tamano del repetido en centimetros. Sin esto una foto de estampado no
   *  sirve: no se sabe si la flor mide 2 cm o 20. */
  repetidoCm: number | null;
  ancho: string;
  notas: string;
  archivo: string;
  miniatura: string;
  subidoEn: string;
};
