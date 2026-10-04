/*
  UNICA fuente de verdad de los datos del negocio.
  Lo que no tenga dato real SE APAGA, no se rellena.
*/

export const site = {
  nombre: 'Ferreteria El Tornillo',
  descripcionCorta: 'Ferreteria en Desamparados. Cotice por WhatsApp.',
  descripcionLarga:
    'Tornilleria, pinturas, electrico, PVC, herramientas y materiales de ' +
    'construccion. Si no lo ve en la lista, preguntenos: casi siempre lo tenemos.',

  urlRespaldo: 'http://localhost:3000',

  contacto: {
    /* VACIO A PROPOSITO. El build falla mientras siga asi.
       Verificar mandando un mensaje DESDE OTRO TELEFONO antes de ponerlo. */
    whatsapp: '',
    telefono: '',
    direccion: '',
    mapa: '',
  },

  /* Domingo = 0. `null` = cerrado. */
  horario: [
    null,
    { dia: 'Lunes', abre: '07:00', cierra: '17:30' },
    { dia: 'Martes', abre: '07:00', cierra: '17:30' },
    { dia: 'Miercoles', abre: '07:00', cierra: '17:30' },
    { dia: 'Jueves', abre: '07:00', cierra: '17:30' },
    { dia: 'Viernes', abre: '07:00', cierra: '17:30' },
    { dia: 'Sabado', abre: '07:00', cierra: '13:00' },
  ] as ({ dia: string; abre: string; cierra: string } | null)[],

  categorias: [
    { id: 'tornilleria', nombre: 'Tornilleria' },
    { id: 'pinturas', nombre: 'Pinturas' },
    { id: 'electrico', nombre: 'Electrico' },
    { id: 'pvc', nombre: 'PVC y fontaneria' },
    { id: 'herramientas', nombre: 'Herramientas' },
    { id: 'construccion', nombre: 'Construccion' },
  ],
} as const;
