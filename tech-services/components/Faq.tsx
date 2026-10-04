'use client';

import type { CSSProperties } from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { site } from '@/config/site';

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <Section id="faq" tone="light">
      <div className="container mx-auto px-4 max-w-3xl">
        <SectionHeading
          eyebrow="Preguntas frecuentes"
          title="¿Tenés dudas?"
          destacado="dudas?"
          align="center"
        />

        <div data-animar className="mt-12 space-y-4">
          {site.faq.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="anim-sube bg-white rounded-xl border border-slate-200 overflow-hidden"
                style={{ '--d': '120ms', '--i': index } as CSSProperties}
              >
                <button
                  className="w-full px-6 py-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors text-left"
                  onClick={() => toggle(index)}
                >
                  <span className="font-semibold text-slate-900 pr-8">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-cyan-500 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                {/* initial={false}: la que viene abierta sale del servidor ya abierta (sin JS se veía cerrada) */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-4 pt-2 text-slate-600 border-t border-slate-100">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
