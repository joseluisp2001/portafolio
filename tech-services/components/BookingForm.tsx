'use client';

import { useState } from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { IconoWhatsApp } from '@/components/IconoWhatsApp';
import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { site, direccionCorta, telefonoVisible } from '@/config/site';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { cn } from '@/lib/cn';
import { buttonStyles } from '@/lib/button-styles';

export function BookingForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!/^\d{8}$/.test(formData.phone)) newErrors.phone = 'Ingresá 8 dígitos';
    if (!formData.service) newErrors.service = 'Seleccioná un servicio';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const message = `Hola! Mi nombre es ${formData.name}.
Teléfono: ${formData.phone}
Me interesa: ${formData.service}
${formData.message ? `Mensaje: ${formData.message}` : ''}`;

    const url = buildWhatsAppUrl({ source: 'booking_form', message: message });
    window.open(url, '_blank');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  return (
    <Section id="contacto" tone="light">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Form */}
          <div className="w-full lg:w-3/5 bg-white p-8 rounded-2xl shadow-soft border border-slate-100">
            <SectionHeading eyebrow="Contacto" title="Escribinos" />
            
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors",
                      errors.name ? "border-red-500" : "border-slate-200"
                    )}
                    placeholder="Tu nombre"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Teléfono (8 dígitos)</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors",
                      errors.phone ? "border-red-500" : "border-slate-200"
                    )}
                    placeholder="12345678"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Servicio de interés</label>
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors bg-white",
                    errors.service ? "border-red-500" : "border-slate-200"
                  )}
                >
                  <option value="">Seleccioná una opción...</option>
                  {site.services.map(s => (
                    <option key={s.slug} value={s.name}>{s.name}</option>
                  ))}
                  <option value="Otro">Otro / Consulta general</option>
                </select>
                {errors.service && <p className="text-red-500 text-xs mt-1">{errors.service}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mensaje (opcional)</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors resize-none"
                  placeholder="¿En qué te podemos ayudar?"
                />
              </div>

              <button
                type="submit"
                className={buttonStyles({ variant: 'primary', size: 'lg', className: 'w-full gap-2 justify-center' })}
              >
                <IconoWhatsApp className="w-5 h-5" />
                Enviar por WhatsApp
              </button>
            </form>
          </div>

          {/* Info Card */}
          <div className="w-full lg:w-2/5">
            <div className="bg-slate-900 text-white p-8 rounded-2xl shadow-soft h-full flex flex-col justify-center space-y-8">
              <div>
                <h3 className="text-2xl font-display font-bold mb-6">Información de contacto</h3>
                <p className="text-slate-300">
                  Estamos listos para ayudarte. Contactanos por cualquiera de nuestros medios.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Teléfono / WhatsApp</p>
                    <p className="font-medium">{telefonoVisible()}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-400">Email</p>
                    {/* a 320 px el correo no cabía y la página se corría 30 px de lado */}
                    <p className="font-medium [overflow-wrap:anywhere]">{site.contact.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Dirección</p>
                    <p className="font-medium">{direccionCorta()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
