import { ImageResponse } from "next/og";

import { site } from "@/config/site";

export const alt = `${site.brand.name} — ${site.brand.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * La tarjeta que se ve cuando alguien pega el link en WhatsApp o Instagram.
 *
 * Se genera con `ImageResponse` en vez de subir un PNG a mano para que siga a
 * `config/site.ts`: si cambia el nombre o el tagline, la tarjeta cambia sola y
 * nadie tiene que acordarse de reexportar nada desde Figma.
 *
 * Ojo: esto corre en el runtime Edge, donde no hay CSS. Sólo funciona un
 * subconjunto de flexbox, así que nada de grid, y cada contenedor con más de
 * un hijo necesita `display: flex` explícito.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#FAF6F2", // cream
          // Un halo blush arriba a la derecha, para que no sea un rectángulo plano.
          backgroundImage:
            "radial-gradient(circle at 78% 18%, #E8C4C0 0%, rgba(232,196,192,0) 46%)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#9A524C", // rose-ink
          }}
        >
          {site.contact.address.city} · {site.contact.address.country}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 96,
            lineHeight: 1.05,
            color: "#2E2422", // espresso
          }}
        >
          {site.brand.name}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 36,
            lineHeight: 1.3,
            maxWidth: 820,
            color: "#6F5C55", // mocha
          }}
        >
          {site.brand.tagline}
        </div>

        {/* Filete dorado: el mismo detalle fino que separa secciones en el sitio. */}
        <div
          style={{
            display: "flex",
            marginTop: 48,
            width: 160,
            height: 3,
            backgroundColor: "#9A7818", // gold-ink
          }}
        />
      </div>
    ),
    size,
  );
}
