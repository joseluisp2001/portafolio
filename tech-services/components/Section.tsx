import { cn } from '@/lib/cn';
import React from 'react';

interface SectionProps {
  id?: string;
  children: React.ReactNode;
  tone?: 'dark' | 'light' | 'white';
  className?: string;
}

export function Section({ id, children, tone = 'light', className }: SectionProps) {
  return (
    <section id={id} data-tone={tone} className={cn('py-20 md:py-28', className)}>
      {/* relative: por encima del fondo vivo (FondoAnillo), sin crear contexto de apilamiento */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}
