import { cn } from "@/lib/cn";
import { Reveal } from "@/components/Reveal";

interface SectionHeadingProps {
  /** Kicker en mayúsculas sobre el título. Opcional: un `group` casi nunca
   *  necesita uno, porque la sección que lo contiene ya lo puso. */
  eyebrow?: string;
  title: string;
  /** Párrafo corto debajo del título. Opcional. */
  intro?: string;
  align?: "left" | "center";
  className?: string;
  /**
   * Nivel del encabezado. La página tiene un solo `h1`, en el hero.
   * Por defecto sigue a `size`: `h2` para `section`, `h3` para `group`.
   */
  as?: "h2" | "h3" | "h4";
  /**
   * El escalón de jerarquía.
   *
   * `section` abre una sección entera. `group` titula un bloque dentro de
   * ella —una categoría de servicios, un grupo de preguntas— con el mismo
   * lenguaje pero un peldaño abajo. Antes ese caso se resolvía a mano con un
   * `<h3 className="font-display text-h3">` suelto en cada sección, y cada
   * copia se iba corriendo un poco de las demás.
   */
  size?: "section" | "group";
  /**
   * Filete decorativo bajo el encabezado. Le da arranque a un bloque cuando
   * no hay eyebrow que lo anuncie. Es puramente ornamental: va `aria-hidden`.
   */
  rule?: boolean;
}

/**
 * El encabezado que abre cada sección o cada bloque dentro de ella.
 *
 * El eyebrow usa `rose-ink` en vez de `rose` porque es texto de 12px: `rose`
 * da 2.59:1 sobre cream y no pasa AA. Ver `scripts/check-contrast.mjs`.
 * El filete sí puede ser `rose`: es relleno, no lleva significado y nadie
 * tiene que leerlo.
 */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  className,
  as,
  size = "section",
  rule = false,
}: SectionHeadingProps) {
  const centered = align === "center";
  const group = size === "group";
  // Un `group` cuelga siempre de un `h2`, así que su lugar natural es `h3`.
  // Se puede forzar otro nivel con `as` cuando el anidamiento real difiere.
  const Heading = as ?? (group ? "h3" : "h2");

  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        centered && "mx-auto text-center",
        className,
      )}
    >
      {/* El eyebrow va en espresso, no en rose-ink: ver el bloque del fondo
          ambiental en globals.css. En rose-ink era el texto que ponia el techo
          de los alfas del fondo. */}
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-espresso">
          {eyebrow}
        </p>
      ) : null}
      <Heading
        className={cn(
          // `font-display` explícito: globals.css sólo lo pone hasta `h3`, y
          // este encabezado también puede renderizarse como `h4`.
          "font-display text-balance text-espresso",
          group ? "text-h3" : "text-h2",
          eyebrow && (group ? "mt-2" : "mt-4"),
        )}
      >
        {title}
      </Heading>
      {intro ? (
        <p
          className={cn(
            "leading-relaxed text-mocha",
            group ? "mt-2 text-sm" : "mt-5 text-body",
          )}
        >
          {intro}
        </p>
      ) : null}
      {rule ? (
        <div
          aria-hidden="true"
          className={cn(
            "h-px",
            group ? "mt-5" : "mt-7",
            centered
              ? "mx-auto w-24 bg-linear-to-r from-transparent via-rose to-transparent"
              : "w-16 bg-linear-to-r from-rose to-transparent",
          )}
        />
      ) : null}
    </Reveal>
  );
}
