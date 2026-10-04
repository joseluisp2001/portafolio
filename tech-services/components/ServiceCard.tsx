'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { IconoWhatsApp } from '@/components/IconoWhatsApp';
import { Reveal } from '@/components/Reveal';
import { EscenaServicio } from '@/components/EscenaServicio';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { formatPrice } from '@/lib/format';
import { buttonStyles } from '@/lib/button-styles';
import type { Service } from '@/config/site';

// `activa` la pasa el carrusel: solo corre la escena de la tarjeta del centro.
export function ServiceCard({ service, activa }: { service: Service; activa?: boolean }) {
  return (
    <Reveal>
      <div className="tarjeta-servicio bg-white rounded-xl shadow-soft hover:shadow-lifted transition-shadow duration-300 border border-slate-200 overflow-hidden flex flex-col h-full relative">
        {service.popular && (
          <div className="absolute top-4 right-4 bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full z-10">
            Popular
          </div>
        )}
        
        {service.escena ? (
          <EscenaServicio escena={service.escena} nombre={service.name} activa={activa} />
        ) : (
          <div className="relative aspect-video">
            <Image
              src={service.image || '/images/placeholder.jpg'}
              alt={service.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        )}

        <div className="p-6 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-display text-xl font-bold text-slate-900 leading-tight">
              {service.name}
            </h3>
          </div>
          
          <p className="text-slate-500 text-sm mb-6 flex-grow">
            {service.description}
          </p>

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
            <div>
              {service.price ? (
                <span className="font-bold text-slate-900 text-lg">
                  {formatPrice(service.price)}
                </span>
              ) : (
                // Texto y no píldora: con fondo parecía un botón al lado de "Consultar".
                <span className="text-sm font-semibold text-slate-600">
                  Precio a cotizar
                </span>
              )}
              {service.duration && (
                // slate-600 y no slate-400: sobre blanco daba 2,56:1.
                <div className="flex items-center text-slate-600 text-xs mt-1">
                  <Clock className="w-3 h-3 mr-1" />
                  {service.duration}
                </div>
              )}
            </div>

            <Link
              href={buildWhatsAppUrl({ source: 'service_card', service: service.name })}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles({ variant: 'primary', size: 'sm', className: 'gap-1' })}
            >
              <IconoWhatsApp className="w-4 h-4" />
              Consultar
            </Link>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
