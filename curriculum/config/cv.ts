/*
  Todo el contenido del curriculum, en un solo archivo tipado.

  Sin base de datos y sin panel: un curriculum se edita cuatro veces al ano, y un
  panel para eso es mas cosas que se pueden romper que valor que aporta. Es la
  decision opuesta a la de estampados, y por la misma razon en espejo.

  ---
  DE DONDE SALEN ESTOS DATOS

  Del PDF "Jose Prado CV.pdf". Se corrigieron tildes y erratas que venian del
  original; cada correccion esta marcada con  // corregido:  al lado, para que
  se pueda revisar y revertir si alguna estaba bien como estaba.
*/

/*
  A QUE PUESTO SE MANDA.

  Cambiar esta palabra cambia el titulo y el perfil de arriba. El resto del
  curriculum queda igual: los proyectos y la experiencia son los mismos, lo que
  cambia es con que se abre.

  Existe porque el mismo CV sirve para dos puestos distintos y las primeras dos
  lineas deciden si lo siguen leyendo. Reescribirlas a mano cada vez termina en
  mandar la version equivocada.
*/
export const perfil: 'desarrollo' | 'soporte' = 'desarrollo';

/*
  Los Word que arma `pnpm word` (scripts/generar-word.mjs) en public/documentos/,
  en .docx y .doc. El sitio ofrece los .docx para descargar junto al boton de
  PDF. El nombre vive aca y lo leen los dos: si se cambiara en un solo lado, el
  enlace del sitio daria 404.
*/
export const documentos = {
  es: 'Jose-Luis-Prado-CV-ES',
  en: 'Jose-Luis-Prado-Resume-EN',
} as const;

const PERFILES = {
  /*
    Para puesto de programador.

    Arranca con TRES cosas verificables en la primera linea: cuantos sitios, en
    produccion, y que hacen. La version de soporte arrancaba con "soy una persona
    aplicada y dispuesta", que lo dice cualquiera y gasta diez de los treinta
    segundos que alguien le va a dar.

    El cierre no esconde que viene de soporte: lo usa. Es la diferencia real
    frente a alguien que solo programo.
  */
  desarrollo: {
    titulo: 'Desarrollador web · Next.js, TypeScript y MySQL',
    resumen:
      'Desarrollo y mantengo cuatro sitios en producción para negocios de Desamparados: ' +
      'tiendas con inventario en MySQL administrables desde el celular, reserva de citas ' +
      'contra Google Calendar y bots de WhatsApp. También un sistema de escritorio en C# ' +
      'sobre SQL Server que se vende con licencia por equipo. ' +
      /* Sin el "no X, sino Y" que tenia ("y no solo en mi maquina", "no cuando
         ya fallo algo"): esa cadencia hoy se lee como texto generado, y le
         resta peso a las cifras de arriba (21-9-2026). */
      'Vengo de soporte técnico: pruebo lo que entrego en el teléfono del cliente antes ' +
      'de darlo por terminado. En cada proyecto uso lint, control de versiones, ' +
      'respaldos y contraste verificado desde el primer día.',
  },

  /* El del PDF original, con las tildes puestas. Sirve para puestos de soporte,
     donde lo del voluntariado comprobable pesa mas que las tecnologias. */
  soporte: {
    titulo: 'Soporte técnico y desarrollo web',
    resumen:
      'Soy una persona aplicada y dispuesta a adaptarme a cualquier situación, con ' +
      'ideales de superación. La informática ha sido una parte fundamental de mi vida, ' +
      'y me he adaptado a las tecnologías disponibles. Actualmente estoy cursando el ' +
      'último bloque de un diplomado con beca. Poseo habilidades de comunicación ' +
      'asertiva, buena atención al cliente y amplia paciencia, adquirida a través de mi ' +
      'experiencia en voluntariado con niños y adultos mayores (comprobable).',
  },
} as const;

export const cv = {
  nombre: 'José Luis Prado Gutiérrez',

  /* Una linea de que hace. No un "objetivo profesional". */
  titulo: PERFILES[perfil].titulo,

  contacto: {
    correo: 'jose-luis-prado@hotmail.com',
    telefono: '+506 7269 6251',
    whatsapp: '50672696251',
    ciudad: 'Desamparados, San José',

    /*
      Perfil de GitHub. Vacio = no se muestra.

      Cuando exista, va SOLO el usuario (por ejemplo 'joseluisp2001'), no la URL
      entera: en papel se imprime "github.com/usuario", que se puede teclear, y
      no un enlace azul subrayado que en una hoja no sirve para nada.

      OJO: esta cuenta lleva el nombre real. El blog anonimo NO va en ella.
      Ver la nota "Repos publicos del portafolio".
    */
    github: 'joseluisp2001',
  },

  /* Sale del perfil elegido arriba. */
  resumen: PERFILES[perfil].resumen,

  /*
    Agrupado, no una nube de logos ni barras de porcentaje. Un 80% en React no
    significa nada; lo que dice algo es que construyo y que problema resolvio.
  */
  loQueSabe: [
    {
      area: 'Desarrollo web',
      cosas: [
        'Next.js, React y TypeScript',
        'Tailwind CSS y sistemas de diseño propios',
        'MySQL: modelado, consultas y administración',
        'APIs REST con autenticación por llave',
      ],
    },
    {
      area: 'Servidores y automatización',
      cosas: [
        'Linux en VPS: Docker, Traefik, HTTPS y cortafuegos',
        'n8n para automatizar flujos de trabajo',
        'Bots de WhatsApp con Evolution API',
        'Modelos de lenguaje corriendo en local con Ollama',
      ],
    },
    {
      area: 'Escritorio y datos',
      cosas: [
        'C# y .NET con WinForms',
        'SQL Server',
        'Sistema de licencias con firma criptográfica',
      ],
    },
    {
      area: 'Soporte y redes',
      cosas: [
        'Soporte técnico a usuario final, presencial y remoto',
        'Redes: cableado, configuración y diagnóstico',
        'Reparación de equipo de escritorio y portátil',
        'Atención al cliente y levantamiento de requerimientos',
        'Ofimática con LibreOffice',
      ],
    },
  ],

  /*
    LA SECCION QUE MAS VENDE.

    Cinco entradas, no quince. Cada una dice que problema resolvio, que es lo que
    el que lee esta tratando de averiguar.
  */
  proyectos: [
    {
      nombre: 'Lash & Brows Studio',
      /* Copia publica y limpia. Vacio = no se muestra el enlace: un enlace roto
         en un curriculum es peor que no tener enlace. Ver la nota de Obsidian
         "Repos publicos del portafolio". */
      repo: '',
      papel: 'Sitio completo, en producción',
      texto:
        'Sitio de un estudio de pestañas con reserva de citas contra Google Calendar y ' +
        'bot de WhatsApp. El formulario apartaba la cita sola, y el panel privado le ' +
        'permitía a la dueña aprobar o rechazar desde el teléfono.',
      hecho: 'Next.js · n8n · Google Calendar · Evolution API · Docker',
    },
    {
      nombre: 'Rapitelas',
      /* Copia publica y limpia. Vacio = no se muestra el enlace: un enlace roto
         en un curriculum es peor que no tener enlace. Ver la nota de Obsidian
         "Repos publicos del portafolio". */
      repo: '',
      papel: 'Catálogo de 3.060 artículos',
      texto:
        'Tienda de telas con búsqueda, filtros por categoría y canasta que arma el ' +
        'pedido y lo manda por WhatsApp. El catálogo se genera desde las fotos del ' +
        'inventario con un script propio.',
      hecho: 'Next.js · generación estática · Node',
    },
    {
      nombre: 'SHEIN Los Guido',
      /* Copia publica y limpia. Vacio = no se muestra el enlace: un enlace roto
         en un curriculum es peor que no tener enlace. Ver la nota de Obsidian
         "Repos publicos del portafolio". */
      repo: '',
      papel: 'Tienda con panel de administración',
      texto:
        'Tienda de ropa sobre MySQL, administrable desde el celular: subir producto ' +
        'con foto, editar precios y ver el inventario. La misma base la comparten tres ' +
        'tiendas distintas.',
      hecho: 'Next.js · MySQL · API con llave · Docker',
    },
    {
      nombre: 'PlanillaVanguard',
      /* Copia publica y limpia. Vacio = no se muestra el enlace: un enlace roto
         en un curriculum es peor que no tener enlace. Ver la nota de Obsidian
         "Repos publicos del portafolio". */
      repo: '',
      papel: 'Software de escritorio, vendido con licencia',
      texto:
        'Control de personal de seguridad para una empresa con 27 bases. Escritorio en ' +
        'C# sobre SQL Server, con un sistema de licencias por equipo firmado ' +
        'criptográficamente para que no se pueda copiar.',
      hecho: 'C# · WinForms · SQL Server · firma RSA',
    },
    {
      nombre: 'Cinco sitios, cinco sistemas de diseño',
      repo: '',
      /*
        Cuando un proyecto son varios repos, van como pestanas: cinco enlaces
        cortos en una fila, no cinco lineas. Es lo que hace que se lean como una
        serie y no como cinco proyectos sueltos.

        Estos seis nacieron limpios y tienen el historial sin secretos, asi que
        se publican TAL CUAL — no hacen falta copias.
      */
      repos: [
        { nombre: 'soda', url: 'https://github.com/joseluisp2001/portafolio/tree/main/soda' },
        { nombre: 'barbería', url: 'https://github.com/joseluisp2001/portafolio/tree/main/barberia' },
        { nombre: 'veterinaria', url: 'https://github.com/joseluisp2001/portafolio/tree/main/veterinaria' },
        { nombre: 'ferretería', url: 'https://github.com/joseluisp2001/portafolio/tree/main/ferreteria' },
        { nombre: 'estampados', url: 'https://github.com/joseluisp2001/portafolio/tree/main/estampados' },
      ],
      papel: 'Trabajo propio',
      texto:
        'Cinco sitios, cada uno con su propia identidad visual. Los contrastes de cada uno ' +
        'se verificaron contra WCAG AA antes de escribir código.',
      hecho: 'Next.js · Tailwind v4 · TypeScript',
    },
  ],

  /*
    Las laminas del pase de imagenes.

    NO son capturas: son laminas dibujadas con la paleta y la estructura real de
    cada proyecto. Cuando haya capturas de verdad, se reemplaza el archivo en
    public/proyectos/ y no hay que tocar nada mas.
  */
  galeria: [
    { archivo: 'soda.svg', titulo: 'Soda La Esquina', pie: 'Editorial cálido — la carta se lee como papel impreso' }, // corregido: tilde
    { archivo: 'barberia.svg', titulo: 'Barbería El Corte', pie: 'Brutalista — rejilla, mayúsculas y un solo color de señal' }, // corregido: tildes y eñe
    { archivo: 'veterinaria.svg', titulo: 'Veterinaria Patitas', pie: 'Suave — carcasa blanda con los datos médicos en tabla dura' }, // corregido: tilde
    { archivo: 'ferreteria.svg', titulo: 'Ferretería El Tornillo', pie: 'Catálogo denso — el buscador ocupa el lugar del hero' }, // corregido: tildes
    { archivo: 'estampados.svg', titulo: 'Muestrario de Estampados', pie: 'Panel privado — el sitio no tiene color propio: lo pone la tela' },
    { archivo: 'planillavanguard.svg', titulo: 'PlanillaVanguard', pie: 'Escritorio en C# sobre SQL Server, con licencia por equipo' },
  ],

  /*
    `puntos`: lo que se hizo en el puesto, uno por renglon. Sale del CV original
    ("Curriculum Vitae Jose Luis Prado", 21-9-2026), con la ortografia arreglada
    y sin agregar nada. Un puesto con una sola linea no le dice nada a un ATS:
    lo que compara con la oferta son estas palabras.
  */
  experiencia: [
    {
      puesto: 'Técnico de área',
      //  : espacio duro antes del punto medio, para que nunca empiece un
      // renglon en el telefono.
      lugar: 'Mather · Clínica Marcial Fallas (CCSS)',
      desde: 'Diciembre 2025',
      hasta: 'Actualidad',
      texto: 'Mesa de ayuda y soporte técnico para los funcionarios de la clínica.',
      puntos: [
        'Mantenimiento de computadoras, laptops, tablets, quioscos y cámaras',
        'Creación de puntos de red e instalación de software según la especialidad de cada servicio',
        'Mejoras para los funcionarios: accesos directos, capacitación y acomodo de equipos según sus requerimientos',
        'Destrucción de equipos según los protocolos de desecho de la CCSS, y manejo de bitácoras',
        'Disponibilidad para horario rotativo',
      ],
    },
    {
      puesto: 'Técnico Autorizado Orbe',
      lugar: 'Los de TI, contratista de Orbe',
      desde: '2024',
      hasta: '2025',
      texto: 'Supervisor de proyectos: cierre de proyectos con todos los protocolos y más de 40 personas a cargo.',
      puntos: [
        'Trabajo con protocolos especiales en el Ministerio de Justicia y Paz, SINAC, Ministerio de Hacienda, Banco Nacional y Correos de Costa Rica',
        'Instalación masiva de imágenes ISO e instalación de software según la institución',
        'Actualizaciones de firmware para cerrar vulnerabilidades de seguridad',
        'Sistema de tickets con registro de inventario, y retiro de equipo en arrendamiento por inventario',
        'Instalación y mantenimiento preventivo de impresoras, software para teléfonos IP, borrado de servidores y soporte general',
      ],
    },
    {
      puesto: 'Ventas y soporte técnico',
      lugar: 'Independiente',
      desde: '2021',
      hasta: 'Actualidad',
      texto:
        'Desarrollo de sitios y sistemas para negocios de la zona, y soporte técnico. ' +
        'En tiempo libre.',
    },
    {
      puesto: 'Pasantía',
      lugar: 'ALGOL SECURITY · Navarro y Avilés, San José', // corregido: "aviles"
      desde: '2021',
      hasta: '2021',
      texto: 'Pasantía en TI.',
    },
  ],

  formacion: [
    {
      titulo: 'Diplomado en Informática',
      lugar: 'UNED',
      detalle: '68 créditos · en espera de título',
    },
    /* Los nombres de los dos titulos del colegio, como dicen los titulos del
       MEP (21-9-2026). Antes: "Técnico Medio en Redes" y "Bachillerato". */
    {
      titulo: 'Técnico Medio en Informática en Redes de Computadoras',
      lugar: 'CTP José Albertazzi Avendaño',
      detalle: '2021',
    },
    {
      titulo: 'Bachiller en Educación Media',
      lugar: 'CTP José Albertazzi Avendaño',
      detalle: '2021',
    },
  ],

  /*
    Con el nombre y el año de cada certificado (21-9-2026). Los de Cisco, HP e
    IT Essentials estan respaldados por el certificado; "CCNA 3 v7" y
    "LibreOffice" salen del CV original, sin certificado adjunto.
  */
  certificaciones: [
    'Cisco CCNAv7: Switching, Routing and Wireless Essentials (2021)',
    'Cisco CCNA Routing and Switching: Introduction to Networks (2021)',
    'CCNA 3 v7',
    'HP Support Cybersecurity Service Qualification (2025)',
    // Las dos HP en una linea (21-9-2026): eran tres renglones identicos salvo
    // un digito, y se leian como una lista inflada. corregido: "Destops"
    'HP Commercial and Consumer Desktops, Workstations and Notebooks Service Qualification, releases 6.0 and 7.0 (2025)',
    'IT Essentials: PC Hardware and Software (2019)',
    // "LibreOffice" paso a Habilidades > Soporte y redes: no es el nombre de una
    // certificacion y no tiene certificado adjunto.
  ],

  idiomas: [
    { idioma: 'Español', nivel: 'Nativo' },
    { idioma: 'Inglés', nivel: 'B2' },
  ],
} as const;
