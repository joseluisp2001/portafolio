/**
 * Estilos de botón en un solo lugar.
 *
 * Devuelve clases en vez de exportar un componente para que sirvan igual en un
 * `<a>`, un `<button>` o un `motion.a` sin duplicar nada.
 *
 * Accesibilidad: todas las variantes garantizan un área táctil de al menos
 * 44x44 px (`min-h-11` = 2.75rem) y heredan el `:focus-visible` global de
 * `globals.css`, que dibuja el anillo `rose-ink` de 2px con offset.
 */

import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "outline" | "quiet";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full " +
  "font-medium tracking-wide whitespace-nowrap transition-colors " +
  "duration-300 ease-aura select-none";

const variants: Record<ButtonVariant, string> = {
  // Espresso sobre cream: 14.03:1
  primary: "bg-espresso text-cream hover:bg-rose-ink shadow-soft",
  // Espresso sobre blush: 9.41:1
  secondary: "bg-blush text-espresso hover:bg-rose",
  outline:
    "border border-espresso/15 bg-transparent text-espresso hover:border-espresso/35 hover:bg-sand",
  quiet: "bg-transparent text-mocha hover:text-espresso",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(base, variants[variant], sizes[size], className);
}
