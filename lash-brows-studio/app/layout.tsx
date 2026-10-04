import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";

import { INTRO_SCRIPT } from "@/components/Intro";
import { site } from "@/config/site";
import { siteUrl } from "@/lib/site-url";

import "./globals.css";

/**
 * Cormorant Garamond para títulos, Inter para todo lo demás.
 * `next/font` las auto-hospeda: cero peticiones a Google en tiempo de
 * ejecución, cero salto de fuente al cargar.
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "500"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const title = `${site.brand.name} — ${site.brand.tagline}`;

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: title,
    template: `%s · ${site.brand.name}`,
  },
  description: site.brand.shortDescription,
  applicationName: site.brand.name,
  alternates: { canonical: "/" },
  keywords: [
    "extensiones de pestañas",
    "pestañas pelo a pelo",
    "volumen ruso",
    "diseño de cejas",
    "laminado de cejas",
    site.contact.address.city,
    site.contact.address.country,
  ],
  openGraph: {
    type: "website",
    locale: "es_CR",
    url: siteUrl,
    siteName: site.brand.name,
    title,
    description: site.brand.shortDescription,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.brand.shortDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  // El mismo `cream` del fondo, para que la barra del navegador no corte.
  themeColor: "#FAF6F2",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: INTRO_SCRIPT le pone `data-intro` al <html>
    // antes de que React hidrate, a propósito. La capa la dibuja app/page.tsx:
    // en /manager, que comparte este layout, una carga de marca sólo estorba.
    <html
      lang="es-CR"
      className={`${cormorant.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body className="bg-cream text-espresso antialiased">{children}</body>
    </html>
  );
}
