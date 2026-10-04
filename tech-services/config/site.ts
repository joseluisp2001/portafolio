/**
 * ============================================================================
 *  DESAMPARADOS TECH — ÚNICA FUENTE DE VERDAD DEL NEGOCIO
 * ============================================================================
 *
 *  Ningún componente puede tener hardcodeado un teléfono, precio, dirección ni
 *  texto de marca. Si un componente necesita un dato, lo importa desde acá.
 *
 *  Buscá `TODO:` para encontrar lo que falta reemplazar por datos reales.
 *
 *  Los tipos se definen ACÁ ABAJO. Antes este archivo los importaba de
 *  `./types`, un archivo que nunca existió, y eso rompía el build entero.
 * ============================================================================
 */


/** Escena animada que reemplaza a la ilustración fija en la tarjeta (components/escenas). */
export type EscenaServicio =
  | 'formateo' | 'limpieza' | 'rescate' | 'armado' | 'diagnostico'
  | 'bot' | 'web' | 'n8n'
  | 'cableado' | 'camaras' | 'wifi'
  | 'app' | 'sistema';

export interface Service {
  slug: string;
  category: string;
  name: string;
  description: string;
  price: number | null;  // null = "Cotizar"
  currency: string;
  duration?: string;
  image: string;
  imageAlt: string;
  popular?: boolean;
  /** Si está, la tarjeta muestra la escena animada; la imagen queda de respaldo. */
  escena?: EscenaServicio;
}

export interface ServiceCategory {
  slug: string;
  name: string;
  description: string;
  icon: string;
}

export interface FaqItem { question: string; answer: string; }
export interface GalleryItem { src: string; width: number; height: number; alt: string; }
export interface Step { title: string; description: string; icon: string; }
export interface AboutStat { value: number; suffix?: string; label: string; }
export interface HoursRule { label: string; open: string; close: string; display: string; }
export interface QuickLink {
  label: string;
  href: string;
  icon: string;
  external?: boolean;
  /** 'whatsapp' arma el enlace al chat con `message`; si no, se usa `href`. */
  type?: 'whatsapp';
  /** El texto con el que se abre WhatsApp. Solo aplica si type es 'whatsapp'. */
  message?: string;
}

export const site = {
  brand: {
    name: 'Desamparados Tech',
    tagline: 'Hacemos que la tecnología trabaje a tu favor',
    shortDescription: 'Soporte técnico real y automatización inteligente en San José. Desde revivir tu PC hasta poner a un bot a vender por vos 24/7.',
    logo: '/logo.png',
  },

  hero: {
    eyebrow: 'SOPORTE TÉCNICO Y AUTOMATIZACIÓN',
    headline: 'Olvidate de los dolores\nde cabeza tecnológicos',
    subheadline: 'Desde arreglar tu compu lenta hasta poner un bot con IA a vender por WhatsApp. Vos enfocate en lo tuyo, nosotros nos encargamos de los cables y el código.',
    primaryCta: { label: 'Quiero una solución', href: '#contacto' },
    secondaryCta: { label: 'Ver qué hacemos', href: '#servicios' },
    image: '/hero.jpg',
    imageAlt: 'Ilustración de pistas de circuito sobre fondo oscuro',
  },

  contact: {
    // El WhatsApp donde vive Beto, el asistente de soporte.
    //
    // Antes apuntaba al 50600000000, que es el telefono PERSONAL de Jose Luis
    // — y ademas quedo bloqueado en todos los bots, porque solo el Supervisor
    // le escribe. O sea: un cliente que pidiera soporte no recibia nada.
    whatsappNumber: '',
    phoneCountryCode: '506',
    phoneLocalDigits: 8,
    email: 'correo@ejemplo.example',
    address: {
      line1: 'Desamparados',
      line2: 'San José, Costa Rica',
      city: 'Desamparados',
      province: 'San José',
      country: 'Costa Rica',
      countryCode: 'CR',
    },
    coords: { lat: 9.8961, lng: -84.0613 },
    wazeUrl: 'https://waze.com/ul?ll=9.8961,-84.0613&navigate=yes',
    googleMapsUrl: 'https://maps.google.com/?q=9.8961,-84.0613',
  },

  // Vacías hasta que existan las cuentas: las de antes eran inventadas y
  // mandaban al cliente a un perfil ajeno o inexistente. Con '' no se muestran.
  social: {
    instagram: '',
    facebook: '',
    tiktok: '',
  },

  hours: [
    { label: 'Lunes a Viernes', open: '08:00', close: '18:00', display: '8:00 a. m. – 6:00 p. m.' },
    { label: 'Sábado', open: '09:00', close: '13:00', display: '9:00 a. m. – 1:00 p. m.' },
    { label: 'Domingo', open: '', close: '', display: 'Cerrado' },
  ] as HoursRule[],

  // Lo que se hace, en español y sin promesas sueltas ("cero estrés",
  // "garantía real") que la cinta no puede sostener.
  values: [
    'Reparación de equipos', 'Windows y Linux', 'Redes WiFi', 'Cámaras de seguridad',
    'Bots de WhatsApp', 'Automatización con n8n', 'Sistemas a medida', 'Desamparados, San José'
  ],

  serviceCategories: [
    { slug: 'reparacion', name: 'Mantenimiento y Reparación', description: 'Tu equipo rápido otra vez. No lo botés, nosotros lo revivimos.', icon: 'Wrench' },
    { slug: 'automatizacion', name: 'Automatización y Web', description: 'Mientras vos dormís, tu negocio sigue vendiendo y atendiendo clientes.', icon: 'Bot' },
    { slug: 'redes', name: 'Redes y Seguridad', description: 'Internet que no se cae y cámaras para vigilar lo tuyo desde el celular.', icon: 'Network' },
    { slug: 'desarrollo', name: 'Desarrollo a Medida', description: 'Sistemas que se adaptan a tu negocio, no al revés.', icon: 'Code' },
  ] as ServiceCategory[],

  services: [
    // Reparación
    { slug: 'formateo', category: 'reparacion', name: 'Formateo sin perder datos', description: 'Dejamos tu PC o laptop volando como el primer día, respaldando todos tus archivos importantes. Cero estrés.', price: 15000, currency: 'CRC', duration: '2-4 horas', image: '/servicios/formateo.jpg', imageAlt: 'Ilustración de una laptop conectada a un circuito', escena: 'formateo' },
    { slug: 'limpieza-pc', category: 'reparacion', name: 'Mantenimiento profundo', description: 'Evitá que tu equipo se queme o se vuelva lento. Limpieza física, cambio de pasta térmica y optimización.', price: 12000, currency: 'CRC', duration: '1-2 horas', image: '/servicios/limpieza.jpg', imageAlt: 'Ilustración de un ventilador de computadora', escena: 'limpieza' },
    { slug: 'recuperacion-datos', category: 'reparacion', name: 'Rescate de información', description: '¿El disco murió? ¿La llave USB no lee? Recuperamos tus documentos y fotos invaluables.', price: 20000, currency: 'CRC', duration: 'Variable', image: '/servicios/recuperacion.jpg', imageAlt: 'Ilustración de un disco duro', escena: 'rescate' },
    { slug: 'armado-pc', category: 'reparacion', name: 'Armado de PC a medida', description: 'No comprés algo que no necesitás. Ensamblamos la computadora perfecta para tu presupuesto, ya sea para oficina o gaming.', price: 25000, currency: 'CRC', duration: '1-2 días', image: '/servicios/armado.jpg', imageAlt: 'Ilustración de un procesador', escena: 'armado' },
    { slug: 'diagnostico', category: 'reparacion', name: 'Diagnóstico honesto', description: 'Revisamos por qué tu equipo falla y te damos una solución real y directa, sin inventar problemas.', price: 5000, currency: 'CRC', duration: '30-60 min', image: '/servicios/diagnostico.jpg', imageAlt: 'Ilustración de un estetoscopio', escena: 'diagnostico' },
    // Automatización
    { slug: 'bot-whatsapp', category: 'automatizacion', name: 'Bot de WhatsApp con IA', description: 'Atendé a tus clientes 24/7. Un asistente inteligente que cotiza, agenda y vende por vos, incluso domingos en la madrugada.', price: null, currency: 'CRC', image: '/servicios/bot.jpg', imageAlt: 'Ilustración de un bot de chat', escena: 'bot' },
    { slug: 'pagina-web', category: 'automatizacion', name: 'Diseño de Página Web', description: 'Tu negocio necesita existir en internet. Creamos tu landing page o tienda en línea profesional y optimizada.', price: null, currency: 'CRC', image: '/servicios/web.jpg', imageAlt: 'Ilustración de una ventana de navegador', escena: 'web' },
    { slug: 'n8n-flujos', category: 'automatizacion', name: 'Automatización con n8n', description: 'Dejá de hacer trabajo manual. Conectamos tus formularios, correos y facturación para que funcionen solos.', price: null, currency: 'CRC', image: '/servicios/n8n.jpg', imageAlt: 'Ilustración de un flujo de automatización', escena: 'n8n' },
    // Redes
    { slug: 'cableado', category: 'redes', name: 'Cableado de Red Estructurado', description: 'Señal estable en cada rincón. Instalación estética y profesional para oficinas o casas grandes.', price: null, currency: 'CRC', image: '/servicios/cableado.jpg', imageAlt: 'Ilustración de un cable de red', escena: 'cableado' },
    { slug: 'camaras', category: 'redes', name: 'Cámaras de Seguridad CCTV', description: 'Vigilá tu negocio o casa desde el celular, estés donde estés, con cámaras de alta definición y grabación continua.', price: null, currency: 'CRC', image: '/servicios/camaras.jpg', imageAlt: 'Ilustración de una cámara de seguridad', escena: 'camaras' },
    { slug: 'wifi', category: 'redes', name: 'Redes WiFi de Alto Alcance', description: 'Solucionamos los puntos ciegos. Configuración de routers y repetidores para que el internet no se caiga nunca.', price: null, currency: 'CRC', image: '/servicios/wifi.jpg', imageAlt: 'Ilustración de un router WiFi', escena: 'wifi' },
    // Desarrollo
    { slug: 'app-movil', category: 'desarrollo', name: 'Desarrollo de Apps', description: 'Llevá tu idea al siguiente nivel con una aplicación móvil rápida y fácil de usar para Android e iOS.', price: null, currency: 'CRC', image: '/servicios/app.jpg', imageAlt: 'Ilustración de un teléfono', escena: 'app' },
    { slug: 'sistema-medida', category: 'desarrollo', name: 'Sistemas a Medida', description: 'Si el software comercial no se ajusta a tu empresa, nosotros te programamos uno exactamente como lo ocupás.', price: null, currency: 'CRC', image: '/servicios/sistema.jpg', imageAlt: 'Ilustración de un panel de control', escena: 'sistema' },
  ] as Service[],

  about: {
    eyebrow: 'Nuestra filosofía',
    title: 'No hablamos en chino, damos soluciones.',
    // **así** va en negrita (components/About.tsx); el texto no cambia.
    paragraphs: [
      'Sabemos lo frustrante que es cuando el internet falla en medio de una reunión, la compu no arranca cuando más la necesitás, o perdés ventas por no poder contestar rápido en WhatsApp.',
      'En Desamparados Tech nacimos para ser ese aliado en el que podés confiar a ciegas. No te vendemos cosas que no ocupás. Te damos un **diagnóstico honesto**, **opciones claras** y **resultados con garantía**. Así de simple.',
    ],
    image: '/sobre-nosotros.jpg',
    imageAlt: 'Ilustración de una llave, un procesador y una señal WiFi conectados por un circuito',
    // Vacío a propósito (17-9-2026): las cifras de antes (500+ equipos, 99 %
    // que regresan, 100 % transparencia) no tenían fuente. Se agregan cuando
    // haya números reales; con la lista vacía la sección no se muestra.
    stats: [] as AboutStat[],
  },

  // Vacía a propósito (17-9-2026): la sección se llama "Trabajos realizados"
  // y los marcadores no eran trabajos. Con la lista vacía la sección y su enlace
  // del menú no se muestran. Se llena con fotos REALES: { src, width, height, alt }.
  gallery: [] as GalleryItem[],

  steps: [
    { title: 'Escribinos un mensaje', description: 'Un WhatsApp es suficiente. Contanos qué falla en tu equipo o qué querés mejorar en tu negocio.', icon: 'MessageCircle' },
    { title: 'Te damos el plan', description: 'Revisamos tu caso y te pasamos un diagnóstico honesto, directo y sin letras pequeñas.', icon: 'Search' },
    { title: 'Problema resuelto', description: 'Ejecutamos rápido, probamos que todo funcione perfecto y te damos garantía por el trabajo.', icon: 'CheckCircle' },
  ] as Step[],

  faq: [
    { question: '¿Hacen visitas a domicilio o empresas?', answer: 'Sí, claro. Vamos a tu casa o local comercial en la zona de Desamparados y alrededores. Si estás un poco más lejos, escribinos al WhatsApp y coordinamos la logística.' },
    { question: '¿Cuánto tiempo me quedo sin computadora si la mando a reparar?', answer: 'Depende del diagnóstico, pero somos rápidos. Un formateo o limpieza se hace el mismo día (2 a 4 horas). Si hay que mandar a traer un repuesto específico, te avisamos de inmediato para que sepas el tiempo exacto.' },
    { question: 'Me da miedo que me roben piezas, ¿cómo sé que son de confianza?', answer: 'Es el miedo más común y con justa razón. Con nosotros, te entregamos un reporte del estado de tu máquina antes y después. Nos interesa que nos volvás a llamar y nos recomendés, no ganar unos pesos de forma deshonesta.' },
    { question: '¿Dan garantía por los trabajos?', answer: 'Siempre. Cada servicio tiene su tiempo de garantía detallado por escrito. Si algo falla por nuestro trabajo, lo resolvemos sin peros ni excusas.' },
    { question: '¿Cómo funciona exactamente el Bot de WhatsApp?', answer: 'Es un sistema (usando IA real) que conectamos a tu número de negocio. Aprende tus precios, tus horarios y cómo hablás vos. Cuando un cliente te escribe, el bot le contesta al instante, resuelve sus dudas y hasta le agenda citas. Es como tener un empleado que no duerme.' },
    { question: '¿Aceptan pagos con tarjeta o solo efectivo?', answer: 'Aceptamos efectivo, transferencia bancaria y SINPE Móvil. Para proyectos grandes de empresas, también facturamos y aceptamos depósitos.' },
  ] as FaqItem[],

  quickLinks: [
    // href '#' era un enlace muerto: con type 'whatsapp' el componente arma la
    // URL real del chat con el mensaje de abajo.
    { label: 'Chat de WhatsApp', href: '#', icon: 'WhatsApp', external: true,
      type: 'whatsapp', message: '¡Hola! Vi la página y necesito ayuda con un tema técnico.' },
    // Instagram y Facebook vuelven cuando existan las cuentas (ver `social`).
    { label: 'Llevame con Waze', href: 'https://waze.com/ul?ll=9.8961,-84.0613&navigate=yes', icon: 'MapPin', external: true },
    { label: 'Ver Productos (Tienda)', href: '/tienda', icon: 'ShoppingBag' },
  ] as QuickLink[],

  tienda: {
    enabled: true,
    title: 'Productos, Partes y Accesorios',
    description: 'Encontrá los componentes exactos que buscás sin dar mil vueltas. Inventario actualizado en tiempo real.',
    tallaLabel: 'Especificación',
  },

  priceRange: '₡5.000 – ₡250.000+',
} as const;

export function getService(slug: string) {
  return site.services.find(s => s.slug === slug);
}

export function groupedServices() {
  return site.serviceCategories.map(cat => ({
    ...cat,
    services: site.services.filter(s => s.category === cat.slug),
  }));
}

export function getCategory(slug: string) {
  return site.serviceCategories.find(c => c.slug === slug);
}

/* -------------------------------------------------------------------------- */
/*  Datos derivados                                                            */
/* -------------------------------------------------------------------------- */

/**
 * La dirección en una línea, lista para pintar.
 *
 * Existe porque varios componentes hacían `{site.contact.address}` — que es un
 * objeto, y React no sabe renderizar objetos: reventaba el build. El dato vive
 * estructurado (lo necesita el JSON-LD) y acá se aplana una sola vez.
 */
export function direccionCorta(): string {
  const a = site.contact.address;
  return [a.line1, a.line2].filter(Boolean).join(", ");
}

/**
 * El teléfono como lo lee una persona: "7269 6251".
 *
 * Se deriva del número de WhatsApp para que no haya dos fuentes de verdad que
 * se puedan desincronizar.
 */
export function telefonoVisible(): string {
  const sinPais = site.contact.whatsappNumber.replace(
    new RegExp("^" + site.contact.phoneCountryCode),
    "",
  );
  const mitad = Math.ceil(site.contact.phoneLocalDigits / 2);
  return sinPais.length > mitad
    ? sinPais.slice(0, mitad) + " " + sinPais.slice(mitad)
    : sinPais;
}
