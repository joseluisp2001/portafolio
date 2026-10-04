import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Salida "standalone": el build copia sólo lo que hace falta para correr
  // (server.js + el subconjunto de node_modules que usa), así la imagen de
  // Docker pesa decenas de MB en vez de cientos. Es lo que permite montar el
  // sitio en el VPS sin arrastrar todo el proyecto.
  /*
    `standalone` es lo que hace que la imagen de Docker pese decenas de MB en
    vez de cientos, y es como se despliega en el VPS.

    Pero en Windows ese modo intenta crear symlinks dentro de .next/standalone
    para los paquetes de pnpm, y Windows no lo permite sin modo desarrollador:
    el build compila entero y recién al final muere con EPERM. Se lee como si el
    código estuviera roto, y no lo está.

    Se decide por plataforma y no por una variable de entorno a propósito: el
    VPS es Linux, así que el despliegue sigue generando standalone exactamente
    igual que antes, sin tener que acordarse de pasar nada.
  */
  output: process.platform === "win32" ? undefined : "standalone",
};

export default nextConfig;
