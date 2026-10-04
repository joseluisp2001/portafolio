'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { site } from '@/config/site';
import { buttonStyles } from '@/lib/button-styles';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { revealVariants } from '@/lib/motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FondoAnillo } from '@/components/FondoAnillo';

export function Hero() {
  // El hook estaba importado pero nunca se llamaba: las variantes recibian
  // `reduced` sin definir y el componente no compilaba.
  const reduced = useReducedMotion();
  const prefersReducedMotion = useReducedMotion();
  const headlineLines = site.hero.headline.split('\n');
  // En la primera visita la carga en forma de circuito tapa la página ~1,4 s:
  // si el hero entra antes, la entrada se pierde debajo. INTRO_SCRIPT marca
  // `data-intro="mostrando"` antes de pintar. Solo cambia la demora de la
  // animación, no el HTML, así que no hay diferencia con el servidor.
  const [demoraEntrada] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.dataset.intro === 'mostrando' ? 1.4 : 0.2
  );

  return (
    <section data-fondo-oscuro className="relative min-h-dvh flex items-center justify-center overflow-hidden bg-slate-900">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={site.hero.image}
          alt={site.hero.imageAlt}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/75 to-slate-900/60" />
      </div>

      {/* Anillo de partículas que sigue al mouse (entre el velo y el texto) */}
      <FondoAnillo />

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 pt-20 pb-12 flex flex-col items-center text-center">
        <motion.div
          data-revelar
          initial={prefersReducedMotion ? false : 'hidden'}
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: demoraEntrada },
            },
          }}
          className="max-w-4xl flex flex-col items-center"
          data-zona-calma="tenue"
        >
          {/* Eyebrow */}
          <motion.span
            data-revelar
            variants={revealVariants(reduced)}
            className="rotulo text-cyan-500 font-semibold uppercase tracking-[0.1em] sm:tracking-[0.18em] text-[0.8rem] sm:text-sm md:text-base mb-5"
          >
            {/* el pin con señal del logo, como en los rótulos de cada sección */}
            <span className="rotulo-pin" aria-hidden="true" />
            {/* en el teléfono sin pista: así el rótulo entra en una línea junto a su pin */}
            <span className="rotulo-pista hidden sm:block" aria-hidden="true" />
            <span className="whitespace-nowrap">{site.hero.eyebrow}</span>
          </motion.span>

          {/* Headline */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-[-0.025em] mb-6">
            {headlineLines.map((line, i) => (
              // El corte del titular solo desde md: en el teléfono el texto
              // corre solo y no deja "dolores" suelto en una línea.
              <motion.span key={i} data-revelar variants={revealVariants(reduced)} className="inline md:block">
                {i > 0 && ' '}
                {line}
              </motion.span>
            ))}
          </h1>

          {/* Subheadline */}
          <motion.p
            data-revelar
            variants={revealVariants(reduced)}
            className="text-slate-200 text-lg md:text-xl max-w-2xl mb-10"
          >
            {site.hero.subheadline}
          </motion.p>

          {/* CTAs */}
          <motion.div
            data-revelar
            variants={revealVariants(reduced)}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link
              href={buildWhatsAppUrl({ source: 'hero_primary' })}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles({ variant: 'primary', size: 'lg' })}
            >
              {site.hero.primaryCta.label}
            </Link>
            <Link
              href="#servicios"
              className={buttonStyles({ variant: 'outline', size: 'lg', className: 'text-white border-white hover:bg-white/10' })}
            >
              {site.hero.secondaryCta.label}
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
