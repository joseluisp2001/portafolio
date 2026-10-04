/*
  UNICA fuente de verdad de los datos del negocio.

  Regla que viene de la auditoria: lo que no tenga dato real SE APAGA, no se
  rellena. Una seccion apagada no se nota; un dato inventado sale a produccion y
  se queda ahi. `scripts/check-config.mjs` corre antes de cada build y falla si
  encuentra un marcador de relleno o un numero de WhatsApp que no sea real.
*/

export type Plato = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  /** Ruta dentro de public/. Solo unos pocos platos llevan foto, a proposito:
   *  cinco platos con foto venden mas que treinta sin jerarquia. */
  foto?: string;
  /** Etiqueta corta a la derecha del precio: "el mas pedido", "vegetariano". */
  nota?: string;
};

export type SeccionCarta = {
  id: string;
  titulo: string;
  descripcion?: string;
  platos: Plato[];
};

export const site = {
  nombre: 'Soda La Esquina',
  descripcionCorta: 'Comida casera todos los dias en Desamparados.',
  descripcionLarga:
    'Casados, desayunos y olla de carne los domingos. Cocinamos lo del dia, ' +
    'con lo que hay fresco. Para comer aca o para llevar.',

  /* Dominio real del sitio. Se usa como respaldo cuando NEXT_PUBLIC_SITE_URL no
     llego al build — pasa cuando el Dockerfile no declara el ARG. */
  urlRespaldo: 'http://localhost:3000',

  contacto: {
    /*
      VACIO A PROPOSITO. El build falla mientras siga asi, y esta bien que falle.

      Este es exactamente el campo que en shein-los-guido salio a produccion con
      un numero inventado: cada clic en "hacer el pedido" se perdio durante
      semanas y nadie se dio cuenta.

      Antes de ponerlo: mandarle un mensaje al numero DESDE OTRO TELEFONO y ver
      que conteste. No alcanza con que lo dicten.

      Formato: 506 + 8 digitos, sin espacios ni signos.
    */
    whatsapp: '',

    /* Vacio = no se muestra en ningun lado. Ver Footer. */
    correo: '',

    direccion: '',
    /* Enlace de Waze o Google Maps que abra en el lugar correcto. */
    mapa: '',
  },

  /* Domingo = 0. `null` significa cerrado ese dia. */
  horario: [
    { dia: 'Domingo', abre: '07:00', cierra: '15:00' },
    { dia: 'Lunes', abre: '06:30', cierra: '19:00' },
    { dia: 'Martes', abre: '06:30', cierra: '19:00' },
    { dia: 'Miercoles', abre: '06:30', cierra: '19:00' },
    { dia: 'Jueves', abre: '06:30', cierra: '19:00' },
    { dia: 'Viernes', abre: '06:30', cierra: '20:00' },
    { dia: 'Sabado', abre: '07:00', cierra: '20:00' },
  ] as ({ dia: string; abre: string; cierra: string } | null)[],

  /*
    Foto de portada. Mientras este vacia, la portada usa un encabezado
    tipografico — que se ve intencional, no roto. En cuanto haya una foto buena
    (luz natural, sin flash, horizontal) se pone la ruta aca y el hero cambia
    solo.
  */
  hero: {
    foto: '',
    alt: '',
  },

  /*
    El menu del dia es lo unico que cambia todos los dias, y por eso el diseno le
    da el peso visual que le da. Si `fecha` no es la de hoy, la seccion NO se
    muestra: mejor que no aparezca a que muestre el menu de anteayer.

    Formato de fecha: AAAA-MM-DD.
  */
  menuDelDia: {
    fecha: '',
    platos: [] as Plato[],
  },

  carta: [
    {
      id: 'desayunos',
      titulo: 'Desayunos',
      descripcion: 'De 6:30 a 10:30.',
      platos: [
        {
          id: 'gallo-pinto',
          nombre: 'Gallo pinto',
          descripcion: 'Con huevo al gusto, natilla, queso y tortilla.',
          precio: 2500,
          nota: 'el mas pedido',
        },
        {
          id: 'pinto-completo',
          nombre: 'Pinto completo',
          descripcion: 'Gallo pinto, huevo, salchichon, platano maduro y cafe.',
          precio: 3800,
        },
        {
          id: 'huevos-rancheros',
          nombre: 'Huevos rancheros',
          descripcion: 'Dos huevos en salsa de tomate con tortilla y frijoles.',
          precio: 3200,
        },
      ],
    },
    {
      id: 'casados',
      titulo: 'Casados',
      descripcion: 'Todos vienen con arroz, frijoles, picadillo del dia, ensalada y platano maduro.',
      platos: [
        {
          id: 'casado-bistec',
          nombre: 'Casado con bistec en salsa',
          descripcion: 'Bistec de res en salsa criolla, cocinado despacio.',
          precio: 4500,
          nota: 'el mas pedido',
        },
        {
          id: 'casado-pollo',
          nombre: 'Casado con pollo a la plancha',
          descripcion: 'Pechuga a la plancha con ajo y culantro coyote.',
          precio: 4200,
        },
        {
          id: 'casado-chuleta',
          nombre: 'Casado con chuleta',
          descripcion: 'Chuleta de cerdo asada.',
          precio: 4500,
        },
        {
          id: 'casado-pescado',
          nombre: 'Casado con pescado',
          descripcion: 'Filete empanizado o a la plancha.',
          precio: 5200,
        },
        {
          id: 'casado-vegetariano',
          nombre: 'Casado vegetariano',
          descripcion: 'Con torta de vegetales y huevo.',
          precio: 3800,
          nota: 'vegetariano',
        },
      ],
    },
    {
      id: 'olla',
      titulo: 'Los domingos',
      descripcion: 'Solo domingo, y hasta que se acabe.',
      platos: [
        {
          id: 'olla-de-carne',
          nombre: 'Olla de carne',
          descripcion: 'Costilla, yuca, chayote, elote, papa y platano. Con arroz aparte.',
          precio: 5500,
        },
      ],
    },
    {
      id: 'bebidas',
      titulo: 'Bebidas',
      platos: [
        { id: 'cafe', nombre: 'Cafe chorreado', descripcion: 'Taza.', precio: 800 },
        { id: 'refresco-cas', nombre: 'Refresco de cas', descripcion: 'En agua o en leche.', precio: 1200 },
        { id: 'refresco-tamarindo', nombre: 'Refresco de tamarindo', descripcion: 'En agua.', precio: 1200 },
        { id: 'batido', nombre: 'Batido de fruta', descripcion: 'Mora, papaya o banano.', precio: 1800 },
      ],
    },
  ] as SeccionCarta[],

  /* Solo las que existen y estan activas. Vacio = no se muestra el enlace. */
  redes: {
    facebook: '',
    instagram: '',
  },
} as const;

/** Todos los platos de la carta, aplanados. Para resolver ids de la canasta. */
export const platosPorId: Record<string, Plato> = Object.fromEntries(
  site.carta.flatMap((seccion) => seccion.platos).map((plato) => [plato.id, plato]),
);
