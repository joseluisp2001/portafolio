"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {};
  }
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  // En el servidor no hay preferencia que leer. Se asume "sin reducir" para
  // que el HTML sea idéntico en las dos ramas y no haya error de hidratación;
  // apenas monta en el cliente, React re-renderiza con el valor real.
  return false;
}

/**
 * `true` si el sistema pide reducir el movimiento.
 *
 * Se usa para apagar parallax, marquee y transformaciones, dejando sólo fades
 * cortos. `useSyncExternalStore` en lugar de `useState` + `useEffect` porque
 * reacciona si la persona cambia la preferencia con la página abierta.
 *
 * Ojo: es la mitad JS de la regla. La otra mitad vive en `globals.css`, dentro
 * de `@media (prefers-reduced-motion: reduce)`, y cubre las animaciones CSS.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
