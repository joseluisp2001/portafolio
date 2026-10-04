'use client';

import { MapPin, Navigation, Clock } from 'lucide-react';
import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { site, direccionCorta } from '@/config/site';

export function LocationHours() {
  const { coords } = site.contact;
  // Se usa el embed clasico de Google Maps, que NO necesita API key. Habia
  // otra variante arriba que si la pedia y quedaba muerta.
  const fallbackMapUrl = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <Section id="ubicacion" tone="white">
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow="Ubicación"
          title="Dónde estamos"
          align="center"
        />

        <div className="mt-12 flex flex-col lg:flex-row gap-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
          {/* Map */}
          <div className="w-full lg:w-3/5 min-h-[400px] relative">
            <iframe
              src={fallbackMapUrl}
              width="100%"
              height="100%"
              style={{ border: 0, position: 'absolute', top: 0, left: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>

          {/* Info */}
          <div className="w-full lg:w-2/5 p-8 flex flex-col justify-center">
            <h3 className="text-2xl font-display font-bold text-slate-900 mb-6">
              Visitá nuestro taller
            </h3>

            <div className="space-y-6">
              <div className="flex gap-4">
                <MapPin className="w-6 h-6 text-cyan-500 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">Dirección</p>
                  <p className="text-slate-600 mt-1">{direccionCorta()}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Clock className="w-6 h-6 text-cyan-500 shrink-0" />
                <div className="w-full">
                  <p className="font-semibold text-slate-900 mb-2">Horarios</p>
                  <ul className="space-y-2">
                    {site.hours.map((schedule, i) => (
                      <li key={i} className="flex justify-between text-slate-600 text-sm border-b border-slate-100 pb-2 last:border-0">
                        <span>{schedule.label}</span>
                        <span className="font-medium text-slate-900">{schedule.display}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a
                href={site.contact.wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-medium py-3 px-4 rounded-lg transition-colors flex-1"
              >
                <Navigation className="w-5 h-5" />
                Cómo llegar (Waze)
              </a>
              <a
                href={site.contact.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-medium py-3 px-4 rounded-lg transition-colors flex-1"
              >
                <MapPin className="w-5 h-5" />
                Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
