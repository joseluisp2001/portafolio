'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { IconoWhatsApp } from '@/components/IconoWhatsApp';
import { site } from '@/config/site';
import { cn } from '@/lib/cn';
import { buttonStyles } from '@/lib/button-styles';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { Logo } from '@/components/Logo';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Servicios', href: '/#servicios' },
    { label: 'Nosotros', href: '/#nosotros' },
    // La galería solo existe cuando hay fotos reales (ver config/site.ts).
    ...(site.gallery.length > 0 ? [{ label: 'Galería', href: '/#galeria' }] : []),
    { label: 'Tienda', href: '/tienda' },
    { label: 'Contacto', href: '/#contacto' },
  ];

  return (
    <header
      data-encabezado
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-colors duration-300',
        isScrolled ? 'bg-slate-900/95 backdrop-blur-md' : 'bg-transparent'
      )}
    >
      {/* En el teléfono: grilla de tres columnas con el logo en el centro. El
          hueco de la izquierda mide lo mismo que el botón del menú (2.5rem),
          así el logo queda centrado de verdad y no corrido. */}
      <div className="container mx-auto px-4 h-16 grid grid-cols-[2.5rem_1fr_2.5rem] items-center md:flex md:justify-between">
        <span aria-hidden="true" className="md:hidden" />

        <Link
          href="/"
          aria-label={`${site.brand.name}, inicio`}
          className="logo-enlace justify-self-center rounded-md md:justify-self-auto"
        >
          <Logo conSenal />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-white hover:text-cyan-500 transition-colors text-sm font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <Link
            href={buildWhatsAppUrl({ source: 'header' })}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({ variant: 'primary', size: 'sm', className: 'gap-2' })}
          >
            <IconoWhatsApp className="w-4 h-4" />
            Contactar
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden justify-self-end p-2 text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-16 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800"
          >
            <nav className="flex flex-col py-4 px-4 gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-white hover:text-cyan-500 text-lg font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={buildWhatsAppUrl({ source: 'header_mobile' })}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles({ variant: 'primary', className: 'w-full gap-2 justify-center mt-4' })}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <IconoWhatsApp className="w-5 h-5" />
                Contactar por WhatsApp
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
