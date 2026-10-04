'use client';

import { motion } from 'motion/react';
import { IconoWhatsApp } from '@/components/IconoWhatsApp';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { buttonStyles } from '@/lib/button-styles';
import { cn } from '@/lib/cn';

interface WhatsAppButtonProps {
  source: string;
  service?: string;
  label?: string;
  variant?: 'primary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function WhatsAppButton({
  source,
  service,
  label = 'WhatsApp',
  variant = 'primary',
  size = 'md',
  className,
}: WhatsAppButtonProps) {
  const url = buildWhatsAppUrl({ source, service });

  return (
    <motion.a
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonStyles({ variant, size }), 'gap-2 inline-flex items-center', className)}
    >
      <IconoWhatsApp className="w-5 h-5" />
      {label}
    </motion.a>
  );
}
