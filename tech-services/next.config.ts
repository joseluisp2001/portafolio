import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    /*
      OJO: `localPatterns` es una LISTA BLANCA. Todo lo que no calce devuelve
      400 — no un aviso, un 400 seco. Faltaban las imagenes de la raiz, asi que
      /hero.jpg y /sobre-nosotros.jpg daban 400 y el hero salia VACIO. Se veia
      como si el sitio estuviera roto y no habia ningun error en los logs.

      Si se agrega una imagen nueva fuera de estas carpetas, hay que agregarla
      aca tambien.
    */
    localPatterns: [
      { pathname: '/hero.jpg', search: '' },
      { pathname: '/sobre-nosotros.jpg', search: '' },
      { pathname: '/logo.png', search: '' },
      {
        pathname: '/servicios/**',
        search: '',
      },
      {
        pathname: '/galeria/**',
        search: '',
      },
      {
        pathname: '/productos/**',
        search: '',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
