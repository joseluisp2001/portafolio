import { site } from '@/config/site';

export interface WhatsAppIntent {
  source: string;
  service?: string;
  message?: string;
}

export function buildMessage(intent: WhatsAppIntent): string {
  if (intent.message) {
    return `${intent.message}\n\n[ref:${intent.source}]`;
  }
  
  if (intent.service) {
    return `Quería consultar por ${intent.service}. ¿Qué disponibilidad tenés?\n\n[ref:${intent.source}]`;
  }
  
  return `Vi la página y me gustaría consultar ✨\n\n[ref:${intent.source}]`;
}

export function buildWhatsAppUrl(intent: WhatsAppIntent): string {
  const number = site.contact.whatsappNumber;
  const message = buildMessage(intent);
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${number}?text=${encodedMessage}`;
}
