import type { CSSProperties } from 'react';
import Image from 'next/image';
import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { CountUp } from '@/components/CountUp';
import { site } from '@/config/site';

/** **así** → <strong>: resalta lo que el texto ya dice, sin cambiarlo. */
function conNegritas(texto: string) {
  return texto.split(/\*\*(.+?)\*\*/g).map((parte, i) =>
    i % 2 ? (
      <strong key={i} className="font-semibold text-slate-900">
        {parte}
      </strong>
    ) : (
      parte
    ),
  );
}

export function About() {
  return (
    <Section id="nosotros" tone="white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Image */}
          <div className="w-full lg:w-1/2">
            <div className="relative aspect-square w-full max-w-md mx-auto lg:max-w-none">
              <Image
                src={site.about.image}
                alt={site.about.imageAlt}
                fill
                className="object-cover rounded-2xl shadow-lifted"
              />
            </div>
          </div>

          {/* Content */}
          <div className="w-full lg:w-1/2">
            {/* Sin `intro`: los párrafos ya van abajo y salían dos veces. */}
            <SectionHeading eyebrow="Nosotros" title={site.about.title} destacado="damos soluciones." />

            {/* El primero es la entrada: más grande y oscuro. Entran escalonados después del título. */}
            <div data-zona-calma data-animar className="mt-8 space-y-5">
              {site.about.paragraphs.map((para, i) => (
                <p
                  key={i}
                  className={i === 0 ? 'anim-sube texto-intro text-lg leading-relaxed text-slate-700 md:text-xl' : 'anim-sube texto-intro leading-relaxed text-slate-600 md:text-lg'}
                  style={{ '--d': '520ms', '--i': i } as CSSProperties}
                >
                  {conNegritas(para)}
                </p>
              ))}
            </div>

            {site.about.stats.length > 0 && (
              <div data-zona-calma className="grid grid-cols-2 gap-6 mt-10">
                {site.about.stats.map((stat, i) => (
                  <CountUp
                    key={i}
                    value={stat.value}
                    suffix={stat.suffix}
                    label={stat.label}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
