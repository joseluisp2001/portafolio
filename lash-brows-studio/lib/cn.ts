import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Une clases condicionales y resuelve los choques de Tailwind quedándose con
 * la última. Sin esto, `cn("px-4", "px-6")` dejaría las dos y ganaría la que
 * el CSS ordene, no la que se pasó al final.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
