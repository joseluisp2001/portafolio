import { Reveal } from "@/components/Reveal";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { StepConnector } from "@/components/StepConnector";
import { site } from "@/config/site";
import { STAGGER_STEP } from "@/lib/motion";

/**
 * "Cómo funciona": el bloque que baja la ansiedad antes del CTA final.
 *
 * Es marcado puro — la única animación la pone <Reveal>, que ya es cliente y
 * respeta `prefers-reduced-motion` por su cuenta. Por eso este archivo NO
 * lleva "use client": se renderiza en el servidor y no suma JS al bundle.
 */
export function HowItWorks() {
  return (
    <Section id="como-funciona" tone="cream">
      <SectionHeading
        eyebrow="Así de fácil"
        title="Cómo funciona"
        align="center"
      />

      {/*
        `isolate` no es decorativo: crea el contexto de apilado que mantiene la
        línea de `-z-10` DENTRO de esta grilla. Sin él, la línea se iría al
        contexto raíz y quedaría pintada debajo del fondo cream de la sección,
        es decir, invisible.
      */}
      <div className="relative isolate mt-16 grid gap-10 md:mt-20 md:grid-cols-3">
        {/*
          Línea que une los tres números. Va de centro a centro de las columnas
          extremas (1/6 y 5/6 del ancho) y se dibuja al entrar en pantalla.
        */}
        <StepConnector />

        {site.steps.map((step, index) => (
          <Reveal
            key={step.title}
            delay={index * STAGGER_STEP}
            className="text-center"
          >
            {/*
              El anillo cream de 8px le abre espacio al círculo dentro de la
              línea, para que el número se lea como una parada del recorrido y
              no como algo tachado.
            */}
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blush font-display text-xl text-espresso ring-8 ring-cream">
              {index + 1}
            </span>
            <h3 className="mt-6 text-h3 text-balance text-espresso">
              {step.title}
            </h3>
            <p className="mt-3 text-body text-mocha">{step.description}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
