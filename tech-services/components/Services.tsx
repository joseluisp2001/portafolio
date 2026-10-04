import { Section } from '@/components/Section';
import { SectionHeading } from '@/components/SectionHeading';
import { ServiceCard } from '@/components/ServiceCard';
import { CarruselServicios } from '@/components/CarruselServicios';
import { groupedServices } from '@/config/site';

export function Services() {
  const groups = groupedServices();

  return (
    <Section id="servicios" tone="light">
      <div className="container mx-auto px-4">
        <SectionHeading
          eyebrow="Qué hacemos"
          title="Nuestros servicios"
          destacado="servicios"
          align="center"
        />

        <div className="space-y-16 mt-12">
          {groups.map((group) => (
            <div key={group.slug}>
              <SectionHeading
                size="group"
                title={group.name}
                intro={group.description}
              />
              {/* Los servicios con escena animada van en carrusel; los demás, en grilla. */}
              {group.services.some((s) => s.escena) ? (
                <CarruselServicios services={group.services} titulo={group.name} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  {group.services.map((service) => (
                    <ServiceCard key={service.slug} service={service} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
