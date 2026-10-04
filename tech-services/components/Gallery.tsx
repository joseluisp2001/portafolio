'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { site } from '@/config/site';

export function Gallery() {
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  // Sin fotos reales no hay "Trabajos realizados" que mostrar.
  if (site.gallery.length === 0) return null;

  return (
    <Section id="galeria" tone="light">
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow="Portfolio"
          title="Trabajos realizados"
          align="center"
        />

        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 mt-12">
          {site.gallery.map((img, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-xl cursor-pointer group"
              onClick={() => setSelectedImg(img.src)}
            >
              <Image
                src={img.src}
                alt={img.alt || `Gallery image ${i + 1}`}
                width={img.width || 400}
                height={img.height || 300}
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {selectedImg && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-sm p-4"
              onClick={() => setSelectedImg(null)}
            >
              <button
                className="absolute top-6 right-6 text-white hover:text-cyan-400 p-2"
                onClick={() => setSelectedImg(null)}
              >
                <X className="w-8 h-8" />
              </button>
              
              <div className="relative w-full max-w-5xl aspect-video" onClick={(e) => e.stopPropagation()}>
                <Image
                  src={selectedImg}
                  alt="Vista ampliada"
                  fill
                  className="object-contain"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Section>
  );
}
