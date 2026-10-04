"use client";

import { Menu, X } from "lucide-react";
import { AnimatePresence, motion, type Transition } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentType, SVGProps } from "react";

import { WhatsAppButton } from "@/components/WhatsAppButton";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from "@/components/icons";
import { site } from "@/config/site";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import {
  DURATION,
  EASE_AURA,
  revealVariants,
  staggerContainer,
} from "@/lib/motion";

/**
 * Los anclajes salen de `site.nav`, compartidos con el footer.
 *
 * "Reseñas" volvió el 6-9-2026. Se había quitado el 30-8 porque la sección
 * desaparecía cuando no había testimonios y el enlace apuntaba a un ancla
 * inexistente; ahora `#resenas` existe siempre, porque ahí vive el formulario
 * para dejar una.
 */
const NAV_LINKS = site.nav;

interface SocialLink {
  label: string;
  url: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

/**
 * Las redes salen de `site.social`; las que están vacías simplemente no se
 * renderizan (hoy TikTok), así el dueño las prende llenando el config y no
 * tocando este archivo.
 */
const ALL_SOCIAL_LINKS: SocialLink[] = [
  { label: "Instagram", url: site.social.instagram, Icon: InstagramIcon },
  { label: "Facebook", url: site.social.facebook, Icon: FacebookIcon },
  { label: "TikTok", url: site.social.tiktok, Icon: TikTokIcon },
];

const SOCIAL_LINKS = ALL_SOCIAL_LINKS.filter(
  (social) => social.url.length > 0,
);

/** A partir de acá el header deja de ser transparente. */
const SCROLL_THRESHOLD = 40;

/**
 * Qué puede recibir foco dentro del panel. Es una lista corta a propósito:
 * el panel sólo contiene enlaces y un botón.
 */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const MENU_PANEL_ID = "menu-movil";

/**
 * Header sticky: transparente sobre el hero y con fondo `cream` translúcido
 * apenas la clienta baja 40px.
 *
 * DECISIÓN: el panel móvil se renderiza como HERMANO del <header>, no como
 * hijo. Cuando el header está desplazado lleva `backdrop-blur`, y un elemento
 * con `backdrop-filter` se convierte en el bloque contenedor de sus
 * descendientes `fixed`: el panel habría quedado encajado en los 72px del
 * header en vez de ocupar la pantalla entera.
 *
 * Por eso también el header va en `z-[60]` y el panel en `z-50`: el botón
 * hamburguesa (que hace de botón de cerrar) tiene que quedar por encima del
 * panel para poder tocarlo.
 */
export function Header() {
  const reduced = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /** Cierra y devuelve el foco al botón que abrió, como pide WCAG 2.4.3. */
  const closeMenu = useCallback(() => {
    setOpen(false);
    // `preventScroll` para no pelear con el scroll suave hacia el ancla
    // cuando el cierre viene de tocar un enlace del menú.
    toggleRef.current?.focus({ preventScroll: true });
  }, []);

  /* ---- Fondo del header según el scroll ---------------------------------- */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    };

    // Se evalúa una vez al montar: si la página se recarga a media altura o se
    // entra con un ancla, el header ya tiene que verse sólido.
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ---- Bloqueo del scroll del body mientras el panel está abierto -------- */
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  /* ---- Escape + trampa de foco ------------------------------------------- */
  useEffect(() => {
    if (!open) return;

    /**
     * El botón hamburguesa entra en el ciclo aunque viva fuera del panel:
     * es el único control de cierre, así que dejarlo afuera de la trampa
     * encerraría a quien navega con teclado.
     */
    const getFocusables = (): HTMLElement[] => {
      const inside = panelRef.current
        ? Array.from(
            panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
          )
        : [];
      const toggle = toggleRef.current;
      return toggle ? [toggle, ...inside] : inside;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab") return;

      const focusables = getFocusables();
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const isInside =
        active instanceof HTMLElement && focusables.includes(active);

      if (event.shiftKey) {
        if (!isInside || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!isInside || active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, closeMenu]);

  /* ---- Si la pantalla crece a escritorio, el panel sobra ------------------ */
  useEffect(() => {
    if (!open) return;

    // Sin esto, girar el teléfono o agrandar la ventana escondería el panel
    // (`lg:hidden`) pero dejaría el body bloqueado y sin forma de cerrarlo.
    const media = window.matchMedia("(min-width: 64rem)");
    const handleChange = () => {
      if (media.matches) setOpen(false);
    };

    handleChange();
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [open]);

  /** Los items del panel entran con la curva de la casa, sin `delay` propio:
   *  el escalonado lo pone `staggerContainer` y un delay acá lo pisaría. */
  const itemTransition: Transition = {
    duration: reduced ? DURATION.reduced : DURATION.micro,
    ease: EASE_AURA,
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-[60] border-b transition-colors duration-300 ease-aura",
          scrolled
            ? "border-espresso/10 bg-cream/85 backdrop-blur-md"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-6">
          {/* Marca */}
          <a
            href="#inicio"
            className="flex min-h-11 items-center gap-2.5 text-espresso"
          >
            <Image
              src={site.brand.logo}
              // Decorativo: el nombre del estudio va escrito al lado, y
              // repetirlo en el alt haría que el lector de pantalla lo diga
              // dos veces seguidas.
              alt=""
              aria-hidden="true"
              width={40}
              height={40}
              loading="lazy"
              className="h-10 w-10"
            />
            {/* El nombre (Génesis Roca) arriba, y el "Lash & Brow Studio" como
                bajada fina: el logo separa así las dos líneas, y repetirlo acá
                mantiene la jerarquía de la marca. */}
            <span className="flex flex-col leading-none">
              <span className="font-display text-xl">{site.brand.name}</span>
              <span className="mt-0.5 text-[0.62rem] uppercase tracking-[0.2em] text-mocha">
                {site.brand.studioSuffix}
              </span>
            </span>
          </a>

          {/* Navegación de escritorio */}
          <nav aria-label="Navegación principal" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="group relative inline-flex min-h-11 items-center px-1 text-sm font-medium text-mocha transition-colors duration-300 ease-aura hover:text-espresso"
                  >
                    {link.label}
                    {/* Subrayado por transform: escalar no dispara layout. */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-1 bottom-2 h-px origin-left scale-x-0 bg-rose transition-transform duration-300 ease-aura group-hover:scale-x-100 group-focus-visible:scale-x-100"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Redes + CTA de escritorio */}
          <div className="hidden items-center gap-2 lg:flex">
            {/* Íconos de redes: sólo los que tienen URL en el config. Van antes
                del CTA para que la clienta que prefiere ver Instagram primero
                lo encuentre sin bajar hasta el footer. */}
            {SOCIAL_LINKS.map(({ label, url, Icon }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${label} de ${site.brand.name}`}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-mocha transition-colors duration-300 ease-aura hover:bg-sand hover:text-rose-ink"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
            <WhatsAppButton intent={{ source: "header" }} size="sm" className="ml-1">
              {site.hero.whatsappCta}
            </WhatsAppButton>
          </div>

          {/* Botón del menú móvil */}
          <button
            ref={toggleRef}
            type="button"
            onClick={() => (open ? closeMenu() : setOpen(true))}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls={MENU_PANEL_ID}
            className="-mr-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-espresso transition-colors duration-300 ease-aura hover:bg-sand lg:hidden"
          >
            {open ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="menu-movil"
            id={MENU_PANEL_ID}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: reduced ? DURATION.reduced : DURATION.micro,
              ease: EASE_AURA,
            }}
            className="fixed inset-0 z-50 overflow-y-auto bg-cream lg:hidden"
          >
            <motion.div
              variants={staggerContainer(reduced)}
              initial="hidden"
              animate="visible"
              className="flex min-h-full flex-col gap-10 px-6 pb-12 pt-28"
            >
              <nav aria-label="Navegación principal">
                <ul className="flex flex-col gap-1">
                  {NAV_LINKS.map((link) => (
                    <motion.li
                      key={link.href}
                      variants={revealVariants(reduced)}
                      transition={itemTransition}
                    >
                      <a
                        href={link.href}
                        onClick={closeMenu}
                        className="flex min-h-11 items-center py-2 font-display text-h3 text-espresso"
                      >
                        {link.label}
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              <motion.div
                variants={revealVariants(reduced)}
                transition={itemTransition}
                className="mt-auto"
              >
                <WhatsAppButton
                  intent={{ source: "menu-movil" }}
                  size="lg"
                  className="w-full"
                >
                  {site.hero.whatsappCta}
                </WhatsAppButton>
              </motion.div>

              {SOCIAL_LINKS.length > 0 ? (
                <motion.ul
                  variants={revealVariants(reduced)}
                  transition={itemTransition}
                  className="flex items-center gap-2"
                >
                  {SOCIAL_LINKS.map((social) => (
                    <li key={social.label}>
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-mocha transition-colors duration-300 ease-aura hover:bg-sand hover:text-espresso"
                      >
                        <social.Icon className="h-5 w-5" />
                      </a>
                    </li>
                  ))}
                </motion.ul>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
