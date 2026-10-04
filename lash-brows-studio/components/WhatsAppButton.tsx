"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { trackEvent } from "@/lib/analytics";
import {
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "@/lib/button-styles";
import { pressable } from "@/lib/motion";
import { buildWhatsAppUrl, type WhatsAppIntent } from "@/lib/whatsapp";

interface WhatsAppButtonProps {
  intent: WhatsAppIntent;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  /** Sólo cuando el texto visible no describe la acción (ej. el FAB). */
  ariaLabel?: string;
}

/**
 * El único camino del sitio hacia WhatsApp.
 *
 * Centralizarlo garantiza tres cosas que son criterio de aceptación: que la URL
 * siempre venga de `buildWhatsAppUrl`, que todo click dispare `whatsapp_click`
 * con su `source`, y que ningún enlace se olvide de `rel="noopener"`.
 */
export function WhatsAppButton({
  intent,
  children,
  variant = "primary",
  size = "md",
  className,
  ariaLabel,
}: WhatsAppButtonProps) {
  const reduced = useReducedMotion();

  return (
    <motion.a
      href={buildWhatsAppUrl(intent)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={buttonClasses(variant, size, className)}
      onClick={() => trackEvent("whatsapp_click", { source: intent.source })}
      {...pressable(reduced)}
    >
      {children}
    </motion.a>
  );
}
