"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";

import type { GalleryItem } from "@/config/site";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { blurProps } from "@/lib/blur-data";
import { DURATION, EASE_AURA } from "@/lib/motion";

interface LightboxProps {
  items: readonly GalleryItem[];
  /** Índice abierto, o `null` si está cerrado. */
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

/**
 * Visor de la galería, escrito a mano.
 *
 * No se usa librería porque lo que hace falta acá es poco y muy específico:
 * navegación circular, teclado, focus trap y una transición compartida con la
 * miniatura. Cualquier paquete de lightbox pesaría más que este archivo y
 * traería su propio CSS a pelearse con la paleta.
 */
export function Lightbox({ items, index, onClose, onNavigate }: LightboxProps) {
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const isOpen = index !== null;
  const total = items.length;

  const goPrev = useCallback(() => {
    if (index === null) return;
    onNavigate((index - 1 + total) % total);
  }, [index, onNavigate, total]);

  const goNext = useCallback(() => {
    if (index === null) return;
    onNavigate((index + 1) % total);
  }, [index, onNavigate, total]);

  /* Teclado: Escape cierra, las flechas navegan, y Tab queda atrapado dentro. */
  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
        return;
      }
      if (event.key !== "Tab") return;

      // Focus trap: se recorren sólo los botones del visor, en ciclo.
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled])",
      );
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, goPrev, goNext]);

  /**
   * Se bloquea el scroll del fondo mientras el visor está abierto. Se guarda el
   * valor anterior en vez de asumir "" porque otro componente (el menú móvil)
   * puede haberlo tocado antes.
   */
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  /* Al abrir, el foco entra al botón de cerrar. Devolverlo a la miniatura es
     responsabilidad de Gallery, que es quien sabe cuál se pulsó. */
  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  const item = index === null ? null : items[index];

  return (
    <AnimatePresence>
      {isOpen && item ? (
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Galería de trabajos"
          className="fixed inset-0 z-60 flex flex-col items-center justify-center bg-espresso/92 p-4 backdrop-blur-sm sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: reduced ? DURATION.reduced : 0.25,
            ease: EASE_AURA,
          }}
          // Cierra sólo si el click fue en el fondo, no en la imagen ni en un botón.
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar la galería"
            className="absolute top-4 right-4 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-cream/10 text-cream transition-colors duration-300 hover:bg-cream/20"
          >
            <X className="size-5" aria-hidden="true" />
          </button>

          <div className="flex w-full max-w-5xl items-center justify-center gap-3 sm:gap-6">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Foto anterior"
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-cream/10 text-cream transition-colors duration-300 hover:bg-cream/20"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>

            {/* `layoutId` hace que la miniatura crezca hasta acá. Con movimiento
                reducido se pasa `undefined` y queda sólo el fade del fondo. */}
            <motion.div
              layoutId={reduced ? undefined : `galeria-${index}`}
              className="min-w-0 flex-1"
              onClick={(event) => event.stopPropagation()}
            >
              <Image
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                sizes="(max-width: 640px) 90vw, 70vw"
                className="mx-auto max-h-[78svh] w-auto rounded-2xl object-contain"
                {...blurProps(item.src)}
              />
            </motion.div>

            <button
              type="button"
              onClick={goNext}
              aria-label="Foto siguiente"
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full bg-cream/10 text-cream transition-colors duration-300 hover:bg-cream/20"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>

          <p className="mt-5 text-sm text-cream/70">
            {index + 1} / {total}
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
