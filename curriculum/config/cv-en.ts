/*
  El curriculum en INGLES, para el documento de Word (scripts/generar-word.mjs).

  Es la traduccion del perfil "desarrollo" de config/cv.ts, en el mismo orden y
  con los mismos datos: ni una cifra ni un logro que no este alla. Si se cambia
  algo en cv.ts, se cambia aca tambien — el generador avisa si las listas no
  tienen el mismo largo.

  Lo que no se traduce (nombre, correo, telefono, GitHub) sale de cv.ts.

  Criterios de la traduccion, pensados para un ATS (el programa que lee el CV
  antes que una persona):
  - Los nombres de tecnologias van escritos como los busca un reclutador:
    "Next.js", "SQL Server", "C#", ".NET".
  - Los titulos y estudios de Costa Rica llevan el nombre original entre
    parentesis: no tienen equivalente exacto y el original es verificable.
*/
export const cvEn = {
  titulo: 'Web Developer | Next.js, TypeScript and MySQL',
  ciudad: 'Desamparados, San José, Costa Rica',

  resumen:
    'I build and maintain four production websites for businesses in Desamparados: ' +
    'stores with MySQL inventory managed from a phone, appointment booking with ' +
    'Google Calendar, and WhatsApp bots. I also built a C# desktop system on SQL ' +
    'Server that is sold with per-device licensing. I come from technical support: ' +
    "I test what I deliver on the client's phone before calling it done. Every " +
    'project gets linting, version control, backups and verified color contrast ' +
    'from day one.',

  loQueSabe: [
    {
      area: 'Web Development',
      cosas: [
        'Next.js, React and TypeScript',
        'Tailwind CSS and custom design systems',
        'MySQL: data modeling, queries and administration',
        'REST APIs with API key authentication',
      ],
    },
    {
      area: 'Servers and Automation',
      cosas: [
        'Linux VPS: Docker, Traefik, HTTPS and firewall',
        'n8n workflow automation',
        'WhatsApp bots with Evolution API',
        'Local language models with Ollama',
      ],
    },
    {
      area: 'Desktop and Data',
      cosas: ['C# and .NET (WinForms)', 'SQL Server', 'Licensing system with cryptographic signatures'],
    },
    {
      area: 'IT Support and Networking',
      cosas: [
        'End-user technical support, on-site and remote',
        'Networking: cabling, configuration and troubleshooting',
        'Desktop and laptop repair',
        'Customer service and requirements gathering',
        'Office productivity with LibreOffice',
      ],
    },
  ],

  proyectos: [
    {
      nombre: 'Lash & Brows Studio',
      papel: 'Full website, in production',
      texto:
        'Website for a lash studio with appointment booking on Google Calendar and a ' +
        'WhatsApp bot. The booking form reserved the slot automatically, and a private ' +
        'dashboard let the owner approve or decline appointments from a phone.',
      hecho: 'Next.js, n8n, Google Calendar, Evolution API, Docker',
    },
    {
      nombre: 'Rapitelas',
      papel: 'Catalog of 3,060 items',
      texto:
        'Fabric store with search, category filters and a cart that builds the order ' +
        'and sends it through WhatsApp. The catalog is generated from the inventory ' +
        'photos with a custom script.',
      hecho: 'Next.js, static site generation, Node.js',
    },
    {
      nombre: 'SHEIN Los Guido',
      papel: 'Online store with admin panel',
      texto:
        'Clothing store on MySQL, managed from a phone: upload products with photos, ' +
        'edit prices and check inventory. The same database is shared by three ' +
        'different stores.',
      hecho: 'Next.js, MySQL, API key authentication, Docker',
    },
    {
      nombre: 'PlanillaVanguard',
      papel: 'Desktop software sold with licensing',
      texto:
        'Staff management for a security company with 27 sites. C# desktop application ' +
        'on SQL Server, with a per-device licensing system signed cryptographically so ' +
        'it cannot be copied.',
      hecho: 'C#, WinForms, SQL Server, RSA signatures',
    },
    {
      nombre: 'Five websites, five design systems',
      papel: 'Personal work',
      texto:
        'Five websites, each with its own visual identity. Color contrast in each one ' +
        'was verified against WCAG AA before writing code.',
      hecho: 'Next.js, Tailwind CSS v4, TypeScript',
    },
  ],

  experiencia: [
    {
      puesto: 'Area Technician (IT Support)',
      lugar: 'Mather, Clínica Marcial Fallas (CCSS, Costa Rican Social Security Fund)',
      desde: 'Dec 2025',
      hasta: 'Present',
      texto: 'Help desk and on-site technical support for the clinic staff.',
      puntos: [
        'Maintenance of computers, laptops, tablets, kiosks and cameras',
        'Network point installation and software installation for each medical service',
        'Improvements for staff: desktop shortcuts, training and equipment setup based on their needs',
        'Equipment destruction following CCSS disposal protocols, and service log management',
        'Available for rotating shifts',
      ],
    },
    {
      puesto: 'Orbe Authorized Technician',
      lugar: 'Los de TI, Orbe contractor',
      desde: '2024',
      hasta: '2025',
      texto: 'Project supervisor: led project close-out following all protocols, with more than 40 people in charge.',
      puntos: [
        'Work under special protocols at the Ministry of Justice and Peace, SINAC, the Ministry of Finance, Banco Nacional and Correos de Costa Rica',
        'Mass deployment of ISO images and software installation for each institution',
        'Firmware updates to close security vulnerabilities',
        'Ticketing system with inventory tracking, and removal of leased equipment by inventory',
        'Printer installation and preventive maintenance, IP phone software, server wiping and general support',
      ],
    },
    {
      puesto: 'Sales and Technical Support',
      lugar: 'Self-employed',
      desde: '2021',
      hasta: 'Present',
      texto: 'Websites and systems for local businesses, plus technical support. Part-time.',
    },
    {
      puesto: 'IT Intern',
      lugar: 'ALGOL SECURITY, Navarro y Avilés, San José',
      desde: '2021',
      hasta: '2021',
      texto: 'IT internship.',
    },
  ],

  formacion: [
    {
      titulo: 'Diploma in Computer Science (Diplomado en Informática)',
      lugar: 'UNED, Costa Rica',
      detalle: '68 credits completed, diploma pending',
    },
    {
      titulo: 'Associate Technician in Computer Networking (Técnico Medio en Informática en Redes de Computadoras)',
      lugar: 'CTP José Albertazzi Avendaño',
      detalle: '2021',
    },
    {
      titulo: 'High School Diploma (Bachiller en Educación Media)',
      lugar: 'CTP José Albertazzi Avendaño',
      detalle: '2021',
    },
  ],

  idiomas: [
    { idioma: 'Spanish', nivel: 'Native' },
    { idioma: 'English', nivel: 'B2 (CEFR)' },
  ],
} as const;
