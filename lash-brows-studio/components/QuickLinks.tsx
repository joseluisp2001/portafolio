"use client";

import { ArrowRight, Gift, MapPin } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { Section } from "@/components/Section";
import { SectionHeading } from "@/components/SectionHeading";
import { site } from "@/config/site";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { trackEvent } from "@/lib/analytics";
import {
  REVEAL_VIEWPORT,
  revealTransition,
  revealVariants,
  staggerContainer,
} from "@/lib/motion";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/** El `source` viaja igual a la URL de WhatsApp y a la analítica. */
const WHATSAPP_SOURCE = "linktree";

/** Tamaño común de los íconos, para que las filas se vean parejas. */
const ICON = "h-5 w-5";

interface QuickLink {
  /** Identificador corto; es lo que se manda en el evento de analítica. */
  id: string;
  label: string;
  href: string;
  /** Se guarda ya renderizado: cada ícono viene de una librería distinta. */
  icon: ReactNode;
  /** El de WhatsApp cuenta doble: es la métrica única del sitio. */
  isWhatsApp?: boolean;
}

/**
 * "Enlaces rápidos" — el modo Linktree del sitio.
 *
 * Reemplaza el Linktree que el estudio pasaba en la bio de Instagram, así que
 * tiene que sostenerse sola: si alguien le saca una captura sólo a esta
 * sección, ahí está todo lo que la clienta necesita para llegar al chat.
 *
 * Los enlaces sin URL en config no se dibujan (hoy: TikTok). Es a propósito —
 * un botón que no lleva a ningún lado gasta el tap que queríamos para WhatsApp.
 */
export function QuickLinks() {
  const reduced = useReducedMotion();

  // TODO: las etiquetas de Instagram/Facebook/WhatsApp/ubicación no existen en
  // config porque son nombres propios o de interfaz; si el dueño quiere
  // cambiarlas, hay que agregarles su campo en config/site.ts.
  const links: QuickLink[] = [
    {
      id: "instagram",
      label: "Instagram",
      href: site.social.instagram,
      icon: <InstagramIcon className={ICON} />,
    },
    {
      id: "facebook",
      label: "Facebook",
      href: site.social.facebook,
      icon: <FacebookIcon className={ICON} />,
    },
    {
      id: "whatsapp",
      label: "Escribinos por WhatsApp",
      href: buildWhatsAppUrl({ source: WHATSAPP_SOURCE }),
      icon: <WhatsAppIcon className={ICON} />,
      isWhatsApp: true,
    },
    {
      id: "ubicacion",
      label: "Cómo llegar en Waze",
      href: site.contact.wazeUrl,
      icon: <MapPin aria-hidden="true" className={ICON} />,
    },
    ...(site.loyalty.enabled && site.loyalty.url
      ? [
          {
            id: "fidelidad",
            label: site.loyalty.label,
            href: site.loyalty.url,
            icon: <Gift aria-hidden="true" className={ICON} />,
          },
        ]
      : []),
    // TikTok va de último y sólo si el estudio abrió la cuenta.
    ...(site.social.tiktok
      ? [
          {
            id: "tiktok",
            label: "TikTok",
            href: site.social.tiktok,
            icon: <TikTokIcon className={ICON} />,
          },
        ]
      : []),
  ].filter((link) => link.href.length > 0);

  return (
    <Section id="enlaces" tone="sand">
      <SectionHeading
        eyebrow="Todo en un tap"
        title="Enlaces rápidos"
        align="center"
      />

      <motion.ul
        className="mx-auto mt-14 max-w-xl space-y-3"
        initial="hidden"
        whileInView="visible"
        viewport={REVEAL_VIEWPORT}
        variants={staggerContainer(reduced)}
      >
        {links.map((link) => (
          <motion.li
            key={link.id}
            variants={revealVariants(reduced)}
            transition={revealTransition(reduced)}
          >
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-14 w-full items-center gap-4 rounded-full border border-espresso/10 bg-cream px-6 py-4 shadow-soft transition-colors duration-300 ease-aura hover:bg-blush"
              onClick={() => {
                trackEvent("quick_link_click", { link: link.id });
                // El tap a WhatsApp también se cuenta como conversación
                // iniciada, que es la única métrica que importa.
                if (link.isWhatsApp) {
                  trackEvent("whatsapp_click", { source: WHATSAPP_SOURCE });
                }
              }}
            >
              <span className="shrink-0 text-rose-ink">{link.icon}</span>
              <span className="flex-1 font-medium text-espresso">
                {link.label}
              </span>
              <ArrowRight
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-mocha transition-transform duration-300 ease-aura group-hover:translate-x-1"
              />
            </a>
          </motion.li>
        ))}
      </motion.ul>
    </Section>
  );
}
