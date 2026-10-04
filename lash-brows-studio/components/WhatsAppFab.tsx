"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { WhatsAppButton } from "@/components/WhatsAppButton";
import { WhatsAppIcon } from "@/components/icons";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DURATION } from "@/lib/motion";

/**
 * Aparece pasados 400px de scroll: antes de eso el CTA del hero está a la
 * vista y dos botones compitiendo por el mismo tap sólo hacen ruido.
 */
const SCROLL_THRESHOLD = 400;

/**
 * Botón flotante hacia WhatsApp.
 *
 * Es la red de seguridad de la métrica única del sitio: pase lo que pase, a
 * partir de la mitad del hero siempre hay una conversación a un tap.
 */
export function WhatsAppFab() {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => setVisible(window.scrollY > SCROLL_THRESHOLD);

    // Primera lectura sincrónica: si la página se recarga a media altura, el
    // botón ya tiene que estar ahí sin esperar a que la clienta mueva el dedo.
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="group fixed right-5 bottom-5 z-50 flex"
          initial={{ opacity: 0, scale: reduced ? 1 : 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: reduced ? 1 : 0.6 }}
          transition={
            reduced
              ? { duration: DURATION.reduced }
              : { type: "spring", stiffness: 260, damping: 20 }
          }
        >
          {/* Anillo que late cada 3s para atraer el ojo sin ocupar más espacio.
              Con movimiento reducido no se monta del todo: una escala infinita
              es justo lo que la preferencia pide apagar. */}
          {!reduced && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 animate-pulse-ring rounded-full bg-rose"
            />
          )}

          {/* Sólo en desktop, donde existe el hover. El nombre accesible ya lo
              da el aria-label del botón, así que esto es adorno: aria-hidden y
              sin capturar el puntero para no robarle el tap al enlace. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-full mr-3 hidden -translate-y-1/2 rounded-full bg-espresso px-3 py-1.5 text-sm whitespace-nowrap text-cream opacity-0 shadow-soft transition-opacity duration-300 ease-aura group-hover:opacity-100 group-focus-within:opacity-100 lg:block"
          >
            Escribinos por WhatsApp
          </span>

          {/* `relative` para que el enlace pinte por encima del anillo, que es
              su hermano posicionado. */}
          <WhatsAppButton
            intent={{ source: "fab" }}
            ariaLabel="Escribir por WhatsApp"
            className="relative size-14 p-0 shadow-lifted"
          >
            <WhatsAppIcon className="size-7" />
          </WhatsAppButton>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
