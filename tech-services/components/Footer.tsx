import Link from 'next/link';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { site, direccionCorta, telefonoVisible } from '@/config/site';
import { Logo } from '@/components/Logo';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { label: 'Servicios', href: '/#servicios' },
    { label: 'Nosotros', href: '/#nosotros' },
    // La galería solo existe cuando hay fotos reales (ver config/site.ts).
    ...(site.gallery.length > 0 ? [{ label: 'Galería', href: '/#galeria' }] : []),
    { label: 'Tienda', href: '/tienda' },
    { label: 'Contacto', href: '/#contacto' },
  ];

  return (
    <footer data-fondo-oscuro className="bg-slate-900 text-slate-300 py-12 lg:py-16">
      <div className="container relative mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8 border-b border-slate-800 pb-12">
          
          {/* Brand */}
          <div data-zona-calma className="flex flex-col space-y-4">
            <Link href="/" aria-label={`${site.brand.name}, inicio`} className="self-start rounded-md">
              <Logo />
            </Link>
            <p className="text-sm text-slate-400 max-w-xs">
              {site.brand.tagline}
            </p>
            <div className="flex space-x-4 pt-2">
              {site.social?.facebook && (
                <a href={site.social.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {site.social?.instagram && (
                <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div data-zona-calma>
            <h4 className="text-white font-semibold mb-4">Navegación</h4>
            <ul className="space-y-2">
              {navLinks.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm hover:text-cyan-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div data-zona-calma>
            <h4 className="text-white font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <span className="block text-slate-500 mb-1">Dirección</span>
                {direccionCorta()}
              </li>
              <li>
                <span className="block text-slate-500 mb-1">Teléfono / WhatsApp</span>
                {telefonoVisible()}
              </li>
              <li>
                <span className="block text-slate-500 mb-1">Email</span>
                {site.contact.email}
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p data-zona-calma>© {currentYear} {site.brand.name}. Todos los derechos reservados.</p>
          <p data-zona-calma>Desarrollado en Costa Rica 🇨🇷</p>
        </div>
      </div>
    </footer>
  );
}
