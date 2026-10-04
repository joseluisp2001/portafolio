import { site } from '@/config/site';
import { hayWhatsApp, urlWhatsApp } from '@/lib/whatsapp';

/*
  Pastilla flotante. NUNCA detras de un modal, nunca condicionada a llenar un
  formulario: el camino al chat no se bloquea con nada.

  Va en salvia-texto y no en salvia: la salvia bonita da 2,7:1 y con sol de
  mediodia en un celular no se lee, que es justo la condicion en que alguien
  busca una veterinaria de urgencia.
*/
export default function BotonWhatsApp() {
  const mensaje = `Buenas! Quisiera consultar por ${site.nombre.toLowerCase()}.`;

  if (!hayWhatsApp) {
    return (
      <p className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-full border-2 border-alerta bg-nube px-5 py-3 text-sm text-alerta">
        Falta el numero de WhatsApp en config/site.ts
      </p>
    );
  }

  return (
    <a
      href={urlWhatsApp(mensaje)}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-5 bottom-5 z-40 flex items-center gap-3 rounded-full bg-salvia-texto px-6 py-4 font-semibold text-nube shadow-blanda transition-all duration-500 ease-blando hover:-translate-y-0.5 hover:shadow-alta"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="currentColor">
        <path d="M12 2a10 10 0 00-8.7 15l-1.2 4.4 4.5-1.2A10 10 0 1012 2zm5.6 14c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.5-.6a11 11 0 01-4.3-3.9c-.3-.5-.7-1.2-.7-2.2s.5-1.5.7-1.7c.2-.2.4-.3.6-.3h.4c.1 0 .3 0 .5.4l.7 1.6c0 .2.1.3 0 .5l-.3.4-.2.3c-.1.1-.2.2 0 .5.2.3.7 1.1 1.4 1.7.9.8 1.6 1 1.9 1.2.2.1.4 0 .5-.1l.7-.8c.2-.2.3-.2.5-.1l1.6.7c.2.1.4.2.4.3.1.1.1.5 0 1z" />
      </svg>
      Escribinos
    </a>
  );
}
