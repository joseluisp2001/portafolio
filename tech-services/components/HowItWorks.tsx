import type { CSSProperties } from 'react';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { site } from '@/config/site';

// Cuándo llega la señal a cada paso (ms): la pista va del 15 % al 85 % del ancho
// con el ease-in-out fuerte de 1,4 s que arranca a los 300 ms (app/globals.css).
const LLEGA_MS = [360, 1000, 1500];

export function HowItWorks() {
  return (
    <Section id="proceso" tone="white">
      <div className="container mx-auto px-4">
        <SectionHeading eyebrow="Cómo funciona" title="Tres pasos simples" destacado="simples" align="center" />

        <div data-animar className="relative mt-16 max-w-5xl mx-auto">
          {/* La pista que une los pasos (escritorio): una señal la recorre de
              izquierda a derecha y enciende cada paso cuando llega. */}
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-slate-200" aria-hidden="true">
            <span className="pasos-senal anim-pista" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            {site.steps.map((step, index) => {
              const Icon = (Icons as unknown as Record<string, LucideIcon>)[step.icon] || Icons.CheckCircle;
              const llega = LLEGA_MS[index] ?? 360 + index * 600;

              return (
                <div key={index} className="flex flex-col items-center text-center" style={{ '--llega': `${llega}ms` } as CSSProperties}>
                  <div className="paso-circulo anim-enciende w-24 h-24 bg-white rounded-full border-8 border-slate-50 flex items-center justify-center mb-6 relative">
                    {/* tinta del acento: el blanco sobre el cian daba 2,4:1 */}
                    <div className="paso-numero anim-pin absolute -top-3 -right-3 w-8 h-8 bg-accent-ink rounded-full text-white font-bold flex items-center justify-center border-4 border-white tabular-nums">
                      {index + 1}
                    </div>
                    <Icon className="paso-icono w-10 h-10 text-cyan-600" />
                  </div>

                  <h3
                    data-zona-calma
                    className="anim-sube titulo-grupo text-slate-900 mb-3 !text-xl"
                    style={{ '--d': `${llega + 80}ms` } as CSSProperties}
                  >
                    {step.title}
                  </h3>
                  <p
                    data-zona-calma
                    className="anim-sube texto-intro max-w-[32ch] leading-relaxed text-slate-600"
                    style={{ '--d': `${llega + 160}ms` } as CSSProperties}
                  >
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}
