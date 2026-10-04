/**
 * ============================================================================
 *  GÉNESIS ROCA — ÚNICA FUENTE DE VERDAD DEL NEGOCIO
 * ============================================================================
 *
 *  Ningún componente puede tener hardcodeado un teléfono, handle, precio,
 *  dirección, horario ni texto de marca. Si un componente necesita un dato,
 *  lo importa desde acá.
 *
 *  Para el dueño del negocio: buscá `TODO:` en este archivo (Ctrl+F) y vas a
 *  encontrar, agrupado, todo lo que hay que reemplazar por los datos reales.
 *  El README tiene la misma lista con el número de línea de cada uno.
 * ============================================================================
 */

export const site = {
  brand: {
    name: "Génesis Roca",
    /** Se muestra bajo el nombre en el header y en el footer. */
    studioSuffix: "Lash & Brow Studio",
    tagline: "Extensiones de pestañas & diseño de cejas",
    shortDescription:
      "Volumen, efectos y fibras tecnológicas para realzar tu mirada, con materiales premium y un espacio donde podés desconectar un rato.",
    // Monograma GR recortado del logo real, con fondo transparente.
    logo: "/logo.png",
    /* El mismo, a 288px. Sólo lo usa la pantalla de carga, que lo pinta hasta
       a 148px: en un teléfono con DPR 3 son 444 píxeles físicos y con el de
       144 el aro se veía suave. Los dos salen de scripts/crop-logo.mjs. */
    logo2x: "/logo@2x.png",
    ownerName: "Génesis Roca",
  },

  /**
   * Los anclajes del menú, en el orden del recorrido de la clienta.
   *
   * Están acá y no en los componentes porque el header y el footer muestran la
   * MISMA lista: mientras cada uno tenía la suya, agregar o quitar una sección
   * había que acordarse de hacerlo dos veces, y el propio `Footer.tsx` tenía un
   * TODO anotado pidiendo esto. Ahora se toca en un solo lugar.
   */
  nav: [
    { href: "#servicios", label: "Servicios" },
    { href: "#galeria", label: "Galería" },
    { href: "#resenas", label: "Reseñas" },
    { href: "#ubicacion", label: "Ubicación" },
    { href: "#faq", label: "FAQ" },
  ],

  /**
   * Copy del hero. Es lo primero que lee una clienta, así que conviene que el
   * dueño lo revise palabra por palabra.
   */
  hero: {
    eyebrow: "Estudio de pestañas y cejas",
    headline: "Tu mirada, elevada.", // TODO: confirmar titular (entra palabra por palabra)
    socialProof: "+300 clientas felices", // TODO: confirmar la cantidad real
    // El CTA principal ahora lleva al FORMULARIO (#reservar): la clienta llena
    // sus datos y recién ahí se abre WhatsApp con la reserva completa. Así a
    // Génesis siempre le llega nombre + servicio + día + hora, no un "hola".
    primaryCta: "Reservar mi cita",
    // El acceso directo a WhatsApp, para una consulta rápida sin llenar nada.
    whatsappCta: "Escribir por WhatsApp",
    /**
     * La foto que abre el sitio. Es el elemento LCP: la que más pesa en la
     * sensación de velocidad. Relación 4:5, 1200×1500.
     */
    image: "/hero.jpg",
    imageAlt:
      "Primer plano de pestañas de fibras tecnológicas hechas por Génesis Roca",
  },

  contact: {
    // Número del estudio en formato internacional (506 + 8450 0995).
    whatsappNumber: "",
    /**
     * Código de país sin "+". El formulario pide 8 dígitos (el formato local
     * de Costa Rica) y el servidor antepone esto antes de mandar el lead a
     * n8n, para que llegue en formato internacional.
     */
    phoneCountryCode: "506",
    /** Cuántos dígitos tiene un número local. Costa Rica usa 8. */
    phoneLocalDigits: 8,
    /* Vacío a propósito desde el 8-9-2026. Antes decía "correo@ejemplo.example",
       un marcador del nombre viejo del proyecto que estuvo PUBLICADO EN VIVO:
       quien escribiera ahí no le llegaba a nadie. El pie ya no pinta correo
       mientras esto esté vacío. Poner el real y volver a agregar el enlace en
       components/Footer.tsx. */
    email: "",
    address: {
      line1: "Urbanización Grano de Oro, casa 29",
      line2: "De Pollos Piccolo 25 m sur y 250 m este",
      city: "San José",
      province: "San José",
      postalCode: "10101", // TODO: confirmar código postal exacto
      country: "Costa Rica",
      countryCode: "CR",
    },
    // Coordenadas reales del estudio, dadas por el dueño el 30-8-2026:
    // 9°52'39.5"N 84°04'18.8"W. De acá salen el mapa, Waze, Google Maps y el
    // JSON-LD, así que este es el único lugar donde tocarlas.
    coords: { lat: 9.877639, lng: -84.071889 },
    wazeUrl: "https://waze.com/ul?ll=9.877639,-84.071889&navigate=yes",
    googleMapsUrl: "https://maps.google.com/?q=9.877639,-84.071889",
  },

  social: {
    instagram: "https://www.instagram.com/lashbrowdistric.cr",
    facebook: "https://www.facebook.com/profile.php?id=100024207690732",
    tiktok: "", // dejar vacío = no se renderiza
  },

  /*
    APAGADA el 9-9-2026, por pedido del dueño.

    Estaba en `enabled: true` con la URL `https://winstamp.com/TODO`, o sea que
    el sitio publicaba en DOS lugares —el bloque de ubicación y los enlaces
    rápidos— un botón que decía "Tarjeta de cliente frecuente" y llevaba a un
    404.

    Y el detalle que lo hacía peor: la clienta que más vuelve es exactamente la
    que toca ese botón. Es la misma familia que el correo `correo@ejemplo.example`
    y los testimonios inventados — dato de mentira puesto donde una persona real
    lo va a usar.

    El interruptor se queda, porque el mecanismo sirve. La URL se vacía: dejar
    la falsa es lo que permite que esto vuelva a encenderse por accidente.

    Para prenderla de nuevo: poner el enlace real y `enabled: true`.
  */
  loyalty: {
    enabled: false,
    label: "Tarjeta de cliente frecuente",
    description: "Acumulá visitas y ganate tu retoque",
    url: "",
  },

  /**
   * DECISIÓN: el brief pedía `hours` como pares de texto, pero el sitio
   * necesita el horario legible por máquina para cuatro cosas: el badge
   * "Abierto ahora", los slots de /api/availability, el `openingHoursSpecification`
   * del JSON-LD y el bloqueo de días cerrados en el input de fecha. Se conserva
   * `display` para lo que ve la clienta y se agregan `weekdays`
   * (0 = domingo … 6 = sábado) y `open`/`close` en formato 24 h.
   *
   * ───────────────────────────────────────────────────────────────────────────
   * ESTO YA NO ES EL HORARIO DEL SITIO. Es sólo el valor INICIAL.
   *
   * Desde el 9-9-2026 Génesis lo edita en `/manager` y se guarda en
   * `uploads/horario.json`. Estas líneas son de dónde sale el horario la primera
   * vez, mientras nadie haya tocado el panel — por eso siguen acá y no se
   * borraron: un despliegue nuevo tiene que mostrar algo coherente.
   *
   * Cambiar esto NO cambia el sitio si el archivo ya existe. Para cambiar el
   * horario de verdad, se entra al panel.
   * ───────────────────────────────────────────────────────────────────────────
   */
  hours: [
    {
      label: "Lunes a viernes",
      weekdays: [1, 2, 3, 4, 5],
      open: "09:00",
      close: "18:00",
      display: "9:00 a. m. – 6:00 p. m.",
    },
    {
      label: "Sábado",
      weekdays: [6],
      open: "09:00",
      close: "16:00",
      display: "9:00 a. m. – 4:00 p. m.",
    },
    {
      label: "Domingo",
      weekdays: [0],
      open: null,
      close: null,
      display: "Cerrado",
    },
  ],

  /**
   * Valores que corren en el marquee entre el hero y servicios.
   *
   * Conviene que sean seis o más: la banda repite la pista dos veces y con
   * pocos ítems queda un hueco visible antes de que el bucle cierre en
   * pantallas anchas. Frases cortas, de dos o tres palabras.
   */
  values: [
    "Pelo a pelo",
    "Fibras premium",
    "Volumen a tu medida",
    "Retoque garantizado",
    "Materiales esterilizados",
    "Ambiente relajante",
  ],

  /**
   * Categorías del catálogo. Existen porque la carta del estudio está agrupada
   * así y la clienta ya la lee de esa forma en Instagram; replicarlo evita que
   * tenga que volver a aprender dónde está cada cosa.
   */
  serviceCategories: [
    {
      slug: "volumen",
      name: "Volumen",
      description: "Abanicos hechos a mano. Cuanto más denso, más marcada la mirada.",
    },
    {
      slug: "efectos",
      name: "Efectos",
      description: "Para quien busca un acabado concreto más que una densidad.",
    },
    {
      slug: "fibras",
      name: "Fibras tecnológicas",
      description: "Fibras premium que sostienen más dimensiones sin sumar peso.",
    },
    {
      slug: "cejas",
      name: "Cejas",
      description: "Alisado, color y forma.",
    },
  ],

  /**
   * El catálogo, plano y con la categoría en cada servicio. Se mantiene plano a
   * propósito: agruparlo anidado obligaría a recorrer dos niveles en cada
   * componente y a duplicar la búsqueda por slug. `serviceCategories` da el
   * orden y los títulos; `groupedServices()`, al final del archivo, arma los
   * grupos cuando la UI los necesita.
   *
   * `maintenancePrice` es el retoque. Va como campo y no como servicio aparte
   * porque en la carta del estudio vive así: bajo el precio de la aplicación.
   * Un servicio sin retoque (las cejas) lo deja en `null` y la tarjeta
   * simplemente no muestra esa línea.
   *
   * TODO CRÍTICO — DURACIONES: los `durationMinutes` de abajo son ESTIMACIONES.
   * La lista de precios no las trae y el bot las necesita para calcular la hora
   * de fin del evento en Google Calendar. Si están mal, el bot va a agendar
   * citas encimadas. Confirmarlas antes de poner el bot a atender.
   */
  services: [
    /* ---- Volumen ------------------------------------------------------- */
    {
      slug: "volumen-medio",
      category: "volumen",
      name: "Volumen Medio",
      description: "Abanicos de densidad media. Se nota, sin llegar a ser dramático.",
      price: 22000,
      maintenancePrice: 19000,
      currency: "CRC",
      duration: "2 h",
      durationMinutes: 120, // TODO: confirmar
      maintenanceDurationMinutes: 90, // TODO: confirmar
      image: "/servicios/volumen-medio.jpg",
      imageAlt: "Volumen medio en fibra tecnológica, trabajo real de Génesis Roca",
      popular: true,
    },
    {
      slug: "mega-volumen",
      category: "volumen",
      name: "Mega Volumen",
      description: "La máxima densidad de la carta. Mirada marcada y oscura.",
      price: 25000,
      maintenancePrice: 23000,
      currency: "CRC",
      duration: "2 h 30 min",
      durationMinutes: 150, // TODO: confirmar
      maintenanceDurationMinutes: 120, // TODO: confirmar
      image: "/servicios/mega-volumen.jpg",
      imageAlt: "Mega volumen: pestañas densas y marcadas sobre ojo café, trabajo del estudio",
      popular: false,
    },

    /* ---- Efectos ------------------------------------------------------- */
    {
      slug: "rimel",
      category: "efectos",
      name: "Rímel",
      description: "El efecto más natural. Como si te hubieras puesto rímel y nada más.",
      price: 19000,
      maintenancePrice: 17000,
      currency: "CRC",
      duration: "1 h 30 min",
      durationMinutes: 90, // TODO: confirmar
      maintenanceDurationMinutes: 60, // TODO: confirmar
      image: "/servicios/rimel.jpg",
      imageAlt: "Efecto rímel: pestañas naturales, como rímel bien puesto, trabajo del estudio",
      popular: false,
    },
    {
      slug: "wispy",
      category: "efectos",
      name: "Wispy",
      description: "Picos alternados que dan textura. Efecto despeinado a propósito.",
      price: 22000,
      maintenancePrice: 19000,
      currency: "CRC",
      duration: "2 h",
      durationMinutes: 120, // TODO: confirmar
      maintenanceDurationMinutes: 90, // TODO: confirmar
      image: "/servicios/wispy.jpg",
      imageAlt: "Efecto wispy: picos alternados y textura despeinada, trabajo del estudio",
      popular: false,
    },

    /* ---- Fibras tecnológicas ------------------------------------------- */
    /* TODO PRECIOS: la lista de precios muestra ₡22.000 y ₡19.000 centrados
       entre los tres, pero se confirmó que cada uno vale distinto. Los valores
       de abajo son PROVISIONALES y hay que reemplazarlos por los reales. */
    {
      slug: "volumen-egipcio",
      category: "fibras",
      name: "Volumen Egipcio (4D)",
      description: "Cuatro dimensiones por abanico. El punto de entrada a las fibras.",
      price: 22000, // TODO: precio real
      maintenancePrice: 19000, // TODO: precio real
      currency: "CRC",
      duration: "2 h",
      durationMinutes: 120, // TODO: confirmar
      maintenanceDurationMinutes: 90, // TODO: confirmar
      image: "/servicios/volumen-egipcio.jpg",
      imageAlt: "Volumen Egipcio 4D en fibra tecnológica, resultado del estudio",
      popular: false,
    },
    {
      slug: "volumen-ingles",
      category: "fibras",
      name: "Volumen Inglés (5D)",
      description: "Cinco dimensiones. Más cuerpo, mismo peso sobre la pestaña natural.",
      price: 22000, // TODO: precio real
      maintenancePrice: 19000, // TODO: precio real
      currency: "CRC",
      duration: "2 h 15 min",
      durationMinutes: 135, // TODO: confirmar
      maintenanceDurationMinutes: 105, // TODO: confirmar
      image: "/servicios/volumen-ingles.jpg",
      imageAlt: "Volumen Inglés 5D en fibra tecnológica, resultado del estudio",
      popular: false,
    },
    {
      slug: "volumen-griego",
      category: "fibras",
      name: "Volumen Griego (6D)",
      description: "Seis dimensiones. Lo más denso que se puede sin comprometer la pestaña.",
      price: 22000, // TODO: precio real
      maintenancePrice: 19000, // TODO: precio real
      currency: "CRC",
      duration: "2 h 30 min",
      durationMinutes: 150, // TODO: confirmar
      maintenanceDurationMinutes: 120, // TODO: confirmar
      image: "/servicios/volumen-griego.jpg",
      imageAlt: "Volumen Griego 6D en fibra tecnológica, vista macro del trabajo del estudio",
      popular: false,
    },

    /* ---- Cejas --------------------------------------------------------- */
    {
      slug: "laminado-cejas",
      category: "cejas",
      name: "Laminado",
      description: "Alisado y fijado del vello. Cejas peinadas y con cuerpo por semanas.",
      price: 10000,
      maintenancePrice: null,
      currency: "CRC",
      duration: "45 min",
      durationMinutes: 45, // TODO: confirmar
      maintenanceDurationMinutes: null,
      image: "/servicios/laminado-cejas.jpg",
      imageAlt:
        "Cejas laminadas por Génesis Roca, vello peinado hacia arriba, en clienta recostada en la cabina",
      popular: false,
    },
    {
      slug: "henna",
      category: "cejas",
      name: "Henna",
      description: "Tinte natural que además pigmenta la piel y rellena los huecos.",
      price: 5000,
      maintenancePrice: null,
      currency: "CRC",
      duration: "30 min",
      durationMinutes: 30, // TODO: confirmar
      maintenanceDurationMinutes: null,
      image: "/servicios/henna.jpg",
      imageAlt: "Cejas con henna hechas por Génesis Roca, tono definido y forma marcada, con extensiones de pestañas",
      popular: false,
    },
    {
      slug: "laminado-henna",
      category: "cejas",
      name: "Laminado + Henna",
      description: "Los dos juntos: forma, cuerpo y color en una sola cita.",
      price: 13000,
      maintenancePrice: null,
      currency: "CRC",
      duration: "1 h",
      durationMinutes: 60, // TODO: confirmar
      maintenanceDurationMinutes: null,
      image: "/servicios/laminado-henna.jpg",
      imageAlt: "Cejas con laminado y henna: peinadas, con forma y color, trabajo del estudio",
      popular: false,
    },
  ],

  /**
   * Añadidos y servicios sueltos que no son una cita completa. No llevan foto
   * ni tarjeta propia: se listan como una línea al pie de los servicios, que es
   * como aparecen en la carta del estudio.
   */
  extras: [
    {
      slug: "pop-color",
      name: "Pop color",
      description: "Un toque de color sobre el set",
      price: 1000,
      currency: "CRC",
    },
    {
      slug: "pop-glitter",
      name: "Pop glitter",
      description: "Brillo puntual sobre el set",
      price: 1000,
      currency: "CRC",
    },
    {
      slug: "retiro",
      name: "Retiro de extensiones",
      description: "Remoción completa, sin aplicar set nuevo",
      price: 4000,
      currency: "CRC",
    },
  ],

  /** Bloque "Sobre el estudio". */
  about: {
    eyebrow: "Sobre el estudio",
    title: "Manos que se toman su tiempo",
    // TODO: reescribir con la historia real de la artista
    paragraphs: [
      "El estudio nació de una idea simple: que ponerse linda no tenga que ser a las carreras. Cada cita es de una sola clienta a la vez, sin filas ni reloj encima.",
      "Trabajamos pelo a pelo, aislando cada pestaña natural para que la extensión nunca pese ni la debilite. Adhesivo de grado médico, pinzas esterilizadas entre clienta y clienta, y fibras premium que mantienen la curvatura hasta el último día.",
      "Antes de empezar conversamos qué querés lograr: si buscás algo que nadie note o algo que se vea desde la otra esquina. De ahí sale el mapeo, y de ahí sale tu mirada.",
    ],
    image: "/sobre-el-estudio.jpg",
    /*
      Describe la foto NUEVA. La anterior era generada por IA y el alt hablaba
      de unas pinzas que no aparecen en esta. Un alt que describe otra imagen es
      peor que uno genérico: quien navega con lector de pantalla recibe algo que
      no existe en la página.
    */
    imageAlt:
      "Clienta de Génesis Roca recostada en la cabina, con las cejas laminadas y henna recién hechas y extensiones de pestañas",
    // TODO: confirmar las tres cifras
    stats: [
      { value: 300, prefix: "+", suffix: "", label: "clientas atendidas" },
      { value: 4, prefix: "", suffix: "", label: "años de experiencia" },
      { value: 100, prefix: "", suffix: "%", label: "materiales premium" },
    ],
  },

  /**
   * Galería de antes/después.
   * TODO: reemplazar por fotos reales del trabajo del estudio.
   * Ver docs/fotos.md para la relación de aspecto de cada archivo.
   */
  gallery: [
    {
      src: "/galeria/01.jpg",
      width: 800,
      height: 1000,
      alt: "Powder brows recién hechas por Génesis Roca, cejas definidas y con relleno de color",
    },
    {
      src: "/galeria/02.jpg",
      width: 800,
      height: 1067,
      alt: "Fibras tecnológicas con efecto en U, vista macro del trabajo del estudio",
    },
    {
      src: "/galeria/03.jpg",
      width: 800,
      height: 800,
      alt: "Mega volumen tecnológico, pestañas densas y oscuras vistas de cerca",
    },
    {
      src: "/galeria/04.jpg",
      width: 800,
      height: 1000,
      alt: "Efecto foxy: mirada estirada hacia afuera con extensiones, trabajo del estudio",
    },
    {
      src: "/galeria/05.jpg",
      width: 800,
      height: 1067,
      alt: "Fibras tecnológicas 6D, máxima densidad sin peso, trabajo del estudio",
    },
    {
      src: "/galeria/06.jpg",
      width: 800,
      height: 800,
      alt: "Volumen medio, densidad pareja con acabado natural",
    },
    {
      src: "/galeria/07.jpg",
      width: 800,
      height: 1000,
      alt: "Efecto rímel, pestañas naturales realzadas, trabajo del estudio",
    },
    {
      src: "/galeria/08.jpg",
      width: 800,
      height: 1067,
      alt: "Fibras tecnológicas 5D en clienta de piel morena, trabajo del estudio",
    },
  ],

  /** Bloque "Cómo funciona" — baja la ansiedad antes del CTA final. */
  steps: [
    {
      title: "Escribinos por WhatsApp",
      description:
        "Contanos qué te gustaría hacerte. Si nunca te has puesto extensiones, te guiamos.",
    },
    {
      title: "Elegimos fecha y estilo juntas",
      description:
        "Te pasamos los espacios libres y definimos el look antes de que llegués.",
    },
    {
      title: "Llegás y te relajás",
      description:
        "Dos horas de música suave, camilla cómoda y cero apuro. Salís lista.",
    },
  ],

  calendar: {
    timezone: "America/Costa_Rica",
    calendarId: "TODO: correo del calendario de Google del estudio",
    eventTitleTemplate: "{service} — {name}",
    eventDescriptionTemplate:
      "Cliente: {name}\nTeléfono: {phone}\nServicio: {service}\nNotas: {notes}\nOrigen: {ref}",
    bufferMinutes: 15, // colchón entre citas
    minNoticeHours: 4, // no aceptar citas con menos de 4 h de anticipación
    maxAdvanceDays: 60,
    /*
      SOLO EL VALOR INICIAL, igual que `hours`. El intervalo de verdad lo pone
      Génesis por día desde /manager.

      Estuvo fijo en 180 hasta el 9-9-2026, y ese era el problema: un laminado
      de 30 minutos sólo se ofrecía a las 9:00, 12:00 y 15:00 — tres arranques
      donde caben doce. Los servicios cortos son los que llenan los huecos y
      eran justo los que el sitio no dejaba agendar.
    */
    slotIntervalMinutes: 180,
  },

  // TODO: revisar que cada respuesta coincida con la política real del estudio
  faq: [
    {
      question: "¿Cuánto dura la cita?",
      answer:
        "Entre 45 minutos y 3 horas según el servicio. Un set completo de volumen ruso ronda las 2 h 30 min y un diseño de cejas se resuelve en 45 minutos. La duración exacta de cada servicio está en la sección de servicios.",
    },
    {
      question: "¿Cuánto duran puestas las extensiones?",
      answer:
        "El set se ve completo entre 3 y 4 semanas. De ahí en adelante las pestañas naturales cumplen su ciclo y van cayendo con la extensión pegada, que es exactamente lo que tiene que pasar.",
    },
    {
      question: "¿Cada cuánto tengo que ir a retoque?",
      answer:
        "Cada 2 o 3 semanas. En el retoque se retira lo que ya creció y se rellenan los espacios. Si dejás pasar más de 4 semanas normalmente ya conviene un set nuevo.",
    },
    {
      question: "¿Qué cuidados necesitan?",
      answer:
        "Las primeras 24 horas, sin agua ni vapor. Después: lavalas cada dos días con espuma específica, peinalas con el cepillito, dormí boca arriba si podés y evitá cremas con aceite alrededor del ojo. Nada de rizador ni de rímel a prueba de agua.",
    },
    {
      question: "¿Duele?",
      answer:
        "No. La extensión se pega sobre la pestaña, nunca sobre la piel, y los ojos quedan cerrados todo el rato. A la mayoría de las clientas les da sueño en la camilla.",
    },
    {
      question: "¿Se me van a caer las pestañas naturales?",
      answer:
        "No, siempre que estén bien puestas. Cada extensión se aísla sobre una sola pestaña natural y se elige un grosor que esa pestaña pueda sostener. El daño aparece cuando se pegan varias naturales entre sí o se usa fibra muy pesada, y eso es justo lo que la técnica pelo a pelo evita.",
    },
    {
      question: "¿Cuál es la política de cancelación?",
      answer:
        "Avisá con al menos 4 horas de anticipación y reprogramamos sin problema. Con dos ausencias sin avisar se pide el 50 % por adelantado para volver a reservar.",
    },
    {
      question: "¿Qué formas de pago aceptan?",
      answer:
        "Efectivo, SINPE Móvil y tarjeta. El pago va completo al terminar la cita.",
    },
  ],

  /*
   * LAS RESEÑAS YA NO VIVEN ACÁ.
   *
   * Hasta el 30-8-2026 hubo un arreglo `testimonials` con seis testimonios de
   * RELLENO. Se quitaron porque mostrar reseñas inventadas como si fueran de
   * clientas reales engaña a quien las lee, y si se descubre le cuesta al
   * estudio mucho más que no tener la sección.
   *
   * Desde el 6-9-2026 las escriben las clientas desde la propia página y
   * Génesis las aprueba en /manager. Se guardan en `uploads/resenas/` y las lee
   * `lib/resenas.ts`.
   *
   * El arreglo se eliminó a propósito y no conviene devolverlo: serían dos
   * fuentes para lo mismo, y el promedio del hero (que sale sólo de las
   * aprobadas) dejaría de coincidir con lo que muestra el carrusel.
   *
   * ¿Y un comentario lindo de Instagram? Se pega en el formulario del sitio,
   * con permiso de la clienta, y se aprueba. Entra por la misma puerta que
   * todas y queda contado en el promedio.
   */

  /** Rango de precios para el JSON-LD. schema.org lo espera como string. */
  priceRange: "$$",

  /**
   * DECISIÓN: estas dos variables son SOLO de servidor. Se leen únicamente
   * desde los Route Handlers (`app/api/*`). Next no inyecta en el bundle del
   * navegador ninguna variable sin prefijo NEXT_PUBLIC_, así que del lado del
   * cliente resuelven a "" y no hay filtración posible del webhook.
   * No las uses dentro de un componente.
   */
  integrations: {
    n8nLeadWebhook: process.env.N8N_WEBHOOK_URL ?? "",
    n8nAvailabilityWebhook: process.env.N8N_AVAILABILITY_URL ?? "",
  },
} as const;

/* -------------------------------------------------------------------------- */
/*  Tipos derivados — usalos en las props de los componentes                   */
/* -------------------------------------------------------------------------- */

export type Site = typeof site;
export type Service = Site["services"][number];
export type ServiceSlug = Service["slug"];
export type ServiceCategory = Site["serviceCategories"][number];
export type Extra = Site["extras"][number];
export type HoursRule = Site["hours"][number];
export type NavLink = Site["nav"][number];
export type FaqItem = Site["faq"][number];
export type GalleryItem = Site["gallery"][number];
export type Step = Site["steps"][number];
export type AboutStat = Site["about"]["stats"][number];

/** Busca un servicio por slug. Devuelve `undefined` si el slug no existe. */
export function getService(slug: string): Service | undefined {
  return site.services.find((service) => service.slug === slug);
}

/**
 * El catálogo agrupado por categoría, en el orden de `serviceCategories`.
 *
 * Se calcula acá y no en el componente para que el orden de las categorías sea
 * el mismo en la página, en el `<select>` del formulario y en el JSON-LD. Una
 * categoría sin servicios no se devuelve, así que borrar servicios del config
 * nunca deja un título huérfano en la página.
 */
export function groupedServices(): Array<{
  category: ServiceCategory;
  services: Service[];
}> {
  return site.serviceCategories
    .map((category) => ({
      category,
      services: site.services.filter(
        (service) => service.category === category.slug,
      ),
    }))
    .filter((group) => group.services.length > 0);
}

/**
 * Minutos que dura un servicio, según sea aplicación o mantenimiento.
 *
 * Existe porque el retoque de un set lleva menos tiempo que ponerlo de cero, y
 * si se le manda a n8n la duración completa, el bot bloquea más agenda de la
 * que hace falta. Si el servicio no tiene retoque, cae a la duración normal.
 */
export function durationFor(service: Service, isMaintenance: boolean): number {
  if (isMaintenance && service.maintenanceDurationMinutes) {
    return service.maintenanceDurationMinutes;
  }
  return service.durationMinutes;
}
