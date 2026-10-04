'use client';

import type { CSSProperties } from 'react';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { IconoWhatsApp } from '@/components/IconoWhatsApp';
import { site } from '@/config/site';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

export function QuickLinks() {
  return (
    <Section tone="white">
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow="Links rápidos"
          title="Todo a un toque"
          destacado="un toque"
          align="center"
        />

        {/* Fila centrada y no grilla fija: la cantidad de enlaces cambia con
            los que existen (las redes se muestran solo cuando hay cuenta). */}
        <div data-animar className="flex flex-wrap justify-center gap-4 mt-10 max-w-4xl mx-auto">
          {site.quickLinks.map((link, index) => {
            // 'WhatsApp' es el ícono propio (components/IconoWhatsApp); el resto, de lucide
            const Icon = link.icon === 'WhatsApp' ? IconoWhatsApp : (Icons as unknown as Record<string, LucideIcon>)[link.icon] || Icons.Link;
            
            // If it's a whatsapp action, build the URL
            const href = link.type === 'whatsapp' 
              ? buildWhatsAppUrl({ source: 'quicklink', message: link.message })
              : link.href;

            return (
              <div key={index} className="anim-sube flex w-[calc(50%-0.5rem)] md:w-48" style={{ '--d': '120ms', '--i': index } as CSSProperties}>
              <a
                href={href}
                target={link.type === 'whatsapp' || href?.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="flex w-full flex-col items-center justify-center p-6 bg-slate-50 hover:bg-cyan-50 rounded-xl border border-slate-200 hover:border-cyan-200 transition-colors duration-300 group"
              >
                <Icon className="w-8 h-8 text-slate-400 group-hover:text-cyan-500 mb-3 transition-colors" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-cyan-700 text-center">
                  {link.label}
                </span>
              </a>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
